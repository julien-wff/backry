<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { type storages } from '$lib/db/schema';
    import Link from '@lucide/svelte/icons/link';

    interface Props {
        storage: typeof storages.$inferSelect;
    }

    let { storage }: Props = $props();
    let status = $state(storage.status);
</script>


<BaseListElement editHref={`/storages/${storage.id}`}
                 error={storage.error}
                 ondelete={() => console.log('Delete')}
                 onduplicate={() => console.log('Duplicate')}
                 onstatuschange={() => console.log('Status change')}
                 status={status}
                 title={storage.name}>
    <div class="flex items-center gap-1">
        <Link class="w-4 h-4"/>
        <span>
            URL:
            <span class="font-mono">{storage.url}</span>
        </span>
    </div>
</BaseListElement>
