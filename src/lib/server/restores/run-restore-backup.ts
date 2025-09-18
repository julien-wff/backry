import type { getBackup } from '$lib/server/queries/backups';
import { DATABASE_ENGINES, restores } from '$lib/server/db/schema';
import { logger } from '$lib/server/services/logger';
import { listSnapshotFiles, pipeFileContentToCommand } from '$lib/server/services/restic';
import { err, ok, type Result } from 'neverthrow';
import { createRestore, setRestoreToFinished, updateRestore as updateRestoreDb } from '$lib/server/queries/restores';
import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import type { RESTORE_DESTINATION } from '$lib/common/constants';
import { restoreEmitter } from '$lib/server/shared/events';

interface RunRestoreBackupArgs {
    backup: NonNullable<Awaited<ReturnType<typeof getBackup>>>;
    selectedDestination: typeof RESTORE_DESTINATION[number];
    otherConnectionString?: string | null;
    dropDatabase: boolean;
    onRestoreCreated?: (restore: typeof restores.$inferSelect) => void;
}

/**
 * Emit restore update event and update restore in DB
 * @param id Restore ID
 * @param payload Partial restore data to update
 * @returns Updated restore from DB
 */
function updateRestore(id: number, payload: Partial<typeof restores.$inferSelect>) {
    restoreEmitter.emit('update', { id, ...payload });
    return updateRestoreDb(id, payload);
}

/**
 * Handle restore failure: update restore in DB, log error, and return err result
 * @param restore Restore object
 * @param error Error message
 * @returns Err result with error message
 */
function restoreFailed(restore: typeof restores.$inferSelect, error: string) {
    updateRestore(restore.id, { error, finishedAt: new Date().toISOString() });
    logger.error(`Restore #${restore.id} failed: ${error}`);
    return err(error);
}

/**
 * Run the restore process for a given backup.
 * @param backup Backup to restore
 * @param selectedDestination Destination type for the restore (current, other)
 * @param otherConnectionString Connection string if destination is 'other'
 * @param dropDatabase Whether to drop the existing database before restoring
 * @param onRestoreCreated Callback when the restore is initially created in the DB, so it can be returned to the client
 *                         immediately, and then updated via events
 * @returns Result of the restore operation
 */
export async function runRestoreBackup({
                                           backup,
                                           selectedDestination,
                                           otherConnectionString,
                                           dropDatabase,
                                           onRestoreCreated,
                                       }: RunRestoreBackupArgs): Promise<Result<void, string>> {
    const connectionString = otherConnectionString ?? backup.jobDatabase.database.connectionString;
    const restore = createRestore({
        backupId: backup.id,
        connectionString,
        destination: selectedDestination,
        dropDatabase: dropDatabase ? 1 : 0,
    });
    onRestoreCreated?.(restore);

    const engineMethods = ENGINES_METHODS[backup.jobDatabase.database.engine];

    logger.info(`Starting restore #${restore.id} of backup #${backup.id} to ${selectedDestination} database...`);

    // ENSURE SNAPSHOT FILE EXISTS

    const storage = backup.jobDatabase.job.storage;
    const repoFiles = await listSnapshotFiles(storage.url, storage.password!, storage.env, backup.snapshotId!);
    if (repoFiles.isErr()) {
        return restoreFailed(restore, `Failed to list snapshot files: ${repoFiles.error.message}`);
    }

    const isFilePresentInRepo = repoFiles.value.some(
        f => 'message_type' in f
            && f.message_type === 'node'
            && f.type === 'file'
            && f.name === backup.fileName,
    );

    if (!isFilePresentInRepo) {
        return restoreFailed(restore, `Snapshot ${backup.fileName} file not found in storage`);
    }

    logger.info(`Snapshot file ${backup.fileName} verified for backup #${backup.id}`);

    // CHECK DESTINATION DB

    updateRestore(restore.id, { currentStep: 'check_destination' });

    const dbCheckResult = await engineMethods.checkConnection(connectionString);
    if (dbCheckResult.isErr() && !ignoreDbPingError(backup.jobDatabase.database.engine, dbCheckResult.error, dropDatabase)) {
        return restoreFailed(restore, `Failed to connect to destination database: ${dbCheckResult.error}`);
    }

    logger.info(`Connection to destination database verified for restore #${restore.id}`);

    // DROP AND RECREATE DATABASE

    if (dropDatabase) {
        updateRestore(restore.id, { currentStep: 'drop_db' });
        if (!('recreateDatabase' in engineMethods) || !engineMethods.recreateDatabase) {
            return restoreFailed(restore, `Engine "${backup.jobDatabase.database.engine}" does not support dropping and recreating databases`);
        }

        logger.info(`Dropping and recreating destination database for restore #${restore.id}...`);

        const dropResult = await engineMethods.recreateDatabase?.(connectionString);
        if (dropResult?.isErr()) {
            return restoreFailed(restore, `Failed to drop and recreate database: ${dropResult.error}`);
        }
        logger.info(`Destination database dropped and recreated for restore #${restore.id}`);
    }

    // RUN RESTORE

    updateRestore(restore.id, { currentStep: 'restore' });
    if (!('getRestoreBackupFromStdinCommand' in engineMethods) || !engineMethods.getRestoreBackupFromStdinCommand) {
        return restoreFailed(restore, `Engine "${backup.jobDatabase.database.engine}" does not support restoring from stdin`);
    }

    logger.info(`Running restore command for restore #${restore.id}...`);

    const restoreRes = await pipeFileContentToCommand(
        storage.url,
        storage.password!,
        storage.env,
        backup.snapshotId!,
        backup.fileName,
        engineMethods.getRestoreBackupFromStdinCommand(connectionString),
    );
    if (restoreRes.isErr()) {
        return restoreFailed(restore, `Failed to restore backup: ${restoreRes.error.message}`);
    }

    logger.info(`Restore command completed for restore #${restore.id}, checking result...`);

    // DONE

    const finishedRestore = setRestoreToFinished(restore.id, restoreRes.value);
    restoreEmitter.emit('update', finishedRestore);
    logger.info(`Restore #${restore.id} completed successfully`);

    return ok();
}

/**
 * Ignore certain database ping errors that are not critical.
 * For example, in PostgreSQL, if the database does not exist, we might want to ignore that if we plan to recreate it.
 * @param engine Database engine
 * @param error Error message from the ping attempt
 * @param recreateDb Whether we plan to recreate the database
 * @returns True if the error can be ignored, false otherwise
 */
function ignoreDbPingError(engine: typeof DATABASE_ENGINES[number], error: string, recreateDb: boolean) {
    if (engine === 'postgresql' && recreateDb && error.match(/database ".+" does not exist/)) {
        return true;
    }

    return false;
}
