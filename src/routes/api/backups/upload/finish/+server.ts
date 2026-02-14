import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$lib/server/api/responses';
import { finishUploadSession } from '$lib/server/backups/upload-backup';

export const POST: RequestHandler = async ({ url }) => {
    const backupId = Number.parseInt(url.searchParams.get('backupId') || '', 10);
    if (Number.isNaN(backupId) || backupId < 0) {
        return apiError('Missing or invalid `backupId` query parameter');
    }

    const res = await finishUploadSession(backupId);
    if (res.isErr()) {
        return apiError(res.error);
    }

    return apiSuccess(res.value);
};
