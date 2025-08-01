import { runBackupJob } from '$lib/server/backups/run-backup-job';
import { checkAllActiveDatabases } from '$lib/server/databases/checks';
import { db } from '$lib/server/db';
import { setUnfinishedBackupsToError } from '$lib/server/queries/backups';
import { getJobsToRun } from '$lib/server/queries/jobs';
import { logger } from '$lib/server/services/logger';
import { addOrUpdateCronJob, validCronOrDefault } from '$lib/server/shared/cron';
import { computeToolChecksSuccess } from '$lib/server/shared/tool-checks';
import { checkAllActiveRepositories } from '$lib/server/storages/checks';
import { updateAllStoragesHealth } from '$lib/server/storages/health';
import type { ServerInit } from '@sveltejs/kit';
import { migrate } from 'drizzle-orm/bun-sql/migrator';

export const init: ServerInit = async () => {
    logger.info('Applying database migrations...');

    // @ts-expect-error
    await migrate(db, { migrationsFolder: './drizzle' });

    logger.info('Migrations applied successfully, starting up Backry...');

    addOrUpdateCronJob('system:check-storages',
        validCronOrDefault(process.env.BACKRY_STORAGE_CHECK_CRON, '*/10 * * * *', 'storage check'),
        () => checkAllActiveRepositories(),
    );

    addOrUpdateCronJob(
        'system:check-dbs',
        validCronOrDefault(process.env.BACKRY_DATABASE_CHECK_CRON, '*/10 * * * *', 'databases check'),
        () => checkAllActiveDatabases(),
    );

    addOrUpdateCronJob(
        'system:update-storages-health',
        validCronOrDefault(process.env.BACKRY_STORAGE_HEALTH_CRON, '5,35 * * * *', 'storage health'),
        () => updateAllStoragesHealth(),
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
