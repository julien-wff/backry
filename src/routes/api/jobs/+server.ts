import { apiError, apiSuccess } from '$lib/server/api/responses';
import { runBackupJob } from '$lib/server/backups/run-backup-job';
import { createJob } from '$lib/server/queries/jobs';
import { parseRequestBody } from '$lib/server/schemas';
import { jobRequest, type JobResponse } from '$lib/server/schemas/api';
import { addOrUpdateCronJob } from '$lib/server/shared/cron';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, jobRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const job = await createJob(body.value);

    if (job.status === 'active')
        addOrUpdateCronJob(`job:${job.id}`, job.cron, () => {
            runBackupJob(job.id);
        });

    return apiSuccess<JobResponse>(job, 201);
};
