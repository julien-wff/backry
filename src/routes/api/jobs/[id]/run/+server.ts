import { runJob } from '$lib/backups/runJob';
import { parseRequestBody } from '$lib/schemas';
import { jobRunRequest } from '$lib/schemas/api';
import { apiError, apiSuccess } from '$lib/utils/responses';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
    const body = await parseRequestBody(request, jobRunRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const jobId = parseInt(params.id);
    if (isNaN(jobId) || jobId < 0) {
        return apiError('Invalid job ID', 400);
    }

    void runJob(jobId, body.value.databases);
    return apiSuccess({});
};
