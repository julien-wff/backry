<script lang="ts">
    import type { getBackup } from '$lib/server/queries/backups';
    import { ENGINES_META } from '$lib/common/engines-meta';
    import { formatSize } from '$lib/helpers/format';

    interface Props {
        backup: NonNullable<Awaited<ReturnType<typeof getBackup>>>;
        selectedDestination: 'current' | 'other';
        otherConnectionString: string;
        dropDatabase: boolean;
        contrasted?: boolean;
    }

    let { backup, selectedDestination, otherConnectionString, dropDatabase, contrasted = false }: Props = $props();

    const engineMeta = $derived(ENGINES_META[backup.jobDatabase.database.engine]);
</script>

<div class="alert mb-2" class:bg-base-100={contrasted} role="alert">
    <div>
        <h3 class="font-bold">Source</h3>
        <div>Job: {backup.jobDatabase.job.name}</div>
        <div>Database: {backup.jobDatabase.database.name} ({engineMeta.displayName})</div>
        <div>Backup date: {new Date(backup.finishedAt ?? '').toLocaleString()}</div>
        <div>
            Restic snapshot: {backup.fileName}, {formatSize(backup.dumpSize ?? 0)} ({backup.snapshotId?.slice(0, 12)})
        </div>
    </div>
</div>

<div class="alert" class:bg-base-100={contrasted} role="alert">
    <div>
        <h3 class="font-bold">Destination</h3>
        <div>
            Target:
            {#if selectedDestination === 'current'}
                same database ({backup.jobDatabase.database.name})
            {:else}
                other database ({otherConnectionString})
            {/if}
        </div>
        <div>Drop and recreate: {dropDatabase ? 'yes' : 'no'}</div>
    </div>
</div>
