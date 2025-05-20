import { apiError, apiSuccess } from '$lib/server/api/responses';
import { createStorage } from '$lib/server/queries/storages';
import { parseRequestBody } from '$lib/server/schemas';
import { storageRequest, type StorageResponse } from '$lib/server/schemas/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, storageRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const result = createStorage(body.value);
    return apiSuccess<StorageResponse>(result, 201);
};
