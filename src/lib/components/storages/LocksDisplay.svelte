<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { page } from '$app/state';
    import { OctagonAlert, ShieldCheck } from '$lib/components/icons.js';
    import type { ResticLock } from '$lib/types/restic';

    interface Props {
        error?: string | null;
        locks?: ResticLock[];
    }

    let { error, locks }: Props = $props();

    let unlockError = $state<string | null>(null);

    async function handleUnlockAll() {
        const res = await fetch(`/api/storages/${page.params['id']}/unlock`, {
            method: 'POST',
        });

        if (!res.ok) {
            const { error: reqError } = await res.json();
            console.error('Error unlocking all locks:', reqError);
            unlockError = reqError || 'Failed to unlock all locks';
        } else {
            await invalidateAll();
        }
    }
</script>

{#if unlockError || error}
    <div role="alert" class="alert alert-error alert-soft">
        <OctagonAlert class="w-4 h-4"/>
        <span>{unlockError || error}</span>
    </div>
{/if}

{#if locks}
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

        <button class="btn btn-primary btn-sm btn-soft mt-1 w-full" onclick={handleUnlockAll}>
            Unlock all
        </button>
    {/if}
{/if}
