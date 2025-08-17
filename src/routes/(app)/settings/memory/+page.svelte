<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { HardDriveDownload, RefreshCw, Settings } from '$lib/components/icons';
    import { onMount } from 'svelte';
    import type { PageProps } from './$types';
    import CodeEditor from '$lib/components/common/CodeEditor.svelte';
    import { formatSize } from '$lib/helpers/format';

    let { data }: PageProps = $props();

    let autoRefresh = $state(true);

    onMount(() => {
        const timer = setInterval(() => {
            if (!document.hidden && autoRefresh) {
                invalidateAll();
            }
        }, 1000);

        return () => clearInterval(timer);
    });
</script>

<Head title="Settings - Memory usage"/>

<PageContentHeader buttonText="Back to settings" buttonType="back" icon={Settings}>
    Settings - Memory usage
</PageContentHeader>


<div class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto">
    <h2 class="font-bold text-lg">
        Backry memory usage analysis
    </h2>

    <div>
        <button class="btn btn-soft w-full mb-2"
                class:btn-success={autoRefresh}
                class:btn-warning={!autoRefresh}
                onclick={() => (autoRefresh = !autoRefresh)}
                type="button">
            <RefreshCw class="w-4 h-4"/>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
        </button>

        <a class="btn btn-primary btn-soft w-full mb-2"
           download
           href="/api/settings/memory/heap-snapshot"
           role="button">
            <HardDriveDownload class="w-4 h-4"/>
            Download heap snapshot
        </a>

        <div class="collapse border-base-300 bg-base-100 border mb-2">
            <input checked type="checkbox"/>
            <div class="collapse-title font-semibold">Memory usage</div>
            <div class="collapse-content flex flex-col">
                <span>RSS: {formatSize(data.memoryUsage.rss)}</span>
                <span>Heap total: {formatSize(data.memoryUsage.heapTotal)}</span>
                <span>Heap used: {formatSize(data.memoryUsage.heapUsed)}</span>
                <span>External: {formatSize(data.memoryUsage.external)}</span>
                <span>Array Buffers: {formatSize(data.memoryUsage.arrayBuffers)}</span>
            </div>
        </div>

        <div class="collapse border-base-300 bg-base-100 border mb-2">
            <input type="checkbox"/>
            <div class="collapse-title font-semibold">Heap stats</div>
            <div class="collapse-content">
                <CodeEditor language="json"
                            readonly
                            value={JSON.stringify(data.heapStats, null, 2)}/>
            </div>
        </div>
    </div>
</div>
