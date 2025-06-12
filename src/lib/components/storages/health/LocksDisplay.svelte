<script lang="ts">
    import { page } from '$app/state';
    import { LockKeyholeOpen, OctagonAlert, ShieldCheck } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import { staleLocksCount } from '$lib/helpers/storage';
    import type { StorageLocksResponse } from '$lib/server/schemas/api';
    import type { ResticLock } from '$lib/types/restic';
    import { onMount } from 'svelte';

    interface Props {
        healthy?: boolean;
    }

    let { healthy = $bindable() }: Props = $props();

    let loading = $state(true);
    let error = $state<string | null>(null);
    let locks = $state<ResticLock[] | null>(null);

    $effect(() => {
        if (!loading) {
            healthy = !error && !!locks && staleLocksCount(locks) === 0;
        }
    });

    onMount(() => {
        fetchLocks();
    });

    async function fetchLocks() {
        error = null;
        loading = true;

        const res = await fetchApi<StorageLocksResponse>('GET', `/api/storages/${page.params['id']}/locks`, null);
        if (res.isErr()) {
            error = res.error;
            loading = false;
            return;
        }

        locks = res.value.locks;
        loading = false;
    }

    async function handleUnlockAll() {
        error = null;
        loading = true;

        const res = await fetchApi('DELETE', `/api/storages/${page.params['id']}/locks`, null);

        if (res.isErr()) {
            error = res.error;
            loading = false;
        } else {
            await fetchLocks();
        }
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
{:else if locks}
    {#if locks.length === 0}
        <div role="alert" class="alert alert-success alert-soft">
            <ShieldCheck class="h-4 w-4"/>
            <span>No locks found</span>
        </div>
    {:else}
        <div class="flex flex-col gap-1">
            {#each locks as lock}
                <div class="mb-1 p-2 bg-base-100 rounded-box">
                    <div class="">Hostname: {lock.hostname}, user: {lock.username}</div>
                    <div class="text-sm">
                        Created on {new Date(lock.time).toLocaleString()} by PID {lock.pid}
                        (exclusive: {lock.exclusive ? 'yes' : 'no'})
                    </div>
                </div>
            {/each}
        </div>

        <button class="mt-1 w-full btn btn-primary btn-sm btn-soft" onclick={handleUnlockAll}>
            <LockKeyholeOpen class="h-4 w-4"/>
            Unlock all
        </button>
    {/if}
{/if}
