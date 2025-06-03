import { storages } from '$lib/server/db/schema';
import { getSnapshotsIdsByStorageId, getUnprunedSnapshotByStorageId } from '$lib/server/queries/backups';
import { getRepositorySnapshots } from '$lib/server/services/restic';
import type { ResticSnapshot } from '$lib/types/restic';
import { err, ok, type ResultAsync } from 'neverthrow';

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
 * @return A ResultAsync containing an array of desynced backups or an error message.
 */
export async function getPruneDesyncBackups(storage: typeof storages.$inferSelect): Promise<ResultAsync<Desyncedbackup[], string>> {
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
 * @return A ResultAsync containing an array of stale snapshots or an error message.
 */
export async function getStaleSnapshots(storage: typeof storages.$inferSelect): Promise<ResultAsync<ResticSnapshot[], string>> {
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
