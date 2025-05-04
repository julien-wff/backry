<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { Timer } from '$lib/components/icons';
    import JobElement from '$lib/components/jobs/JobElement.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Backup jobs pools"/>

<PageContentHeader buttonType="new" icon={Timer}>
    Backup jobs pools
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.jobs as job (job.id)}
        <JobElement {job} nextExecution={data.nextExecutions[job.id] ?? null}/>
    {/each}
</div>
