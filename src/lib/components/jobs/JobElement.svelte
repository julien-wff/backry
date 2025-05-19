<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import { Clock, CloudUpload, Database, RefreshCw } from '$lib/components/icons';
    import type { jobsListFull } from '$lib/queries/jobs';
    import { type jobPatchRequest, type JobResponse, jobRunRequest } from '$lib/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';
    import { fetchApi } from '$lib/utils/api';

    interface Props {
        job: Awaited<ReturnType<typeof jobsListFull>>[number];
        nextExecution: Date | null;
    }

    let { job, nextExecution }: Props = $props();
    let status = $state(job.status);
    let loading = $state(false);

    let jobRunPopup = $state<HTMLDialogElement | null>(null);
    let jobRunDatabases = $state<number[]>([]);

    function handleRunJobDatabaseChange(ev: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (ev.currentTarget.checked) {
            jobRunDatabases.push(Number(ev.currentTarget.value));
        } else {
            jobRunDatabases = jobRunDatabases.filter((dbId) => dbId !== Number(ev.currentTarget.value));
        }
    }

    function handleRunJobPopup() {
        jobRunDatabases = [];
        jobRunPopup?.showModal();
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
            status: status === 'inactive' ? 'active' : 'inactive',
        });

        if (res.isOk()) {
            status = res.value.status;
        }

        loading = false;
    }
</script>


<BaseListElement deleteConfirmationMessage={`The job "${job.name}" will be deleted.`}
                 disabled={loading}
                 editHref={`/jobs/${job.id}`}
                 ondelete={deleteJob}
                 onrun={handleRunJobPopup}
                 onstatuschange={changeJobStatus}
                 status={status}
                 title={job.name}>
    <div class="flex items-center gap-1">
        <Clock class="w-4 h-4"/>
        Cron: {job.cron}
    </div>

    <div class="flex items-center gap-1">
        <CloudUpload class="w-4 h-4"/>
        Storage backend: {job.storage.name}
    </div>

    <div class="flex items-center gap-1">
        <Database class="w-4 h-4"/>
        Databases: {job.jobsDatabases.map((db) => db.database.name).join(', ')}
    </div>

    {#if nextExecution}
        <div class="flex flex-1 items-center justify-end gap-1">
            <RefreshCw class="w-4 h-4"/>
            Next execution: {nextExecution.toLocaleString()}
        </div>
    {/if}
</BaseListElement>


<Modal bind:modal={jobRunPopup} title="Run {job.name} now">
    <div>Select databases to backup:</div>
    <div class="mt-1 flex flex-col gap-1">
        {#each job.jobsDatabases as db}
            <label class="flex items-center gap-1 select-none">
                <input type="checkbox"
                       class="checkbox checkbox-primary checkbox-xs"
                       value="{db.database.id}"
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
