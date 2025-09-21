import { apiError, apiSuccess } from '$lib/server/api/responses';
import { deleteBackup, getBackup } from '$lib/server/queries/backups';
import type { BackupResponse } from '$lib/server/schemas/api';
import { deleteSnapshots } from '$lib/server/services/restic';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
    const backupId = parseInt(params.id);
    if (isNaN(backupId) || backupId < 0) {
        return apiError('Invalid backup ID', 400);
    }

    const backup = await getBackup(backupId);
    if (!backup) {
        return apiError('Backup not found', 404);
    }

    if (!backup.error && !backup.finishedAt) {
        return apiError('Backup is not finished', 400);
    }

    // Delete from restic if completed
    const storage = backup.jobDatabase.job.storage;
    if (backup.snapshotId) {
        const res = await deleteSnapshots(storage.url, storage.password!, storage.env, [ backup.snapshotId ]);
        if (res.isErr()) {
            return apiError(res.error.message, 500);
        }
    }

    const res = await deleteBackup(backupId);
    return apiSuccess<BackupResponse>(res!);
};
