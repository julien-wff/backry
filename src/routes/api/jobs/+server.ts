import { apiError, apiSuccess } from '#lib/server/api/responses.ts';
import { runBackupJob } from '#lib/server/backups/run-backup-job.ts';
import { createJob } from '#lib/server/queries/jobs.ts';
import { parseRequestBody } from '#lib/server/schemas/index.ts';
import { jobRequest, type JobResponse } from '#lib/server/schemas/api.ts';
import { addOrUpdateCronJob } from '#lib/server/shared/cron.ts';
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
