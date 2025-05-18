<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Clock, FileChartPie, FileDown, HardDriveDownload, Timer } from '$lib/components/icons';
    import type { BACKUP_STATUS } from '$lib/db/schema';
    import type { backupsListFull } from '$lib/queries/backups';
    import type { BackupResponse } from '$lib/schemas/api';
    import { fetchApi } from '$lib/utils/api';
    import { formatDuration, formatSize } from '$lib/utils/format.js';

    interface Props {
        backup: Omit<Awaited<ReturnType<typeof backupsListFull>>[number], 'run'>;
    }

    let { backup }: Props = $props();
    let status = $derived(((): typeof BACKUP_STATUS[number] => {
        if (backup.error) {
            return 'error';
        } else if (backup.finishedAt) {
            return 'success';
        } else {
            return 'running';
        }
    })());

    let loading = $state(false);

    async function handleDelete() {
        loading = true;
        await fetchApi<BackupResponse>('DELETE', `/api/backups/${backup.id}`, null);
        await invalidateAll();
        loading = false;
    }
</script>


{#snippet secondaryBtns()}
    {#if !backup.error && backup.dumpSize && backup.dumpSize < 10e6}
        <a download href="/api/backups/{backup.id}/download" class="btn btn-sm btn-success btn-soft">
            <FileDown class="w-4 h-4"/>
            Download
        </a>
    {:else if !backup.error && backup.dumpSize}
        <div class="tooltip tooltip-error" data-tip="Cannot download dumps larger than 10MB">
            <button class="btn btn-sm btn-success btn-soft w-full" disabled>
                <FileDown class="w-4 h-4"/>
                Download
            </button>
        </div>
    {/if}
{/snippet}


<BaseListElement deleteConfirmationMessage="This backup and the file stored in the repository will be deleted."
                 disabled={loading}
                 error={backup.error}
                 ondelete={handleDelete}
                 {secondaryBtns}
                 status={status}
                 title={backup.jobDatabase.database.name}>
    <div class="flex items-center gap-1">
        <Clock class="w-4 h-4"/>
        Started: {backup.startedAt}
    </div>

    {#if backup.duration}
        <div class="flex items-center gap-1">
            <Timer class="w-4 h-4"/>
            Duration: {formatDuration(backup.duration)}
        </div>
    {/if}

    {#if backup.dumpSize}
        <div class="flex items-center gap-1">
            <FileChartPie class="w-4 h-4"/>
            Dump size: {formatSize(backup.dumpSize)}
        </div>
    {/if}

    {#if backup.dumpSpaceAdded}
        <div class="flex items-center gap-1">
            <HardDriveDownload class="w-4 h-4"/>
            Space added: {formatSize(backup.dumpSpaceAdded)}
        </div>
    {/if}
</BaseListElement>
