import { parseRequestBody } from '$lib/schemas';
import { storagesCheckRequest, type StoragesCheckResponse } from '$lib/schemas/api';
import { type CheckPathError, checkPathForCreate, type CheckPathResult } from '$lib/storages/checks';
import { getRepositoryStats } from '$lib/storages/restic';
import type { ResticError } from '$lib/types/restic';
import { apiError, apiSuccess } from '$lib/utils/responses';
import { Result } from 'neverthrow';
import type { RequestHandler } from './$types';


export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, storagesCheckRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const isLocal = !!body.value.url.match(/^(local:|\/|\.|\\\\|[a-zA-Z]:)/);

    // If local: check if the path is valid
    let checkPathResult: Result<CheckPathResult, CheckPathError> | null = null;
    if (isLocal) {
        checkPathResult = await checkPathForCreate(body.value.url.replace('local:', ''));
        if (checkPathResult.isErr()) {
            return apiSuccess<StoragesCheckResponse>({
                error: checkPathResult.error.error,
                newLocalUrl: checkPathResult.error.path ?? null,
                isLocalFolderEmptyEmpty: null,
                resticError: null,
            });
        }
    }

    // If checkRepository is true, check if the repository is initialized
    let resticError: ResticError | null = null;
    if (body.value.password && body.value.checkRepository) {
        const resticInfo = await getRepositoryStats(
            checkPathResult ? `local:${checkPathResult.value.path}` : body.value.url,
            body.value.password,
            body.value.env || {},
        );
        resticError = resticInfo.isErr() ? resticInfo.error : null;
    }

    return apiSuccess<StoragesCheckResponse>({
        error: null,
        newLocalUrl: checkPathResult?.value.path ? `local:${checkPathResult!.value.path}` : null,
        isLocalFolderEmptyEmpty: checkPathResult?.value.isEmpty ?? null,
        resticError,
    });
};
