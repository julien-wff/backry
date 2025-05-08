import { db } from '$lib/db';
import { executions, jobDatabases, jobs, storages } from '$lib/db/schema';
import { desc, eq, isNull } from 'drizzle-orm';

export const executionsListFull = async () => db.query.executions.findMany({
    orderBy: [ desc(executions.startedAt) ],
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
});

export const getExecution = async (id: number) =>
    db.query.executions.findFirst({
        where: eq(executions.id, id),
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
    });


/**
 * Get all restic snapshot IDs for a given storage ID from the list of executions.
 * @param storageId Storage ID
 * @return Array of snapshot IDs
 */
export const getSnapshotsIdsByStorageId = (storageId: number) =>
    db
        .select({ snapshotId: executions.snapshotId })
        .from(executions)
        .leftJoin(jobDatabases, eq(jobDatabases.id, executions.jobDatabaseId))
        .leftJoin(jobs, eq(jobs.id, jobDatabases.jobId))
        .leftJoin(storages, eq(storages.id, jobs.storageId))
        .where(eq(storages.id, storageId))
        .orderBy(desc(executions.startedAt))
        .all()
        .map(exec => exec.snapshotId)
        .filter((snapshotId): snapshotId is string => snapshotId !== null);


export const deleteExecution = async (id: number) =>
    db
        .delete(executions)
        .where(eq(executions.id, id))
        .returning()
        .get();

export const createExecution = async (jobDatabaseId: number, fileName: string, runId: number | null = null) =>
    db
        .insert(executions)
        .values({
            jobDatabaseId,
            fileName,
            runId: runId ?? undefined,
        })
        .returning()
        .get();

export const updateExecution = async (id: number, payload: Partial<typeof executions.$inferInsert>) =>
    db
        .update(executions)
        .set(payload)
        .where(eq(executions.id, id))
        .returning()
        .get();

/**
 * Set all unfinished executions to error.
 * Used on startup to set all executions that are still running to error.
 */
export const setUnfinishedExecutionsToError = async () => db
    .update(executions)
    .set({
        error: 'Job timed out',
    })
    .where(isNull(executions.finishedAt))
    .returning()
    .get();
