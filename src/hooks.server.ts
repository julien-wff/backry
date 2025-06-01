import { runBackupJob } from '$lib/server/backups/run-backup-job';
import { checkAllActiveDatabases } from '$lib/server/databases/checks';
import { db } from '$lib/server/db';
import { setUnfinishedBackupsToError } from '$lib/server/queries/backups';
import { getJobsToRun } from '$lib/server/queries/jobs';
import { logger } from '$lib/server/services/logger';
import { addOrUpdateCronJob } from '$lib/server/shared/cron';
import { computeToolChecksSuccess } from '$lib/server/shared/tool-checks';
import { checkAllActiveRepositories } from '$lib/server/storages/checks';
import type { ServerInit } from '@sveltejs/kit';
import { migrate } from 'drizzle-orm/bun-sql/migrator';

export const init: ServerInit = async () => {
    logger.info('Applying database migrations...');

    // @ts-expect-error
    await migrate(db, { migrationsFolder: './drizzle' });

    logger.info('Migrations applied successfully, starting up Backry...');

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

    await computeToolChecksSuccess();

    logger.info('Backry started successfully');
};
