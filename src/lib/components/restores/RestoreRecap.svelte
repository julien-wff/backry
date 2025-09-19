<script lang="ts">
    import { ENGINES_META } from '$lib/common/engines-meta';
    import { formatSize, formatUtcDate } from '$lib/helpers/format';
    import type { backups, databases } from '$lib/server/db/schema';

    interface Props {
        backup: Pick<typeof backups.$inferSelect, 'fileName' | 'dumpSize' | 'snapshotId' | 'finishedAt'> | null;
        sourceDatabase: Pick<typeof databases.$inferSelect, 'name' | 'engine'> | null;
        sourceJobName?: string;
        selectedDestination: 'current' | 'other';
        otherConnectionString: string;
        dropDatabase: boolean;
        contrasted?: boolean;
    }

    let {
        backup,
        sourceDatabase,
        sourceJobName,
        selectedDestination,
        otherConnectionString,
        dropDatabase,
        contrasted = false,
    }: Props = $props();

    const engineMeta = $derived(sourceDatabase ? ENGINES_META[sourceDatabase.engine] : null);
</script>

{#if backup && engineMeta}
    <div class="alert mb-2" class:bg-base-100={contrasted} role="alert">
        <div>
            <h3 class="font-bold">Source</h3>
            <div>Job: {sourceJobName}</div>
            <div>Database: {sourceDatabase?.name ?? 'Unknown'} ({engineMeta.displayName})</div>
            <div>Backup date: {formatUtcDate(backup.finishedAt ?? '')}</div>
            <div>
                Restic snapshot:
                {backup.fileName},
                {formatSize(backup.dumpSize ?? 0)}
                {#if backup.snapshotId}
                    ({backup.snapshotId.slice(0, 12)})
                {/if}
            </div>
        </div>
    </div>
{/if}

<div class="alert" class:bg-base-100={contrasted} role="alert">
    <div>
        <h3 class="font-bold">Destination</h3>
        <div>
            Target:
            {#if selectedDestination === 'current'}
                same database
                {#if sourceDatabase}
                    ({sourceDatabase.name})
                {/if}
            {:else}
                other database ({otherConnectionString})
            {/if}
        </div>
        <div>Drop and recreate: {dropDatabase ? 'yes' : 'no'}</div>
    </div>
</div>
