import { staleLocksCount } from '$lib/helpers/storage';
import { storages } from '$lib/server/db/schema';
import { getSnapshotsIdsByStorageId, getUnprunedSnapshotByStorageId } from '$lib/server/queries/backups';
import { storagesList, updateStorage } from '$lib/server/queries/storages';
import { logger } from '$lib/server/services/logger';
import { getRepositoryLocks, getRepositorySnapshots } from '$lib/server/services/restic';
import type { ResticSnapshot } from '$lib/types/restic';
import { err, ok, type Result } from 'neverthrow';

/**
 * Short information about a backup that doesn't exist in the Restic repo but is not marked as 'pruned' in Backry's DB
 */
export interface Desyncedbackup {
    id: number;
    name: string;
    startedAt: string;
    snapshotShortId: string;
}

/**
 * Check for backups that are marked as 'successful' but their Restic snapshots don't exist anymore in the repository.
 * @param storage The storage object to check for desynced backups.
 * @return A Result containing an array of desynced backups or an error message.
 */
export async function getPruneDesyncBackups(storage: typeof storages.$inferSelect): Promise<Result<Desyncedbackup[], string>> {
    const backups = getUnprunedSnapshotByStorageId(storage.id);
    if (backups.length === 0) {
        return ok([]);
    }

    const res = await getRepositorySnapshots(
        storage.url,
        storage.password!,
        storage.env,
        true,
    );
    if (res.isErr()) {
        return err(res.error.message);
    }
    const snapshots = new Set(res.value[0].map(s => s.id));

    return ok(backups
        .filter(backup => !snapshots.has(backup.snapshotId!))
        .map(backup => ({
            id: backup.id,
            name: `${backup.jobName} - ${backup.databaseName}`,
            startedAt: backup.startedAt!,
            snapshotShortId: backup.snapshotId!.slice(0, 8),
        })),
    );
}


/**
 * Get restic snapshots labelled 'backry' that have no corresponding backup in the database.
 * @param storage The storage object to check for stale snapshots.
 * @return A Result containing an array of stale snapshots or an error message.
 */
export async function getStaleSnapshots(storage: typeof storages.$inferSelect): Promise<Result<ResticSnapshot[], string>> {
    const backupsSnapshotsIds = getSnapshotsIdsByStorageId(storage.id);

    const res = await getRepositorySnapshots(
        storage.url,
        storage.password!,
        storage.env,
        true,
    );
    if (res.isErr()) {
        return err(res.error.message);
    }

    if (res.value.length === 0 || !Array.isArray(res.value[0])) {
        return ok([]);
    } else {
        return ok(res.value[0].filter(snapshot => !backupsSnapshotsIds.includes(snapshot.id)));
    }
}


/**
 * Check the health of a single storage and update its status if necessary.
 * @param storage The storage object to check.
 * @return The updated storage object
 */
export async function updateStorageHealth(storage: typeof storages.$inferSelect) {
    const [ locks, desyncedBackups, staleSnapshots ] = await Promise.all([
        getRepositoryLocks(storage.url, storage.password!, storage.env),
        getPruneDesyncBackups(storage),
        getStaleSnapshots(storage),
    ]);

    const isHealthy = locks.isOk()
        && staleLocksCount(locks.value) === 0
        && desyncedBackups.isOk()
        && desyncedBackups.value.length === 0
        && staleSnapshots.isOk()
        && staleSnapshots.value.length === 0;

    if (storage.status === 'active' && !isHealthy) {
        logger.warn(`Set storage ${storage.name} (${storage.id}) status to 'unhealthy'.`);
        return updateStorage(storage.id, {
            status: 'unhealthy',
        });
    } else if (storage.status === 'unhealthy' && isHealthy) {
        logger.info(`Set storage ${storage.name} (${storage.id}) status back to 'active' from 'unhealthy'.`);
        return updateStorage(storage.id, {
            status: 'active',
        });
    }
}


/**
 * Check all storages for any unhealthy sign. If any, mark the storage as unhealthy.
 */
export async function updateAllStoragesHealth() {
    const stg = await storagesList();

    // Run all checks in parallel for each storage
    await Promise.all(stg.map(updateStorageHealth));
}
