import { apiError, apiSuccess } from '$lib/server/api/responses';
import { ENGINES_METHODS } from '$lib/server/databases/engines-methods';
import { parseRequestBody } from '$lib/server/schemas';
import { databasesCheckRequest } from '$lib/server/schemas/api';
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
