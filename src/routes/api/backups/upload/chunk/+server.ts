import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$lib/server/api/responses';
import { uploadChunkToSession } from '$lib/server/backups/upload-backup';

export const POST: RequestHandler = async ({ url, request }) => {
    const backupId = Number.parseInt(url.searchParams.get('backupId') || '', 10);
    if (Number.isNaN(backupId) || backupId < 0) {
        return apiError('Missing or invalid `backupId` query parameter');
    }

    const form = await request.formData();

    if (!form.has('chunk')) {
        return apiError('Missing `chunk` form field');
    }

    const chunk = form.get('chunk');
    if (!(chunk instanceof File)) {
        return apiError('`chunk` form field must be a file');
    }

    const res = await uploadChunkToSession(backupId, await chunk.arrayBuffer());
    if (res.isErr()) {
        return apiError(res.error);
    }

    return apiSuccess({});
};
