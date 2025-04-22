<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import type { EXECUTION_STATUS } from '$lib/db/schema';
    import type { executionsListFull } from '$lib/queries/executions';
    import { formatDuration, formatSize } from '$lib/utils/format.js';
    import Clock from '@lucide/svelte/icons/clock';
    import Timer from '@lucide/svelte/icons/timer';
    import FileChartPie from '@lucide/svelte/icons/file-chart-pie';
    import HardDriveDownload from '@lucide/svelte/icons/hard-drive-download';

    interface Props {
        execution: Awaited<ReturnType<typeof executionsListFull>>[number];
    }

    let { execution }: Props = $props();
    let status = $derived(((): typeof EXECUTION_STATUS[number] => {
        if (execution.error) {
            return 'error';
        } else if (execution.finishedAt) {
            return 'success';
        } else {
            return 'running';
        }
    })());
</script>


<BaseListElement ondelete={() => console.log('Delete')}
                 status={status}
                 title="{execution.jobDatabase.job.name} - {execution.jobDatabase.database.name}">
    <div class="flex items-center gap-1">
        <Clock class="w-4 h-4"/>
        Started: {execution.startedAt}
    </div>

    {#if execution.duration}
        <div class="flex items-center gap-1">
            <Timer class="w-4 h-4"/>
            Duration: {formatDuration(execution.duration)}
        </div>
    {/if}

    {#if execution.dumpSize}
        <div class="flex items-center gap-1">
            <FileChartPie class="w-4 h-4"/>
            Dump size: {formatSize(execution.dumpSize)}
        </div>
    {/if}

    {#if execution.dumpSpaceAdded}
        <div class="flex items-center gap-1">
            <HardDriveDownload class="w-4 h-4"/>
            Space added: {formatSize(execution.dumpSpaceAdded)}
        </div>
    {/if}
</BaseListElement>
