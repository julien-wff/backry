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

dayjs.extend(utc);

interface UploadSession {
    process: ReturnType<typeof Bun.spawn<'pipe', 'pipe', 'pipe'>>;
    controller: AbortController;
    backup: typeof backups.$inferSelect;
    error?: string;
}

const uploadSessions = new Map<number, UploadSession>();


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
        msg => handleResticSummaryMessage(backup, msg),
        err => handleResticErrorMessage(backup, err),
    );

    uploadSessions.set(backup.id, {
        process,
        controller,
        backup,
    });

    return ok(backup);
}


export async function uploadChunkToSession(backupId: number, chunk: ArrayBuffer): Promise<Result<void, string>> {
    const session = uploadSessions.get(backupId);
    if (!session) {
        return err(`No active upload session found for backup #${backupId}`);
    }

    if (session.error) {
        return err(session.error);
    }

    session.process.stdin.write(chunk);

    return ok();
}


export async function finishUploadSession(backupId: number): Promise<Result<typeof backups.$inferSelect, string>> {
    const session = uploadSessions.get(backupId);
    if (!session) {
        return err(`No active upload session found for backup #${backupId}`);
    }

    const cancelTimeout = setTimeout(() => {
        console.warn(`Upload session for backup #${backupId} is taking too long to finish, aborting...`);
        session.controller.abort();
    }, 10_000);

    session.process.stdin.end();
    await session.process.exited;

    clearTimeout(cancelTimeout);

    uploadSessions.delete(backupId);

    const updatedBackup = await updateBackup(backupId, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
    });

    updateRun(session.backup.runId, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        totalBackupsCount: 1,
        successfulBackupsCount: 1,
        prunedSnapshotsCount: 0,
    });

    return ok(updatedBackup);
}

async function handleResticSummaryMessage(backup: typeof backups.$inferSelect, summary: ResticBackupSummary | ResticBackupStatus) {
    if (summary.message_type === 'summary') {
        const updatedBackup = await updateBackup(backup.id, {
            // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
            finishedAt: sql`(CURRENT_TIMESTAMP)`,
            dumpSize: summary?.total_bytes_processed,
            dumpSpaceAdded: summary?.data_added_packed,
            duration: summary?.total_duration,
            snapshotId: summary?.snapshot_id,
        });
        backupEmitter.emit('update', updatedBackup);
    } else {
        backupEmitter.emit('update', {
            id: backup.id,
            duration: dayjs.utc(backup.startedAt).diff(),
            dumpSize: summary.bytes_done ?? null,
        });
    }
}

async function handleResticErrorMessage(backup: typeof backups.$inferSelect, error: ResticError) {
    const updatedBackup = await updateBackup(backup.id, {
        // @ts-expect-error only accepts string, sql is not supported in type definition (but is for drizzle)
        finishedAt: sql`(CURRENT_TIMESTAMP)`,
        error: error.message,
    });
    backupEmitter.emit('update', updatedBackup);
    uploadSessions.set(backup.id, {
        ...uploadSessions.get(backup.id)!,
        error: error.message,
    });
    logger.error(`Error when uploading backup #${backup.id}: ${error.message}`);
}
