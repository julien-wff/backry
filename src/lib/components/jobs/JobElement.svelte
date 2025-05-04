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

    async function handleRunJob() {
        loading = true;
        const res = await fetch(`/api/jobs/${job.id}/run`, {
            method: 'POST',
        });

        if (res.ok) {
            await goto('/executions');
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
                 onrun={handleRunJob}
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
