<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BackupElement from '$lib/components/backups/BackupElement.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import RunOriginIndicator from '$lib/components/common/RunOriginIndicator.svelte';
    import { EllipsisVertical, ExternalLink, Trash2 } from '$lib/components/icons.js';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { getRunsWithBackupFilter } from '$lib/server/queries/runs';
    import type { RunResponse } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';
    import dayjs from 'dayjs';
    import { fade } from 'svelte/transition';
    import type { databases, jobs } from '$lib/server/db/schema';

    interface Props {
        run: Awaited<ReturnType<typeof getRunsWithBackupFilter>>['runs'][number];
        job: typeof jobs.$inferSelect;
        databases: Map<number, typeof databases.$inferSelect>;
    }

    let { run, job, databases: databasesMap }: Props = $props();

    let deleteDialog = $state<HTMLDialogElement>();
    let loading = $state(false);

    function handleDeleteRun(ev: MouseEvent) {
        if (ev.shiftKey) {
            deleteRun();
        } else {
            deleteDialog?.showModal();
        }
    }

    async function deleteRun() {
        loading = true;

        const res = await fetchApi<RunResponse>('DELETE', `/api/runs/${run.id}`, null);
        if (res.isOk()) {
            await invalidateAll();
        } else {
            addToast(`Failed to delete run #${run.id}: ${res.error}`, 'error');
        }

        loading = false;
    }
</script>

<div class="grid grid-cols-1 gap-2 rounded-lg p-2 bg-base-200" transition:fade={{ duration: 300 }}>
    <div class="flex justify-between items-center">
        <div class="flex gap-2 text-sm align-center">
            <RunOriginIndicator origin={run.origin}/>
            Run #{run.id} - {job.name} - {dayjs.utc(run.createdAt).fromNow()}
        </div>

        <div class="dropdown dropdown-end">
            <div class="btn btn-square btn-xs btn-soft" role="button" tabindex="0">
                <EllipsisVertical class="w-4 h-4"/>
            </div>
            <div class="menu dropdown-content gap-2 bg-base-200 rounded-box z-1 w-48 p-2 shadow-sm">
                <button class="btn btn-soft btn-sm btn-error" disabled={loading} onclick={handleDeleteRun}>
                    <Trash2 class="w-4 h-4"/>
                    Delete whole run
                </button>
                <a class="btn btn-soft btn-sm btn-primary"
                   href="/jobs/{job.id}">
                    <ExternalLink class="w-4 h-4"/>
                    View job
                </a>
            </div>
        </div>
    </div>

    {#each run.backups as backup (backup.id)}
        <div transition:fade={{ duration: 300 }}>
            <BackupElement {backup} database={databasesMap.get(backup.databaseId)!}/>
        </div>
    {/each}
</div>


<Modal bind:modal={deleteDialog} title="Are you sure?">
    <p class="mb-1">Are you sure to delete run #{run.id}?</p>
    <p>
        The {run.backups.length > 1 ? `${run.backups.length} backups` : 'backup'} and the associated
        file{run.backups.length > 1 ? 's' : ''} stored in the Restic repository will be deleted as well.
    </p>

    <div class="modal-action">
        <button class="btn">Cancel</button>
        <button class="btn btn-error" onclick={deleteRun}>Delete</button>
    </div>
</Modal>
