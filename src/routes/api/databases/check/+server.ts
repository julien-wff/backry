import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import { parseRequestBody } from '$lib/schemas';
import { databasesCheckRequest } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, databasesCheckRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const engineInstance = ENGINES_METHODS[body.value.engine];
    const res = await engineInstance.checkConnection(body.value.connectionString);

    if (res.isErr()) {
        return apiError(res.error);
    }

    return apiSuccess<{}>({});
};
