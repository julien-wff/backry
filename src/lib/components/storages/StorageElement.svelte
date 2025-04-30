<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Link } from '$lib/components/icons';
    import { type storages } from '$lib/db/schema';

    interface Props {
        storage: typeof storages.$inferSelect;
    }

    let { storage }: Props = $props();
    let status = $state(storage.status);
</script>


<BaseListElement editHref={`/storages/${storage.id}`}
                 error={storage.error}
                 ondelete={() => console.log('Delete')}
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
