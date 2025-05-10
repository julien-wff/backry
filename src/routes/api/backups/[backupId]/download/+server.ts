import { getBackup } from '$lib/queries/backups';
import { readFileContent } from '$lib/storages/restic';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
    const backupId = parseInt(params.backupId || '');
    if (isNaN(backupId) || backupId < 0) {
        return json({ error: 'Invalid backup ID' }, { status: 400 });
    }

    const backup = await getBackup(backupId);
    if (!backup) {
        return json({ error: 'Backup not found' }, { status: 404 });
    }

    if (backup.error || !backup.finishedAt || !backup.snapshotId || !backup.dumpSize) {
        return json({ error: 'Backup is not in a successful state' }, { status: 400 });
    }

    if (backup.dumpSize > 10e6) {
        return json({ error: 'File too large to download' }, { status: 400 });
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
        return json({ error: content.error.message }, { status: 500 });
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
