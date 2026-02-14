import { type backups, type databases, type jobs } from '$lib/server/db/schema';
import type { EngineMethods } from '$lib/types/engine';
import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { createBackup, updateBackup } from '$lib/server/queries/backups';
import { err, ok, Result } from 'neverthrow';
import { getIntersectingJobDatabase } from '$lib/server/queries/shared';
import { createRun, updateRun } from '$lib/server/queries/runs';
import { createStdinUploadProcess } from '$lib/server/services/restic';
import { getStorage } from '$lib/server/queries/storages';
import { sql } from 'drizzle-orm';
import type { ResticBackupStatus, ResticBackupSummary, ResticError } from '$lib/types/restic';
import { backupEmitter } from '$lib/server/shared/events';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { logger } from '$lib/server/services/logger';
import { formatDuration } from '$lib/helpers/format';

dayjs.extend(utc);

interface UploadSession {
    process: ReturnType<typeof Bun.spawn<'pipe', 'pipe', 'pipe'>>;
    controller: AbortController;
    backup: typeof backups.$inferSelect;
    idleTimeout?: NodeJS.Timeout;
}

const uploadSessions = new Map<number, UploadSession>();

const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 min


/**
 * Creates a new upload session for a backup, which involves:
 * 1. Validating the job and database association
 * 2. Creating new `run` and `backup` records in the database
 * 3. Spawning a restic process to handle the upload
 * 4. Setting up handlers for restic output and errors
 * 5. Managing session state and timeouts
 * @param job Associated job for which the backup is being created
 * @param database Associated database for which the backup is being created
 * @returns The created backup record or an error message if the session could not be created
 */
export async function createUploadSession(job: typeof jobs.$inferSelect,
                                          database: typeof databases.$inferSelect,
): Promise<Result<typeof backups.$inferSelect, string>> {
    const jobDatabase = await getIntersectingJobDatabase(job.id, database.id);
    if (!jobDatabase) {
        return err(`No corresponding job database found for the given job (#${job.id}) and database (#${database.id})`);
    }

    const storage = getStorage(job.storageId)!;

    const engine: EngineMethods = ENGINES_METHODS[database.engine];
    const fileName = `${job.slug}_${database.slug}.${engine.dumpFileExtension}`;

    const run = createRun('manual');
    const backup = await createBackup(jobDatabase.id, fileName, run.id);
    backupEmitter.emit('update', backup);

    const controller = new AbortController();

    const { process } = await createStdinUploadProcess(
        storage.url,
        storage.password!,
        storage.env,
        fileName,
        [
            `jobId:${job.id}`,
            `dbId:${database.id}`,
        ],
        controller.signal,
        msg => handleResticMessage(backup, msg),
        err => handleResticErrorMessage(backup, err),
    );

    uploadSessions.set(backup.id, {
        process,
        controller,
        backup,
    });

    resetIdleTimer(backup.id);

    return ok(backup);
}


/**
 * Push a chunk of data to the restic process's stdin for the given backup's upload session.
 * Also resets the session's idle timeout to prevent it from being aborted due to inactivity.
 * @param backupId ID of the backup whose upload session should receive the chunk
 * @param chunk The chunk of data to be uploaded, as an ArrayBuffer
 * @returns void if the chunk was successfully written to the process, or an error message if the session is not found or has an existing error
 */
export async function uploadChunkToSession(backupId: number, chunk: ArrayBuffer): Promise<Result<void, string>> {
    const session = uploadSessions.get(backupId);
    if (!session) {
        return err(`No active upload session found for backup #${backupId}`);
    }

    if (session.backup.error) {
        return err(session.backup.error);
    }

    resetIdleTimer(backupId);

    const written = session.process.stdin.write(chunk);
    if (written < chunk.byteLength) {
        await session.process.stdin.flush();
    }

    return ok();
}


/**
 * Ends the stdin stream and waiting for the restic process to exit.
 * @param backupId ID of the backup whose upload session should be finished
 * @returns The updated backup record if the upload was successful, or an error message if the session is not found or if the upload failed
 */
export async function finishUploadSession(backupId: number): Promise<Result<typeof backups.$inferSelect, string>> {
    const session = uploadSessions.get(backupId);
    if (!session) {
        return err(`No active upload session found for backup #${backupId}`);
    }

    clearTimeout(session.idleTimeout);

    const cancelTimeout = setTimeout(() => {
        console.warn(`Upload session for backup #${backupId} is taking too long to finish, aborting...`);
        session.controller.abort();
    }, 10_000);

    session.process.stdin.end();
    await session.process.exited;

    clearTimeout(cancelTimeout);

    const failed = !!session.backup.error || session.process.exitCode !== 0;
    const updatedBackup = await updateDbOnEnd(backupId, {
        error: failed && !session.backup.error ? `restic exited with code ${session.process.exitCode}` : session.backup.error,
    });

    uploadSessions.delete(backupId);

    if (failed) {
        return err(session.backup.error ?? `restic exited with code ${session.process.exitCode}`);
    }

    return ok(updatedBackup);
}


/**
 * Kills the restic process and mark the backup as failed
 * @param backupId ID of the backup whose upload session should be aborted
 * @returns The updated backup record if the session was successfully aborted, or an error message if the session is not found
 */
export async function abortUploadSession(backupId: number): Promise<Result<typeof backups.$inferSelect, string>> {
    const session = uploadSessions.get(backupId);
    if (!session) {
        return err(`No active upload session found for backup #${backupId}`);
    }

    clearTimeout(session.idleTimeout);
    session.controller.abort();
    await session.process.exited;
    logger.warn(`Upload session for backup #${backupId} aborted by user, restic process exited with code ${session.process.exitCode}`);

    const updatedBackup = await updateDbOnEnd(backupId, {
        error: `Upload session aborted`,
    });
    uploadSessions.delete(backupId);

    return ok(updatedBackup);
}


/**
 * Update backup and run records in the database when a backup finishes, either successfully or with an error.
 * Also emits an update event for the backup to push the final status to the client.
 * @param backupId ID of the backup to update
 * @param updates Partial backup fields to update, such as error message or dump size. `finishedAt` will be set to the current timestamp automatically.
 * @returns The updated backup record
 */
async function updateDbOnEnd(backupId: number, updates: Partial<typeof backups.$inferSelect>) {
    const updatedBackup = await updateBackup(backupId, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        ...updates,
    });
    backupEmitter.emit('update', updatedBackup);

    if (uploadSessions.has(backupId)) {
        uploadSessions.set(backupId, {
            ...uploadSessions.get(backupId)!,
            backup: updatedBackup,
        });
    }

    updateRun(updatedBackup.runId, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        totalBackupsCount: 1,
        successfulBackupsCount: updatedBackup.error ? 0 : 1,
        prunedSnapshotsCount: 0,
    });

    return updatedBackup;
}


/**
 * If the message is a summary, it means the backup has completed, we update the record.
 * Else, it's a progress update (status), we push the update to the client via the emitter
 * @param backup The backup record associated with the restic process that emitted the message
 * @param message Message emitted by the restic process
 */
async function handleResticMessage(backup: typeof backups.$inferSelect, message: ResticBackupSummary | ResticBackupStatus) {
    if (message.message_type === 'summary') {
        await updateDbOnEnd(backup.id, {
            dumpSize: message?.total_bytes_processed,
            dumpSpaceAdded: message?.data_added_packed,
            duration: message?.total_duration,
            snapshotId: message?.snapshot_id,
        });
    } else {
        backupEmitter.emit('update', {
            id: backup.id,
            duration: Math.abs(dayjs.utc(backup.startedAt).diff()) / 1000,
            dumpSize: message.bytes_done ?? null,
        });
    }
}


/**
 * Handles errors emitted by the restic process. Finishes the run with the error.
 * @param backup The backup record associated with the restic process that emitted the error
 * @param error Error emitted by the restic process, containing the error message
 */
async function handleResticErrorMessage(backup: typeof backups.$inferSelect, error: ResticError) {
    await updateDbOnEnd(backup.id, {
        error: error.message,
    });
    logger.error(`Error when uploading backup #${backup.id}: ${error.message}`);
}


/**
 * Resets the idle timeout for the upload session of the given backup.
 * If the session has been idle for too long without a chunk upload, it will be aborted and marked as failed.
 * @param backupId ID of the backup whose upload session idle timer should be reset
 */
function resetIdleTimer(backupId: number) {
    const session = uploadSessions.get(backupId);
    if (!session) {
        logger.warn(`Attempted to reset idle timer for non-existent upload session of backup #${backupId}`);
        return;
    }

    clearTimeout(session.idleTimeout);
    session.idleTimeout = setTimeout(async () => {
        logger.warn(`Upload session for backup #${backupId} timed out due to inactivity, aborting...`);
        session.controller.abort();
        await updateDbOnEnd(backupId, {
            error: `Upload session aborted due to inactivity (${formatDuration(SESSION_IDLE_TIMEOUT_MS / 1000)})`,
        });
        uploadSessions.delete(backupId);
    }, SESSION_IDLE_TIMEOUT_MS);
}
