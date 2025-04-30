<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import EngineIndicator from '$lib/components/common/EngineIndicator.svelte';
    import { EthernetPort } from '$lib/components/icons';
    import type { databases } from '$lib/db/schema';

    interface Props {
        database: typeof databases.$inferSelect;
    }

    let { database }: Props = $props();
    let status = $state(database.status);
    let loading = $state(false);

    async function deleteDatabase() {
        loading = true;
        const res = await fetch(`/api/databases/${database.id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            await invalidateAll();
        }

        loading = false;
    }
</script>


<BaseListElement disabled={loading}
                 editHref={`/databases/${database.id}`}
                 error={database.error}
                 ondelete={deleteDatabase}
                 status={status}
                 title={database.name}>
    <EngineIndicator engine={database.engine}/>
    <div class="flex items-center gap-1">
        <EthernetPort class="w-4 h-4"/>
        {database.connectionString}
    </div>
</BaseListElement>
