import { startBackup } from '$lib/executions/run';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
    const jobId = parseInt(params.jobId);
    if (isNaN(jobId) || jobId < 0) {
        return json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const res = await startBackup(jobId);
    if (res.isErr()) {
        return json(res.error, { status: 500 });
    } else {
        return json(res.value, { status: 201 });
    }
};
