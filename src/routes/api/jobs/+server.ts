import { runJob } from '$lib/backups/runJob';
import { createJob } from '$lib/queries/jobs';
import { addOrUpdateCronJob } from '$lib/shared/cron';
import type { JobsCreateRequest } from '$lib/types/api';
import { json } from '@sveltejs/kit';
import { validateCronExpression } from 'cron';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as JobsCreateRequest;

    // Validate the cron
    const cronValidation = validateCronExpression(body.cron);
    if (!cronValidation.valid || cronValidation.error) {
        return json(
            { error: `Invalid cron: ${cronValidation.error?.message}` || 'Invalid cron' },
            { status: 400 },
        );
    }

    const job = await createJob(body);

    if (job.status === 'active')
        addOrUpdateCronJob(`job:${job.id}`, job.cron, () => {
            runJob(job.id);
        });

    return json(job, { status: 201 });
};
