import { apiError, apiSuccess } from '$lib/server/api/responses';
import { parseRequestBody } from '$lib/server/schemas';
import { storagesCheckRequest, type StoragesCheckResponse } from '$lib/server/schemas/api';
import { getRepositoryStats } from '$lib/server/services/restic';
import { type CheckPathError, checkPathForCreate, type CheckPathResult } from '$lib/server/storages/checks';
import type { ResticError } from '$lib/types/restic';
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
