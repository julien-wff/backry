<script lang="ts">
    import { page } from '$app/state';
    import { OctagonAlert, ShieldCheck } from '$lib/components/icons.js';
    import type { ResticLock } from '$lib/types/restic';
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state<string | null>(null);
    let locks = $state<ResticLock[] | null>(null);

    onMount(() => {
        fetchLocks();
    });

    async function fetchLocks() {
        error = null;
        loading = true;

        const res = await fetch(`/api/storages/${page.params['id']}/locks`);
        if (!res.ok) {
            const { error: reqError } = await res.json();
            console.error('Error fetching locks:', reqError);
            error = reqError || 'Failed to fetch locks';
            loading = false;
            return;
        }

        const { locks: fetchedLocks } = await res.json();
        locks = fetchedLocks;
        loading = false;
    }

    async function handleUnlockAll() {
        const res = await fetch(`/api/storages/${page.params['id']}/locks`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const { error: reqError } = await res.json();
            console.error('Error unlocking all locks:', reqError);
            error = reqError || 'Failed to unlock all locks';
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
        <OctagonAlert class="w-4 h-4"/>
        <span>{error}</span>
    </div>
{:else if locks}
    {#if locks.length === 0}
        <div role="alert" class="alert alert-success alert-soft">
            <ShieldCheck class="w-4 h-4"/>
            <span>No locks found</span>
        </div>
    {:else}
        <div class="flex flex-col gap-1">
            {#each locks as lock}
                <div class="bg-base-100 p-2 rounded-box mb-1">
                    <div class="">Hostname: {lock.hostname}, user: {lock.username}</div>
                    <div class="text-sm">
                        Created on {new Date(lock.time).toLocaleString()} by PID {lock.pid}
                        (exclusive: {lock.exclusive ? 'yes' : 'no'})
                    </div>
                </div>
            {/each}
        </div>

        <button class="btn btn-primary btn-sm btn-soft mt-1 w-full" onclick={handleUnlockAll} disabled={loading}>
            Unlock all
        </button>
    {/if}
{/if}
