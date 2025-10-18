import { apiError, apiSuccess } from '$lib/server/api/responses';
import { parseRequestBody } from '$lib/server/schemas';
import { setupDockerSaveRequest } from '$lib/server/schemas/api';
import { testDockerConnection } from '$lib/server/services/docker';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, setupDockerSaveRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    if (body.value.uri) {
        const checkResult = await testDockerConnection(body.value.uri);

        if (checkResult.isErr()) {
            return apiError(`${checkResult.error.code}: ${checkResult.error.message}`, 400);
        }
    }

    return apiSuccess<object>({}, 200);
};
