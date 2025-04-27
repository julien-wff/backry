import { deleteJob } from '$lib/queries/jobs';
import { stopCronJob } from '$lib/shared/cron';
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
