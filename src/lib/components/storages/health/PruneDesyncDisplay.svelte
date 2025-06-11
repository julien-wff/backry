<script lang="ts">
    import { page } from '$app/state';
    import { OctagonAlert, ShieldCheck, Trash2 } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import { formatUtcDate } from '$lib/helpers/format';
    import type { StoragePruneDesyncResponse, storagePruneDesyncUpdateRequest } from '$lib/server/schemas/api';
    import { onMount } from 'svelte';

    interface Props {
        healthy?: boolean;
    }

    let { healthy = $bindable() }: Props = $props();

    let loading = $state(true);
    let error = $state<string | null>(null);
    let unprunedBackups = $state<StoragePruneDesyncResponse['backups'] | null>(null);
    let idsToMarkAsPruned = $state<number[]>([]);

    $effect(() => {
        if (!loading) {
            healthy = !error && !!unprunedBackups && unprunedBackups.length === 0;
        }
    });

    onMount(() => {
        fetchUnprunedBackups();
    });

    async function fetchUnprunedBackups() {
        error = null;
        loading = true;

        const res = await fetchApi<StoragePruneDesyncResponse>('GET', `/api/storages/${page.params['id']}/prune-desync`, null);
        if (res.isErr()) {
            error = res.error;
            loading = false;
            return;
        }

        unprunedBackups = res.value.backups;
        idsToMarkAsPruned = unprunedBackups.map((backup) => backup.id);
        loading = false;
    }

    async function handleMarkAsPruned() {
        loading = true;

        const res = await fetchApi<{}, typeof storagePruneDesyncUpdateRequest>(
            'POST',
            `/api/storages/${page.params['id']}/prune-desync`,
            { backups: idsToMarkAsPruned },
        );

        if (res.isErr()) {
            error = res.error;
            loading = false;
            return;
        }

        await fetchUnprunedBackups();
    }
</script>

{#if loading}
    <div role="alert" class="alert alert-soft">
        <span class="loading loading-spinner loading-sm"></span>
        <span>Loading...</span>
    </div>
{:else if error}
    <div role="alert" class="alert alert-error alert-soft">
        <OctagonAlert class="h-4 w-4"/>
        <span>{error}</span>
    </div>
{:else if unprunedBackups}
    {#if unprunedBackups.length === 0}
        <div role="alert" class="alert alert-success alert-soft">
            <ShieldCheck class="h-4 w-4"/>
            <span>No pruned backup desync found</span>
        </div>
    {:else}
        <div class="flex flex-col gap-1">
            {#each unprunedBackups as backup (backup.id)}
                <div class="mb-1 flex flex-row items-center gap-2 p-2 bg-base-100 rounded-box">
                    <div class="flex-1">
                        <div class="">#{backup.id} - {backup.name}</div>
                        <div class="text-sm">
                            Started at {formatUtcDate(backup.startedAt)}, snapshot {backup.snapshotShortId}
                        </div>
                    </div>

                    <input type="checkbox"
                           value={backup.id}
                           bind:group={idsToMarkAsPruned}
                           class="checkbox checkbox-sm checkbox-warning"/>
                </div>
            {/each}
        </div>

        <button class="mt-1 w-full btn btn-warning btn-sm btn-soft"
                disabled={idsToMarkAsPruned.length === 0}
                onclick={handleMarkAsPruned}>
            <Trash2 class="h-4 w-4"/>
            Mark as pruned
        </button>
    {/if}
{/if}
