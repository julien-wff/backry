import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import { parseRequestBody } from '$lib/schemas';
import { databasesCheckRequest } from '$lib/schemas/api';
import type { DatabasesCheckResponse } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, databasesCheckRequest);
    if (body.isErr()) {
        return json({
            error: body.error,
        } satisfies DatabasesCheckResponse, { status: 400 });
    }

    const engineInstance = ENGINES_METHODS[body.value.engine];
    const res = await engineInstance.checkConnection(body.value.connectionString);

    return json({
        error: res.isErr() ? res.error : null,
    } satisfies DatabasesCheckResponse);
};
