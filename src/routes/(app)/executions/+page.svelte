<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ExecutionElement from '$lib/components/executions/ExecutionElement.svelte';
    import { RefreshCw } from '$lib/components/icons';
    import type { ExecutionUpdateEventPayload } from '$lib/shared/events';
    import { subscribeApi } from '$lib/utils/api';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let executions = $state(data.executions);
    $effect(() => {
        executions = data.executions;
    });

    onMount(() => {
        return subscribeApi('/api/executions/subscribe', handleSubscriptionUpdate);
    });

    function handleSubscriptionUpdate(chunk: ExecutionUpdateEventPayload) {
        const localExec = executions.find(exec => exec.id === chunk.id);
        if (!localExec) {
            invalidateAll();
        } else {
            executions = executions.map(exec => (exec.id === chunk.id ? { ...exec, ...chunk } : exec));
        }
    }
</script>

<Head title="Executions"/>

<PageContentHeader icon={RefreshCw}>
    Executions
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each executions as execution (execution.id)}
        <ExecutionElement {execution}/>
    {/each}
</div>
