import { apiError, apiSuccess } from '$lib/server/api/responses';
import { createDatabase } from '$lib/server/queries/databases';
import { parseRequestBody } from '$lib/server/schemas';
import { databaseRequest, type DatabaseResponse } from '$lib/server/schemas/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, databaseRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const database = createDatabase(body.value);
    return apiSuccess<DatabaseResponse>(database, 201);
};
