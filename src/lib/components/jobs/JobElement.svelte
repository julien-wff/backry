<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import CollapsableElementList from '$lib/components/common/CollapsableElementList.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import { Clock, CloudUpload, Database, FileCheck, RefreshCw } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { jobsListFull } from '$lib/server/queries/jobs';
    import { type jobPatchRequest, type JobResponse, type jobRunRequest } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';
    import type { ModalControls } from '$lib/helpers/modal';

    interface Props {
        job: Awaited<ReturnType<typeof jobsListFull>>[number];
        nextExecution: Date | null;
    }

    let { job, nextExecution }: Props = $props();
    let loading = $state(false);

    let jobRunModalControls = $state<ModalControls>();
    let jobRunDatabases = $state<number[]>([]);

    let databaseListFormatted = $derived(job.jobsDatabases.map(db => ({
        id: db.database.id,
        name: db.database.name,
        disabled: db.status === 'inactive',
    })));

    function handleRunJobDatabaseChange(ev: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (ev.currentTarget.checked) {
            jobRunDatabases.push(Number(ev.currentTarget.value));
        } else {
            jobRunDatabases = jobRunDatabases.filter((dbId) => dbId !== Number(ev.currentTarget.value));
        }
    }

    function handleRunJobPopup() {
        jobRunDatabases = [];
        jobRunModalControls?.open();
    }

    async function handleRunJob() {
        loading = true;
        const res = await fetchApi<{}, typeof jobRunRequest>('POST', `/api/jobs/${job.id}/run`, {
            databases: jobRunDatabases,
        });

        if (res.isOk()) {
            await goto('/backups');
        } else {
            loading = false;
        }
    }

    async function deleteJob() {
        loading = true;
        const res = await fetchApi<JobResponse>('DELETE', `/api/jobs/${job.id}`, null);

        if (res.isOk()) {
            await invalidateAll();
        } else {
            addToast(`Failed to delete job #${job.id}: ${res.error}`, 'error');
        }

        loading = false;
    }

    async function changeJobStatus() {
        loading = true;
        const res = await fetchApi<JobResponse, typeof jobPatchRequest>('PATCH', `/api/jobs/${job.id}`, {
            status: job.status === 'inactive' ? 'active' : 'inactive',
        });

        if (res.isOk()) {
            await invalidateAll();
        }

        loading = false;
    }
</script>


{#snippet secondaryButtons()}
    <a class="btn btn-success btn-sm btn-soft" href="/backups?job={job.id}">
        <FileCheck class="w-4 h-4"/>
        View backups
    </a>
{/snippet}


<BaseListElement deleteConfirmationMessage={`The job "${job.name}" will be deleted.`}
                 disabled={loading}
                 editHref={`/jobs/${job.id}`}
                 ondelete={deleteJob}
                 onrun={handleRunJobPopup}
                 onstatuschange={changeJobStatus}
                 secondaryBtns={secondaryButtons}
                 status={job.status}
                 title={job.name}>
    <div class="flex items-center gap-1 whitespace-nowrap">
        <Clock class="h-4 w-4"/>
        Cron: {job.cron}
    </div>

    <div class="flex items-center gap-1 whitespace-nowrap">
        <CloudUpload class="h-4 w-4"/>
        Storage backend: {job.storage.name}
    </div>

    <div class="flex items-center gap-1 whitespace-nowrap">
        <Database class="h-4 w-4"/>
        Databases:
        <CollapsableElementList elements={databaseListFormatted}/>
    </div>

    {#if nextExecution && job.status === 'active'}
        <div class="flex flex-1 items-center justify-end gap-1 whitespace-nowrap">
            <RefreshCw class="h-4 w-4"/>
            Next execution: {nextExecution.toLocaleString()}
        </div>
    {/if}
</BaseListElement>


<Modal bind:controls={jobRunModalControls} title="Run {job.name} now">
    <div>Select databases to backup:</div>
    <div class="mt-1 flex flex-col gap-1">
        {#each job.jobsDatabases as db}
            <label class="flex select-none items-center gap-1">
                <input type="checkbox"
                       class="checkbox checkbox-primary checkbox-xs"
                       value={db.database.id}
                       checked={jobRunDatabases.includes(db.database.id)}
                       onchange={handleRunJobDatabaseChange}/>
                {db.database.name}
            </label>
        {/each}
    </div>

    <div class="modal-action">
        <button class="btn">Cancel</button>
        <button class="btn btn-success" disabled={jobRunDatabases.length === 0} onclick={handleRunJob} type="button">
            Backup now
        </button>
    </div>
</Modal>
