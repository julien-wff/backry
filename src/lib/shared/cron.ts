import { CronJob } from 'cron';

type SystemCronId = `system:${'check-dbs' | 'check-storages'}`;
type JobCronId = `job:${number}`;
export type CronId = SystemCronId | JobCronId;

const cronJobs: Map<CronId, CronJob> = new Map();

/**
 * Add or update an existing cron job.
 * Job will be started immediately, and executed on the host's timezone.
 * @param id Job internal ID.
 * @param cron Cron expression.
 * @param callback Callback function to execute.
 */
export const addOrUpdateCronJob = (id: CronId, cron: string, callback: () => any) => {
    cronJobs.get(id)?.stop();

    const job = new CronJob(
        cron,
        callback,
        null,
        true, // start
        null,
        null,
        null,
        null,
        null,
        true, // waitForCompletion (wait for the last execution to finish before starting a new one)
        null,
        id, // name
    );
    cronJobs.set(id, job);
};

/**
 * Stop a cron job and remove it from the list of jobs.
 * @param id Job internal ID.
 * @returns True if the job was removed, false if it was not found.
 */
export const stopCronJob = (id: CronId) => {
    cronJobs.get(id)?.stop();
    return cronJobs.delete(id);
};
