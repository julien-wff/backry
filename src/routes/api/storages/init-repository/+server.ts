import { parseRequestBody } from '$lib/schemas';
import { storageInitRepositoryRequest } from '$lib/schemas/api';
import { initRepository } from '$lib/storages/restic';
import { apiError, apiSuccess } from '$lib/utils/responses';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, storageInitRepositoryRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const res = await initRepository(
        body.value.url,
        body.value.password,
        body.value.env,
    );

    if (res.isErr()) {
        return apiError(res.error.message);
    }

    return apiSuccess({ output: res.value[0] }, 201);
};
