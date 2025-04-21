<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import ExecutionElement from '$lib/components/executions/ExecutionElement.svelte';
    import TableHeader from '$lib/components/table/TableHeader.svelte';
    import RefreshCw from '@lucide/svelte/icons/refresh-cw';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Executions"/>

<TableHeader icon={RefreshCw} noNew>Executions</TableHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.executions as execution (execution.id)}
        <ExecutionElement {execution}/>
    {/each}
</div>
