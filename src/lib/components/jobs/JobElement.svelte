<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import Clock from '@lucide/svelte/icons/clock';
    import DataBase from '@lucide/svelte/icons/database';
    import type { jobsListFull } from '$lib/queries/jobs';

    interface Props {
        job: Awaited<ReturnType<typeof jobsListFull>>[number];
    }

    let { job }: Props = $props();
    let status = $state(job.status);

    async function handleRunJob() {
        const res = await fetch(`/api/jobs/${job.id}/run`, {
            method: 'POST',
        });
    }
</script>


<BaseListElement editHref={`/storages/${job.id}`}
                 ondelete={() => console.log('Delete')}
                 onduplicate={() => console.log('Duplicate')}
                 onrun={handleRunJob}
                 onstatuschange={() => console.log('Status change')}
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
        <DataBase class="w-4 h-4"/>
        Databases: {job.jobsDatabases.map((db) => db.database.name).join(', ')}
    </div>
</BaseListElement>
