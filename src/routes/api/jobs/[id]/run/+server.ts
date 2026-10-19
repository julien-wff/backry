import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { runBackupJob } from '#lib/server/backups/run-backup-job.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { jobRunRequest } from '#lib/server/schemas/api.ts';
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

    void runBackupJob(jobId, body.value.databases);
    return apiSuccess({});
};
