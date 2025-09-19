import { runBackupJob } from '$lib/server/backups/run-backup-job';
import { checkAllActiveDatabases } from '$lib/server/databases/checks';
import { db } from '$lib/server/db';
import { setUnfinishedBackupsToError } from '$lib/server/queries/backups';
import { getJobsToRun } from '$lib/server/queries/jobs';
import { logger } from '$lib/server/services/logger';
import { addOrUpdateCronJob, cronNextExecutions, validCronOrDefault } from '$lib/server/shared/cron';
import { computeToolChecksSuccess } from '$lib/server/shared/tool-checks';
import { checkAllActiveRepositories } from '$lib/server/storages/checks';
import { updateAllStoragesHealth } from '$lib/server/storages/health';
import type { ServerInit } from '@sveltejs/kit';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import { executeDatabaseMaintenance } from '$lib/server/db/maintenance';
import { setUnfinishedRestoresToError } from '$lib/server/queries/restores';
import dayjs from 'dayjs';

export const init: ServerInit = async () => {
    logger.info('Applying database migrations...');

    // @ts-expect-error
    await migrate(db, { migrationsFolder: './drizzle' });

    // Enable foreign key constraints
    db.$client.run('PRAGMA foreign_keys = ON;');

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

    addOrUpdateCronJob(
        'system:db-maintenance',
        validCronOrDefault(process.env.BACKRY_DB_MAINTENANCE_CRON, '30 4 * * *', 'database maintenance'),
        () => executeDatabaseMaintenance(),
    );

    await Promise.all([
        setUnfinishedBackupsToError(),
        setUnfinishedRestoresToError(),
    ]);

    const jobs = await getJobsToRun();
    for (const job of jobs) {
        addOrUpdateCronJob(
            `job:${job.id}`,
            job.cron,
            () => runBackupJob(job.id),
        );
    }

    await computeToolChecksSuccess();

    // For health checks are in more than 30 secs, run them now in the background
    void (async () => {
        if (dayjs(cronNextExecutions('system:check-storages')[0]).diff(dayjs(), 'second') > 30) {
            await checkAllActiveRepositories();
        }

        if (dayjs(cronNextExecutions('system:check-dbs')[0]).diff(dayjs(), 'second') > 30) {
            await checkAllActiveDatabases();
        }

        if (dayjs(cronNextExecutions('system:update-storages-health')[0]).diff(dayjs(), 'second') > 30) {
            await updateAllStoragesHealth();
        }
    })();

    logger.info('Backry started successfully');
};
