<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Clock, FileChartPie, FileDown, HardDriveDownload, Timer } from '$lib/components/icons';
    import type { EXECUTION_STATUS } from '$lib/db/schema';
    import type { executionsListFull } from '$lib/queries/executions';
    import { fetchApi } from '$lib/utils/api';
    import { formatDuration, formatSize } from '$lib/utils/format.js';

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

    let loading = $state(false);

    async function handleDelete() {
        loading = true;
        await fetchApi('DELETE', `/api/executions/${execution.id}`, {});
        await invalidateAll();
        loading = false;
    }
</script>


{#snippet secondaryBtns()}
    {#if !execution.error && execution.dumpSize && execution.dumpSize < 10e6}
        <a download href="/api/executions/{execution.id}/download" class="btn btn-sm btn-success btn-soft">
            <FileDown class="w-4 h-4"/>
            Download
        </a>
    {:else if !execution.error && execution.dumpSize}
        <div class="tooltip tooltip-error" data-tip="Cannot download dumps larger than 10MB">
            <button class="btn btn-sm btn-success btn-soft w-full" disabled>
                <FileDown class="w-4 h-4"/>
                Download
            </button>
        </div>
    {/if}
{/snippet}


<BaseListElement deleteConfirmationMessage="This execution and the backup stored in the repository will be deleted."
                 disabled={loading}
                 error={execution.error}
                 ondelete={handleDelete}
                 {secondaryBtns}
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
