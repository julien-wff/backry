import { runJob } from '$lib/backups/runJob';
import { deleteJob, updateJob, updateJobStatus } from '$lib/queries/jobs';
import { parseRequestBody } from '$lib/schemas';
import { jobPatchRequest, jobRequest, type JobResponse } from '$lib/schemas/api';
import { addOrUpdateCronJob, stopCronJob } from '$lib/shared/cron';
import { apiError, apiSuccess } from '$lib/utils/responses';
import { type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params }) => {
    const jobId = parseInt(params.id || '');
    if (isNaN(jobId) || jobId < 0) {
        return apiError('Invalid job ID');
    }

    // Delete from database
    const deletedJob = await deleteJob(jobId);
    if (!deletedJob) {
        return apiError('Job not found', 404);
    }

    // Stop cron job
    stopCronJob(`job:${jobId}`);

    return apiSuccess<JobResponse>(deletedJob);
};


export const PUT: RequestHandler = async ({ params, request }) => {
    const jobId = parseInt(params.id || '');
    if (isNaN(jobId) || jobId < 0) {
        return apiError('Invalid job ID');
    }

    const body = await parseRequestBody(request, jobRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    // Update job in database
    const updatedJob = await updateJob(jobId, body.value);
    if (!updatedJob) {
        return apiError('Job not found', 404);
    }

    // Update cron job
    if (updatedJob.status === 'inactive') {
        stopCronJob(`job:${jobId}`);
    } else {
        addOrUpdateCronJob(`job:${jobId}`, updatedJob.cron, () => {
            runJob(jobId);
        });
    }

    return apiSuccess<JobResponse>(updatedJob);
};


export const PATCH: RequestHandler = async ({ params, request }) => {
    const jobId = parseInt(params.id || '');
    if (isNaN(jobId) || jobId < 0) {
        return apiError('Invalid job ID');
    }

    // Validate request body
    const body = await parseRequestBody(request, jobPatchRequest);
    if (body.isErr()) {
        return apiError(body.error);
    }

    // Update job in database
    const updatedJob = await updateJobStatus(jobId, body.value.status);
    if (!updatedJob) {
        return apiError('Job not found', 404);
    }

    // Update cron job
    if (updatedJob.status === 'inactive') {
        stopCronJob(`job:${jobId}`);
    } else {
        addOrUpdateCronJob(`job:${jobId}`, updatedJob.cron, () => {
            runJob(jobId);
        });
    }

    return apiSuccess<JobResponse>(updatedJob);
};
