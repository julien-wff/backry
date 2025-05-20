import { runBackupJob } from '$lib/server/backups/run-backup-job';
import { checkAllActiveDatabases } from '$lib/server/databases/checks';
import { setUnfinishedBackupsToError } from '$lib/server/queries/backups';
import { getJobsToRun } from '$lib/server/queries/jobs';
import { checkAllActiveRepositories } from '$lib/server/storages/checks';
import { addOrUpdateCronJob } from '$lib/server/shared/cron';
import { logger } from '$lib/server/services/logger';
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
            () => runBackupJob(job.id),
        );
    }

    logger.info('Backry started successfully');
};
