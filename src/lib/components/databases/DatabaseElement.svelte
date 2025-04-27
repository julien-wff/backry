<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import EngineIndicator from '$lib/components/common/EngineIndicator.svelte';
    import type { databases } from '$lib/db/schema';
    import EthernetPort from '@lucide/svelte/icons/ethernet-port';

    interface Props {
        database: typeof databases.$inferSelect;
    }

    let { database }: Props = $props();
    let status = $state(database.status);
</script>


<BaseListElement editHref={`/databases/${database.id}`}
                 error={database.error}
                 ondelete={() => console.log('Delete')}
                 onduplicate={() => console.log('Duplicate')}
                 onstatuschange={() => console.log('Status change')}
                 status={status}
                 title={database.name}>
    <EngineIndicator engine={database.engine}/>
    <div class="flex items-center gap-1">
        <EthernetPort class="w-4 h-4"/>
        {database.connectionString}
    </div>
</BaseListElement>
