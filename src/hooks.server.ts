import { runJob } from '$lib/backups/runJob';
import { checkAllActiveDatabases } from '$lib/engines/checks';
import { setUnfinishedBackupsToError } from '$lib/queries/backups';
import { getJobsToRun } from '$lib/queries/jobs';
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

    await setUnfinishedBackupsToError();

    const jobs = await getJobsToRun();
    for (const job of jobs) {
        addOrUpdateCronJob(
            `job:${job.id}`,
            job.cron,
            () => runJob(job.id),
        );
    }

    logger.info('Backry started successfully');
};
