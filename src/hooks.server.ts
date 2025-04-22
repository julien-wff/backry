import { cronJobs } from '$lib/cron';
import { checkAllActiveDatabases } from '$lib/engines/checks';
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

    cronJobs.set('system:check-dbs', new CronJob(
        '* * * * *',
        () => checkAllActiveDatabases(),
        null,
        true,
    ));
};
