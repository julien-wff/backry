<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Clock, Database } from '$lib/components/icons';
    import type { getRestoreFull } from '$lib/server/queries/restores';
    import { getRestoreStatus } from '$lib/helpers/restore';
    import { formatUtcDate } from '$lib/helpers/format';

    interface Props {
        restore: NonNullable<Awaited<ReturnType<typeof getRestoreFull>>>;
    }

    let { restore }: Props = $props();
    let loading = $state(false);

    const dbName = $derived(restore.backup?.jobDatabase.database.name ?? 'Unknown database');
</script>


<BaseListElement detailsHref="/restores/{restore.id}"
                 disabled={loading}
                 status={getRestoreStatus(restore)}
                 title={dbName}>
    <div class="flex items-center gap-1">
        <Clock class="w-4 h-4"/>
        <span>
            Started: {restore.createdAt ? formatUtcDate(restore.createdAt) : 'N/A'}
        </span>
    </div>
    <div class="flex items-center gap-1">
        <Database class="w-4 h-4"/>
        <span>
            Destination: {restore.destination === 'current' ? dbName : 'Other database'}
        </span>
    </div>
</BaseListElement>
