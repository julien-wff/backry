import { logger } from '$lib/server/services/logger';
import { deleteOldPrunedBackups } from '$lib/server/queries/backups';
import { deleteRunsWithNoBackups } from '$lib/server/queries/runs';

const OLD_BACKUPS_DAYS = 30;

export async function executeDatabaseMaintenance() {
    logger.info('Starting database maintenance...');

    const oldBackups = await deleteOldPrunedBackups(OLD_BACKUPS_DAYS);
    logger.info(`Deleted ${oldBackups.length} pruned backups older than ${OLD_BACKUPS_DAYS} days.`);

    const lonelyRuns = await deleteRunsWithNoBackups();
    logger.info(`Deleted ${lonelyRuns.length} runs with no backups.`);

    logger.info('Database maintenance completed successfully.');
}
