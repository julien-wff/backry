import { deleteJob, updateJob } from '$lib/queries/jobs';
import { stopCronJob } from '$lib/shared/cron';
import type { JobsCreateRequest } from '$lib/types/api';
import { json, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const jobId = parseInt(params.jobId || '');
    if (isNaN(jobId) || jobId < 0) {
        return json({ error: 'Invalid job ID' }, { status: 400 });
    }

    // Delete from database
    const deletedJob = await deleteJob(jobId);
    if (!deletedJob) {
        return json({ error: 'Job not found' }, { status: 404 });
    }

    // Stop cron job
    stopCronJob(`job:${jobId}`);

    return json({});
};


export const PUT: RequestHandler = async ({ params, request }) => {
    const jobId = parseInt(params.jobId || '');
    if (isNaN(jobId) || jobId < 0) {
        return json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const body: JobsCreateRequest = await request.json();
    if (!body) {
        return json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Update job in database
    const updatedJob = await updateJob(jobId, body);
    if (!updatedJob) {
        return json({ error: 'Job not found' }, { status: 404 });
    }

    return json(updatedJob);
};
