import { startBackup } from '$lib/executions/run';
import { createJob } from '$lib/queries/jobs';
import { addOrUpdateCronJob } from '$lib/shared/cron';
import type { JobsCreateRequest } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as JobsCreateRequest;

    const job = await createJob(body);

    if (job.status === 'active')
        addOrUpdateCronJob(`job:${job.id}`, job.cron, () => {
            startBackup(job.id);
        });

    return json(job, { status: 201 });
};
