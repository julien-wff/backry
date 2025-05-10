<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Clock, CloudUpload, Database, RefreshCw } from '$lib/components/icons';
    import type { jobsListFull } from '$lib/queries/jobs';

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
        const res = await fetch(`/api/jobs/${job.id}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                databases: jobRunDatabases,
            }),
        });

        if (res.ok) {
            await goto('/backups');
        } else {
            loading = false;
        }
    }

    async function deleteJob() {
        loading = true;
        const res = await fetch(`/api/jobs/${job.id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            await invalidateAll();
        }

        loading = false;
    }

    async function changeJobStatus() {
        loading = true;
        const res = await fetch(`/api/jobs/${job.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: status === 'inactive' ? 'active' : 'inactive' }),
        });

        if (res.ok) {
            status = status === 'inactive' ? 'active' : 'inactive';
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


<dialog bind:this={jobRunPopup} class="modal">
    <div class="modal-box">
        <h3 class="text-lg font-bold">Run {job.name} now</h3>

        <div class="mt-4">Select databases to backup:</div>
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
            <button class="btn" onclick={() => jobRunPopup?.close()}>Cancel</button>
            <button class="btn btn-success" disabled={jobRunDatabases.length === 0} onclick={handleRunJob}>
                Backup now
            </button>
        </div>
    </div>

    <form class="modal-backdrop" method="dialog">
        <button>close</button>
    </form>
</dialog>
