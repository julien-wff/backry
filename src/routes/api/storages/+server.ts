import { createStorage } from '$lib/queries/storages';
import { parseRequestBody } from '$lib/schemas';
import { storageCreateRequest, type StorageResponse } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, storageCreateRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const result = createStorage(body.value);
    return apiSuccess<StorageResponse>(result, 201);
};
