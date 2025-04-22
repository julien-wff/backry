import { cronJobs } from '$lib/cron';
import { checkAllActiveRepositories } from '$lib/storages/checks';
import type { ServerInit } from '@sveltejs/kit';
import { CronJob } from 'cron';

export const init: ServerInit = async () => {
    cronJobs.set('system:check-storages', new CronJob(
        '* * * * *',
        () => checkAllActiveRepositories(),
        null,
        true,
    ));
};
