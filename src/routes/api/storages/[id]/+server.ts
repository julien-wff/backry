import { deleteStorage, updateStorage } from '$lib/queries/storages';
import { parseRequestBody } from '$lib/schemas';
import { storageRequest, type StorageResponse } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import { type RequestHandler } from '@sveltejs/kit';


export const PUT: RequestHandler = async ({ params, request }) => {
    const storageId = parseInt(params.id || '');
    if (isNaN(storageId) || storageId < 0) {
        return apiError('Invalid storage ID');
    }

    const body = await parseRequestBody(request, storageRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const updatedStorage = updateStorage(storageId, body.value);
    if (!updatedStorage) {
        return apiError('Storage not found', 404);
    }

    return apiSuccess<StorageResponse>(updatedStorage);
};


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
