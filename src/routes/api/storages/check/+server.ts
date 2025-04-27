import { type CheckPathError, checkPathForCreate, type CheckPathResult } from '$lib/storages/checks';
import { getRepositoryStats } from '$lib/storages/restic';
import type { StoragesCheckRequest, StoragesCheckResponse } from '$lib/types/api';
import type { ResticError } from '$lib/types/restic';
import { json } from '@sveltejs/kit';
import { Result } from 'neverthrow';
import type { RequestHandler } from './$types';


export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as StoragesCheckRequest;
    const isLocal = !!body.url.match(/^(local:|\/|\.|\\\\|[a-zA-Z]:)/);

    // If local: check if the path is valid
    let checkPathResult: Result<CheckPathResult, CheckPathError> | null = null;
    if (isLocal) {
        checkPathResult = await checkPathForCreate(body.url.replace('local:', ''));
        if (checkPathResult.isErr()) {
            return json({
                error: checkPathResult.error.error,
                newLocalUrl: checkPathResult.error.path,
            } as StoragesCheckResponse, { status: 400 });
        }
    }

    // If checkRepository is true, check if the repository is initialized
    let resticError: ResticError | null = null;
    if (body.password && body.checkRepository) {
        const resticInfo = await getRepositoryStats(
            checkPathResult ? `local:${checkPathResult.value.path}` : body.url,
            body.password,
            body.env || {},
        );
        resticError = resticInfo.isErr() ? resticInfo.error : null;
    }

    return json({
        error: null,
        newLocalUrl: checkPathResult?.value.path ? `local:${checkPathResult!.value.path}` : null,
        isLocalFolderEmptyEmpty: checkPathResult?.value.isEmpty,
        resticError,
    } as StoragesCheckResponse, { status: 200 });
};
