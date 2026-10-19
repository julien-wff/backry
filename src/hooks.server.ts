import type { ServerInit } from '@sveltejs/kit/hooks';
import { runBackupJob } from '#lib/server/backups/run-backup-job.ts';
import { checkAllActiveDatabases } from '#lib/server/databases/checks.ts';
import { db } from '#lib/server/db/index.ts';
import { executeDatabaseMaintenance } from '#lib/server/db/maintenance.ts';
import { setUnfinishedBackupsToError } from '#lib/server/queries/backups.ts';
import { getJobsToRun } from '#lib/server/queries/jobs.ts';
import { setUnfinishedRestoresToError } from '#lib/server/queries/restores.ts';
import { logger } from '#lib/server/services/logger.ts';
import { refreshSettingsCache } from '#lib/server/settings/settings.ts';
import { addOrUpdateCronJob, cronNextExecutions, validCronOrDefault } from '#lib/server/shared/cron.ts';
import { computeToolChecksSuccess } from '#lib/server/shared/tool-checks.ts';
import { checkAllActiveRepositories } from '#lib/server/storages/checks.ts';
import { updateAllStoragesHealth } from '#lib/server/storages/health.ts';
import dayjs from 'dayjs';
import { migrate } from 'drizzle-orm/bun-sql/migrator';

export const init: ServerInit = async () => {
    logger.info('Applying database migrations...');

    // @ts-expect-error
    await migrate(db, { migrationsFolder: './drizzle' });

    // Enable foreign key constraints
    db.$client.run('PRAGMA foreign_keys = ON;');

    logger.info('Migrations applied successfully, starting up Backry...');

    // Load settings
    await refreshSettingsCache();

    // Schedule cron jobs
    addOrUpdateCronJob(
        'system:check-storages',
        validCronOrDefault(
            process.env.BACKRY_STORAGE_CHECK_CRON,
            '*/10 * * * *',
            'storage check',
        ),
        () => checkAllActiveRepositories(),
    );

    addOrUpdateCronJob(
        'system:check-dbs',
        validCronOrDefault(
            process.env.BACKRY_DATABASE_CHECK_CRON,
            '*/10 * * * *',
            'databases check',
        ),
        () => checkAllActiveDatabases(),
    );
    addOrUpdateCronJob(
        'system:update-storages-health',
        validCronOrDefault(
            process.env.BACKRY_STORAGE_HEALTH_CRON,
            '5,35 * * * *',
            'storage health',
        ),
        () => updateAllStoragesHealth(),
    );
    addOrUpdateCronJob(
        'system:db-maintenance',
        validCronOrDefault(
            process.env.BACKRY_DB_MAINTENANCE_CRON,
            '30 4 * * *',
            'database maintenance',
        ),
        () => executeDatabaseMaintenance(),
    );

    await Promise.all([
        setUnfinishedBackupsToError(),
        setUnfinishedRestoresToError(),
    ]);

    const jobs = await getJobsToRun();
    for (const job of jobs) {
        addOrUpdateCronJob(`job:${job.id}`, job.cron, () => runBackupJob(job.id));
    }

    await computeToolChecksSuccess();

    //  If next check run is >30s away, run it now in the background
    void (async () => {
        if (
            dayjs(cronNextExecutions('system:check-storages')[0]).diff(
                dayjs(),
                'second',
            ) > 30
        ) {
            await checkAllActiveRepositories();
        }

        if (
            dayjs(cronNextExecutions('system:check-dbs')[0]).diff(dayjs(), 'second') >
            30
        ) {
            await checkAllActiveDatabases();
        }

        if (
            dayjs(cronNextExecutions('system:update-storages-health')[0]).diff(
                dayjs(),
                'second',
            ) > 30
        ) {
            await updateAllStoragesHealth();
        }
    })();

    logger.info('Backry started successfully');
};
