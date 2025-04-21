import { startBackup } from '$lib/executions/run';
import { getJob } from '$lib/queries/jobs';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
    const jobId = parseInt(params.jobId);
    if (isNaN(jobId) || jobId < 0) {
        return json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
        return json({ error: 'Job not found' }, { status: 404 });
    }

    const res = await startBackup(job);
    if (res.isErr()) {
        return json(res.error, { status: 500 });
    } else {
        return json(res.value, { status: 201 });
    }
};
