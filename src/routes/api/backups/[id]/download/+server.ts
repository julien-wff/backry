import { getBackup } from '$lib/queries/backups';
import { readFileContent } from '$lib/storages/restic';
import { formatSize } from '$lib/utils/format';
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

    if (backup.dumpSize > 10e6) {
        return error(400, `File too large to download (${formatSize(backup.dumpSize)} > 10 MB)`);
    }

    const storage = backup.jobDatabase.job.storage;
    const content = await readFileContent(
        storage.url,
        storage.password!,
        storage.env,
        backup.snapshotId,
        backup.fileName,
    );

    if (content.isErr()) {
        return error(500, content.error.message);
    }

    return new Response(content.value.join('\n'), {
        status: 200,
        headers: {
            'Content-Type': 'application/sql',
            'Content-Disposition': `attachment; filename="${backup.fileName}"`,
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
        },
    });
};
