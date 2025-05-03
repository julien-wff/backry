<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { HardDrive, Link } from '$lib/components/icons';
    import { type storages } from '$lib/db/schema';
    import { formatSize } from '$lib/utils/format';

    interface Props {
        storage: typeof storages.$inferSelect;
    }

    let { storage }: Props = $props();
    let status = $state(storage.status);
    let loading = $state(false);

    async function deleteStorage() {
        loading = true;
        const res = await fetch(`/api/storages/${storage.id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            await invalidateAll();
        }

        loading = false;
    }
</script>


<BaseListElement
        deleteConfirmationMessage={`The storage "${storage.name}" will be deleted from Backry. The Restic repository will stay intact.`}
        disabled={loading}
        editHref={`/storages/${storage.id}`}
        error={storage.error}
        ondelete={deleteStorage}
        status={status}
        title={storage.name}>
    <div class="flex items-center gap-1">
        <HardDrive class="w-4 h-4"/>
        <span>
            Repo size: {formatSize(storage.diskSize ?? 0)}
        </span>
    </div>
    <div class="flex items-center gap-1">
        <Link class="w-4 h-4"/>
        <span>
            URL:
            <span class="font-mono">{storage.url}</span>
        </span>
    </div>
</BaseListElement>
