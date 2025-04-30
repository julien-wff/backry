<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import { Timer } from '$lib/components/icons';
    import JobElement from '$lib/components/jobs/JobElement.svelte';
    import TableHeader from '$lib/components/table/TableHeader.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Backup jobs pools"/>

<TableHeader icon={Timer}>Backup jobs pools</TableHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.jobs as job (job.id)}
        <JobElement {job}/>
    {/each}
</div>
