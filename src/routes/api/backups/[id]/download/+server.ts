import { getBackup } from '$lib/server/queries/backups';
import { streamFileContent } from '$lib/server/services/restic';
import { logger } from '$lib/server/services/logger';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
    const backupId = parseInt(params.id || '');
    if (isNaN(backupId) || backupId < 0) {
        return error(400, 'Invalid backup ID');
    }

    const backup = await getBackup(backupId);
    if (!backup) {
        return error(404, 'Backup not found');
    }

    if (backup.error || !backup.finishedAt || !backup.snapshotId || !backup.dumpSize) {
        return error(400, 'Backup is not in a successful state');
    }

    const storage = backup.jobDatabase.job.storage;

    // Stream the file content to avoid buffering the entire file in memory
    const { stream, exitPromise } = await streamFileContent(
        storage.url,
        storage.password!,
        storage.env,
        backup.snapshotId,
        backup.fileName,
    );

    // Log restic exit status asynchronously
    exitPromise
        .then((res) => {
            if (res.isErr()) {
                logger.error(`Failed streaming backup ${backup.id}: ${res.error.message}`);
            }
        })
        .catch((e) => logger.error(`Unexpected stream error for backup ${backup.id}: ${e}`));

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'application/sql',
            'Content-Disposition': `attachment; filename="${backup.fileName}"`,
            'Content-Length': backup.dumpSize.toString(),
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
        },
    });
};
