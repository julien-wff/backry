import { checkPath } from '$lib/storages/checks';
import { getRepositoryStats, type ResticError } from '$lib/storages/restic';
import type { StoragesCheckLocalRequest, StoragesCheckLocalResponse } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';


export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as StoragesCheckLocalRequest;

    const checkPathResult = await checkPath(body.url);
    if (checkPathResult.isErr()) {
        return json({
            error: checkPathResult.error.error,
            path: checkPathResult.error.path,
        } as StoragesCheckLocalResponse, { status: 400 });
    }

    let resticError: ResticError | null = null;
    if (!checkPathResult.value.isEmpty && body.password && body.checkRepository) {
        const resticInfo = await getRepositoryStats(
            `local:${checkPathResult.value.path}`,
            body.password,
            body.env || {},
        );
        resticError = resticInfo.isErr() ? resticInfo.error : null;
    }

    return json({
        error: null,
        path: checkPathResult.value.path,
        isEmpty: checkPathResult.value.isEmpty,
        resticError,
    } as StoragesCheckLocalResponse, { status: 200 });
};
