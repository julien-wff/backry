<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { FolderHeart, HardDrive, Link } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import { formatSize } from '$lib/helpers/format';
    import { type storages } from '$lib/server/db/schema';
    import type { StorageResponse } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';

    interface Props {
        storage: typeof storages.$inferSelect;
    }

    let { storage }: Props = $props();
    let loading = $state(false);

    async function deleteStorage() {
        loading = true;
        const res = await fetchApi<StorageResponse>('DELETE', `/api/storages/${storage.id}`, null);

        if (res.isOk()) {
            await invalidateAll();
        } else {
            addToast(`Failed to delete storage #${storage.id}: ${res.error}`, 'error');
        }

        loading = false;
    }
</script>


{#snippet secondaryButtons()}
    <a class="btn btn-success btn-sm btn-soft" href="/storages/{storage.id}/health">
        <FolderHeart class="w-4 h-4"/>
        Repository health
    </a>
{/snippet}


<BaseListElement
        deleteConfirmationMessage={`The storage "${storage.name}" will be removed from Backry. The Restic repository will stay intact.`}
        disabled={loading}
        editHref={`/storages/${storage.id}`}
        error={storage.error}
        ondelete={deleteStorage}
        secondaryBtns={secondaryButtons}
        status={storage.status}
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
