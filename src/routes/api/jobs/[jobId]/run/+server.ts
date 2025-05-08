import { startBackup } from '$lib/executions/run';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
    let databasesToRun: number[] | null = null;
    if (request.headers.get('Content-Type') === 'application/json') {
        const body = await request.json();
        if (Array.isArray(body.databases)) {
            databasesToRun = body.databases;
        }
    }

    const jobId = parseInt(params.jobId);
    if (isNaN(jobId) || jobId < 0) {
        return json({ error: 'Invalid job ID' }, { status: 400 });
    }

    void startBackup(jobId, databasesToRun);
    return json({});
};
