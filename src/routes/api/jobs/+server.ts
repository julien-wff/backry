import { runJob } from '$lib/backups/runJob';
import { createJob } from '$lib/queries/jobs';
import { parseRequestBody } from '$lib/schemas';
import { jobRequest, type JobResponse } from '$lib/schemas/api';
import { addOrUpdateCronJob } from '$lib/shared/cron';
import { apiError, apiSuccess } from '$lib/utils/responses';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await parseRequestBody(request, jobRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    const job = await createJob(body.value);

    if (job.status === 'active')
        addOrUpdateCronJob(`job:${job.id}`, job.cron, () => {
            runJob(job.id);
        });

    return apiSuccess<JobResponse>(job, 201);
};
