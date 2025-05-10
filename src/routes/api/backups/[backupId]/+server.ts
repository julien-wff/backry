import { deleteBackup, getBackup } from '$lib/queries/backups';
import { deleteSnapshots } from '$lib/storages/restic';
import { json, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const backupId = parseInt(params.backupId || '');
    if (isNaN(backupId) || backupId < 0) {
        return json({ error: 'Invalid backup ID' }, { status: 400 });
    }

    const backup = await getBackup(backupId);
    if (!backup) {
        return json({ error: 'Backup not found' }, { status: 404 });
    }

    if (!backup.error && !backup.finishedAt) {
        return json({ error: 'Backup is not finished' }, { status: 400 });
    }

    // Delete from restic if completed
    const storage = backup.jobDatabase.job.storage;
    if (backup.snapshotId) {
        const res = await deleteSnapshots(storage.url, storage.password!, storage.env, [ backup.snapshotId ]);
        if (res.isErr()) {
            return json({ error: res.error.message }, { status: 500 });
        }
    }

    const res = await deleteBackup(backupId);
    return json(res);
};
