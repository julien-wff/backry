import { apiError, apiSuccess } from '$lib/server/api/responses';
import { runBackupJob } from '$lib/server/backups/run-backup-job';
import { deleteJob, updateJob, updateJobStatus } from '$lib/server/queries/jobs';
import { parseRequestBody } from '$lib/server/schemas';
import { jobPatchRequest, jobRequest, type JobResponse } from '$lib/server/schemas/api';
import { addOrUpdateCronJob, stopCronJob } from '$lib/server/shared/cron';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
    const jobId = parseInt(params.id);
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
    const jobId = parseInt(params.id);
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
            runBackupJob(jobId);
        });
    }

    return apiSuccess<JobResponse>(updatedJob);
};


export const PATCH: RequestHandler = async ({ params, request }) => {
    const jobId = parseInt(params.id);
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
            runBackupJob(jobId);
        });
    }

    return apiSuccess<JobResponse>(updatedJob);
};
