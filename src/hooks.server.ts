import { addOrUpdateCronJob } from '$lib/cron';
import { checkAllActiveDatabases } from '$lib/engines/checks';
import { startBackup } from '$lib/executions/run';
import { setUnfinishedExecutionsToError } from '$lib/queries/executions';
import { getJobsToExecute } from '$lib/queries/jobs';
import { checkAllActiveRepositories } from '$lib/storages/checks';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
    addOrUpdateCronJob('system:check-storages',
        '* * * * *',
        () => checkAllActiveRepositories(),
    );

    addOrUpdateCronJob(
        'system:check-dbs',
        '* * * * *',
        () => checkAllActiveDatabases(),
    );

    await setUnfinishedExecutionsToError();

    const jobs = await getJobsToExecute();
    for (const job of jobs) {
        addOrUpdateCronJob(
            `job:${job.id}`,
            job.cron,
            () => startBackup(job.id),
        );
    }
};
