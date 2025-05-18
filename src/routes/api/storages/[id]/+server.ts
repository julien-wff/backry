import { deleteStorage } from '$lib/queries/storages';
import type { StorageResponse } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import { type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const storageId = parseInt(params.id || '');
    if (isNaN(storageId) || storageId < 0) {
        return apiError('Invalid storage ID');
    }

    // Delete from database
    const deletedStorage = deleteStorage(storageId);
    if (!deletedStorage) {
        return apiError('Storage not found', 404);
    }

    return apiSuccess<StorageResponse>(deletedStorage);
};
