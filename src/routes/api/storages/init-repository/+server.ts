import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { storageInitRepositoryRequest } from '#lib/server/schemas/api.ts';
import { initRepository } from '#lib/server/services/restic.ts';
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
