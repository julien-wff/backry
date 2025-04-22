import { CronJob } from 'cron';

type SystemCronId = `system:${'check-dbs' | 'check-storages'}`;
type JobCronId = `job:${number}`;
export type CronId = SystemCronId | JobCronId;

export const cronJobs: Map<CronId, CronJob> = new Map();
