import { checkAllActiveDatabases } from '$lib/engines/checks';
import { runJob } from '$lib/executions/runJob';
import { setUnfinishedExecutionsToError } from '$lib/queries/executions';
import { getJobsToExecute } from '$lib/queries/jobs';
import { addOrUpdateCronJob } from '$lib/shared/cron';
import { checkAllActiveRepositories } from '$lib/storages/checks';
import { logger } from '$lib/utils/logger';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
    logger.info('Starting up Backry...');

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
            () => runJob(job.id),
        );
    }

    logger.info('Backry started successfully');
};
