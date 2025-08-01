import { db } from '$lib/server/db';
import { backups, databases, jobDatabases, jobs, RUN_ORIGIN, runs } from '$lib/server/db/schema';
import { and, desc, eq, isNotNull, isNull, lt, type SQL } from 'drizzle-orm';

/**
 * Create a new run in the database.
 * @param origin The origin of the run (e.g. 'cron', 'manual').
 * @return The created run object.
 */
export const createRun = (origin: typeof RUN_ORIGIN[number]) =>
    db.insert(runs).values({ origin }).returning().get();

/**
 * Update a run in the database.
 */
export const updateRun = (id: number, payload: Partial<typeof runs.$inferInsert>) =>
    db.update(runs).set(payload).where(eq(runs.id, id)).returning().get();


/**
 * Get runs with backups filtered by job ID, database ID, and status.
 * Result includes each run with its backups, database, and job.
 * @param jobId Job ID to filter by, or null for no filter.
 * @param databaseId Database ID to filter by, or null for no filter.
 * @param status Status to filter by: 'success', 'error', 'pruned', or null for no filter.
 * @param limit Maximum number of **backups** to return, defaults to 200. Descending order by ID.
 * @param cursor Cursor for pagination, only used if limit is set.
 *               If provided, only returns **backups** with IDs lower than the cursor.
 * @return Array of runs with their backups and related data.
 */
export async function getRunsWithBackupFilter({ jobId, databaseId, status, limit, cursor }: {
    jobId: number | null,
    databaseId: number | null,
    status: 'success' | 'error' | 'pruned' | null,
    limit?: number,
    cursor?: number,
}) {
    const filters: SQL[] = [];
    if (jobId !== null) {
        filters.push(eq(jobDatabases.jobId, jobId));
    }
    if (databaseId !== null) {
        filters.push(eq(jobDatabases.databaseId, databaseId));
    }
    if (status === 'error') {
        filters.push(isNotNull(backups.error));
    } else if (status === 'pruned') {
        filters.push(isNotNull(backups.prunedAt));
    } else if (status === 'success') {
        filters.push(isNull(backups.error), isNull(backups.prunedAt));
    }

    if (limit && cursor) {
        filters.push(lt(backups.id, cursor));
    }

    const rows = await db
        .select()
        .from(runs)
        .innerJoin(
            backups,
            eq(runs.id, backups.runId),
        )
        .innerJoin(
            jobDatabases,
            eq(backups.jobDatabaseId, jobDatabases.id),
        )
        .innerJoin(
            databases,
            eq(jobDatabases.databaseId, databases.id),
        )
        .innerJoin(
            jobs,
            eq(jobDatabases.jobId, jobs.id),
        )
        .where(and(...filters))
        .limit(limit ?? 200)
        .orderBy(desc(runs.id), desc(backups.id));

    // Group backups by run ID
    // In rows, each row contains a run and a single backup (runs are duplicated for each backup)
    const backupsMap = new Map<number, (typeof backups.$inferSelect & { databaseId: number })[]>();
    for (const row of rows) {
        if (!backupsMap.has(row.runs.id)) {
            backupsMap.set(row.runs.id, []);
        }
        backupsMap.get(row.runs.id)!.push({
            ...row.backups,
            databaseId: row.databases.id,
        });
    }

    const databasesMap = new Map<number, typeof databases.$inferSelect>();
    for (const row of rows) {
        if (!databasesMap.has(row.databases.id)) {
            databasesMap.set(row.databases.id, row.databases);
        }
    }

    const jobsMap = new Map<number, typeof jobs.$inferSelect>();
    for (const row of rows) {
        if (!jobsMap.has(row.jobs.id)) {
            jobsMap.set(row.jobs.id, row.jobs);
        }
    }

    return {
        runs: rows
            .map(row => ({
                ...row.runs,
                jobId: row.jobs.id,
                backups: backupsMap.get(row.runs.id) || [],
            }))
            .filter(run => {
                // Ensure there is at least one backup that matches the filters
                if (run.backups.length === 0) {
                    return false;
                }

                // Deduplicate runs using the backups map keys
                if (!backupsMap.has(run.id)) {
                    return false;
                }

                backupsMap.delete(run.id);
                return true;
            }),
        databases: databasesMap,
        jobs: jobsMap,
        nextPageCursor: rows.length > 0 ? rows.at(-1)!.backups.id : null, // Last backup ID as cursor
        limit: limit ?? 200,
    };
}


/**
 * Get a run by its ID. Conclude the associated backups and their relations.
 * @param id The ID of the run to get.
 * @return The run object, or undefined if not found.
 */
export const getRunFull = (id: number) => db.query.runs.findFirst({
    where: eq(runs.id, id),
    with: {
        backups: {
            with: {
                jobDatabase: {
                    with: {
                        database: true,
                        job: {
                            with: {
                                storage: true,
                            },
                        },
                    },
                },
            },
        },
    },
});

/**
 * Delete a run by its ID. This will also delete all associated backups by the foreign key constraint.
 * @param id The ID of the run to delete.
 * @return The deleted run object.
 */
export const deleteRun = (id: number) => db.delete(runs).where(eq(runs.id, id)).returning().get();
