import { apiError, apiSuccess } from '$lib/server/api/responses';
import { deleteStorage, updateStorage } from '$lib/server/queries/storages';
import { parseRequestBody } from '$lib/server/schemas';
import { storagePatchRequest, storageRequest, type StorageResponse } from '$lib/server/schemas/api';
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


export const PATCH: RequestHandler = async ({ params, request }) => {
    const storageId = parseInt(params.id || '');
    if (isNaN(storageId) || storageId < 0) {
        return apiError('Invalid storage ID');
    }

    const body = await parseRequestBody(request, storagePatchRequest);
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
