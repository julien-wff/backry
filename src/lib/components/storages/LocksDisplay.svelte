<script lang="ts">
    import { page } from '$app/state';
    import { LockKeyholeOpen, OctagonAlert, ShieldCheck } from '$lib/components/icons';
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
        error = null;
        loading = true;

        const res = await fetch(`/api/storages/${page.params['id']}/locks`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const { error: reqError } = await res.json();
            console.error('Error unlocking all locks:', reqError);
            error = reqError || 'Failed to unlock all locks';
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
