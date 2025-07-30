import { db } from '$lib/server/db';
import { backups, databases, jobDatabases, jobs, RUN_ORIGIN, runs } from '$lib/server/db/schema';
import { and, desc, eq, isNotNull, isNull, type SQL } from 'drizzle-orm';

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
 * @return Array of runs with their backups and related data.
 */
export async function getRunsWithBackupFilter(jobId: number | null, databaseId: number | null, status: 'success' | 'error' | 'pruned' | null) {
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
        .orderBy(desc(runs.createdAt), desc(backups.startedAt));

    // Group backups by run ID
    // In rows, each row contains a run and a single backup (runs are duplicated for each backup)
    const backupsMap = new Map<number, (typeof backups.$inferSelect)[]>();
    for (const row of rows) {
        if (!backupsMap.has(row.runs.id)) {
            backupsMap.set(row.runs.id, []);
        }
        backupsMap.get(row.runs.id)!.push(row.backups);
    }

    return rows
        .map(row => ({
            ...row.runs,
            backups: backupsMap.get(row.runs.id) || [],
            database: row.databases,
            job: row.jobs,
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
        });
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
