import { db } from '$lib/server/db';
import { backups, databases, jobDatabases, jobs, storages } from '$lib/server/db/schema';
import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

export const backupsListFull = async () => db.query.backups.findMany({
    orderBy: [ desc(backups.startedAt) ],
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
        run: true,
    },
});

export const getBackup = async (id: number) =>
    db.query.backups.findFirst({
        where: eq(backups.id, id),
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
 * Get all restic snapshot IDs for a given storage ID from the list of backups.
 * @param storageId Storage ID
 * @return Array of snapshot IDs
 */
export const getSnapshotsIdsByStorageId = (storageId: number) =>
    db
        .select({ snapshotId: backups.snapshotId })
        .from(backups)
        .leftJoin(jobDatabases, eq(jobDatabases.id, backups.jobDatabaseId))
        .leftJoin(jobs, eq(jobs.id, jobDatabases.jobId))
        .leftJoin(storages, eq(storages.id, jobs.storageId))
        .where(eq(storages.id, storageId))
        .orderBy(desc(backups.startedAt))
        .all()
        .map(backup => backup.snapshotId)
        .filter((snapshotId): snapshotId is string => snapshotId !== null);


/**
 * Get selected information for backups that are not pruned and have no error (so the snapshot should still exist).
 * @param storageId Storage ID
 * @return Array of snapshot IDs with some backup information
 */
export const getUnprunedSnapshotByStorageId = (storageId: number) =>
    db
        .select({
            id: backups.id,
            snapshotId: backups.snapshotId,
            jobName: jobs.name,
            databaseName: databases.name,
            startedAt: backups.startedAt,
        })
        .from(backups)
        .where(and(
            isNotNull(backups.snapshotId),
            isNull(backups.prunedAt),
            isNull(backups.error),
            eq(storages.id, storageId),
        ))
        .leftJoin(jobDatabases, eq(jobDatabases.id, backups.jobDatabaseId))
        .leftJoin(databases, eq(databases.id, jobDatabases.databaseId))
        .leftJoin(jobs, eq(jobs.id, jobDatabases.jobId))
        .leftJoin(storages, eq(storages.id, jobs.storageId))
        .orderBy(desc(backups.startedAt))
        .all();


export const deleteBackup = async (id: number) =>
    db
        .delete(backups)
        .where(eq(backups.id, id))
        .returning()
        .get();

export const createBackup = async (jobDatabaseId: number, fileName: string, runId: number) =>
    db
        .insert(backups)
        .values({
            jobDatabaseId,
            fileName,
            runId,
        })
        .returning()
        .get();

export const updateBackup = async (id: number, payload: Partial<typeof backups.$inferInsert>) =>
    db
        .update(backups)
        .set(payload)
        .where(eq(backups.id, id))
        .returning()
        .get();

/**
 * Set all unfinished backups to error.
 * Used on startup to set all backups that are still running to error.
 */
export const setUnfinishedBackupsToError = async () => db
    .update(backups)
    .set({
        error: 'Job timed out',
    })
    .where(isNull(backups.finishedAt))
    .returning()
    .get();

/**
 * Set the prunedAt timestamp for backups, given snapshot IDs.
 * @param snapshotIds Array of snapshot IDs
 * @return Array of updated backups
 */
export const setBackupsToPruned = (snapshotIds: string[]) =>
    db
        .update(backups)
        .set({
            prunedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(
            inArray(backups.snapshotId, snapshotIds),
        )
        .returning()
        .execute();

/**
 * Set the prunedAt timestamp for backups, given backup IDs.
 * @param backupIds Array of backup IDs
 * @return Array of updated backups
 */
export const setBackupsToPrunedById = (backupIds: number[]) =>
    db
        .update(backups)
        .set({
            prunedAt: sql`(CURRENT_TIMESTAMP)`,
        })
        .where(
            inArray(backups.id, backupIds),
        )
        .returning()
        .execute();
