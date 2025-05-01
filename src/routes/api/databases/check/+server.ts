import { ENGINES_METHODS } from '$lib/engines/enginesMethods';
import type { DatabasesCheckRequest, DatabasesCheckResponse } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { url, engine }: DatabasesCheckRequest = await request.json();
    const engineInstance = ENGINES_METHODS[engine];

    const res = await engineInstance.checkConnection(url);

    return json({
        error: res.isErr() ? res.error : null,
    } satisfies DatabasesCheckResponse);
};
