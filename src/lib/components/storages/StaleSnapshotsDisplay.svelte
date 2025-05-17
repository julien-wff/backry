<script lang="ts">
    import { page } from '$app/state';
    import Modal from '$lib/components/common/Modal.svelte';
    import { OctagonAlert, ShieldCheck, Trash2 } from '$lib/components/icons';
    import type { ResticSnapshot } from '$lib/types/restic';
    import { formatSize } from '$lib/utils/format';
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state<string | null>(null);
    let snapshots = $state<ResticSnapshot[] | null>(null);

    let snapshotsToDelete = $state<string[]>([]);
    let deleteConfirmDialog = $state<HTMLDialogElement | null>(null);

    function handleDelectCheckboxChange(ev: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (ev.currentTarget.checked) {
            snapshotsToDelete.push(ev.currentTarget.value);
        } else {
            snapshotsToDelete = snapshotsToDelete.filter((dbId) => dbId !== ev.currentTarget.value);
        }
    }

    onMount(() => {
        fetchStaleSnapshots();
    });

    async function fetchStaleSnapshots() {
        error = null;
        loading = true;

        const res = await fetch(`/api/storages/${page.params['id']}/stale-snapshots`);
        if (!res.ok) {
            const { error: reqError } = await res.json();
            console.error('Error fetching snapshots:', reqError);
            error = reqError || 'Failed to fetch snapshots';
            loading = false;
            return;
        }

        const { snapshots: fetchedSnapshots } = await res.json();
        snapshots = fetchedSnapshots;
        loading = false;
    }

    async function deleteSnapshots() {
        deleteConfirmDialog?.close();
        loading = true;

        const res = await fetch(`/api/storages/${page.params['id']}/stale-snapshots`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ snapshots: snapshotsToDelete }),
        });

        if (!res.ok) {
            const { error: reqError } = await res.json();
            console.error('Error deleting snapshots:', reqError);
            error = reqError || 'Failed to delete snapshots';
            loading = false;
            return;
        }

        await fetchStaleSnapshots();
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
{:else if snapshots}
    {#if snapshots.length === 0}
        <div role="alert" class="alert alert-success alert-soft">
            <ShieldCheck class="h-4 w-4"/>
            <span>No stale snapshots found</span>
        </div>
    {:else}
        <div class="flex flex-col gap-1">
            {#each snapshots as snapshot}
                {@const jobId = snapshot.tags.find(t => t.startsWith('jobId:'))?.replace('jobId:', '')}
                {@const dbId = snapshot.tags.find(t => t.startsWith('dbId:'))?.replace('dbId:', '')}

                <div class="mb-1 flex flex-row items-center gap-2 p-2 bg-base-100 rounded-box">
                    <div class="flex-1">
                        <div class="">Snapshot {snapshot.short_id} ({new Date(snapshot.time).toLocaleString()})</div>
                        <div class="text-sm">
                            <div class="cursor-help underline tooltip" data-tip={snapshot.paths.join('\n')}>
                                {snapshot.paths.length} file{snapshot.paths.length > 1 ? 's' : ''},
                            </div>
                            {formatSize(snapshot.summary.total_bytes_processed)} total,
                            {#if jobId}
                                <a href="/jobs/{jobId}" class="link">job #{jobId}</a>,
                            {:else}
                                Unknown job,
                            {/if}
                            {#if dbId}
                                <a href="/databases/{dbId}" class="link">database #{dbId}</a>
                            {:else}
                                Unknown database
                            {/if}
                        </div>
                    </div>

                    <input type="checkbox"
                           checked={snapshotsToDelete.includes(snapshot.id)}
                           value={snapshot.id}
                           onchange={handleDelectCheckboxChange}
                           class="checkbox checkbox-sm checkbox-error"/>
                </div>
            {/each}

            <button class="w-full btn btn-error btn-sm btn-soft"
                    onclick={() => deleteConfirmDialog?.showModal()}
                    disabled={loading || snapshotsToDelete.length === 0}>
                <Trash2 class="h-4 w-4"/>
                Delete snapshots
            </button>
        </div>
    {/if}
{/if}

<Modal bind:modal={deleteConfirmDialog}
       title="Delete {snapshotsToDelete.length} snapshot{snapshotsToDelete.length > 1 ? 's' : ''} from repository">
    <div>
        These snapshots and the files they contain will be deleted from the repository. This action cannot
        be undone.
        <br/>
        Be sure that these files are backed up elsewhere or no longer needed before proceeding.
    </div>

    <div class="modal-action">
        <button class="btn">Cancel</button>
        <button class="btn btn-error" onclick={deleteSnapshots} type="button">Delete</button>
    </div>
</Modal>
