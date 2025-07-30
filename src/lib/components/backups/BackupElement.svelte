<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Clock, ExternalLink, FileChartPie, FileDown, HardDriveDownload, Timer } from '$lib/components/icons';
    import type { BACKUP_STATUS, backups, databases } from '$lib/server/db/schema';
    import type { BackupResponse } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';
    import { fetchApi } from '$lib/helpers/fetch';
    import { formatDuration, formatSize, formatUtcDate } from '$lib/helpers/format.js';

    interface Props {
        backup: typeof backups.$inferSelect;
        database?: typeof databases.$inferSelect;
    }

    let { backup, database }: Props = $props();
    let status = $derived(((): typeof BACKUP_STATUS[number] => {
        if (backup.error) {
            return 'error';
        } else if (backup.prunedAt) {
            return 'pruned';
        } else if (backup.finishedAt) {
            return 'success';
        } else {
            return 'running';
        }
    })());

    let loading = $state(false);

    async function handleDelete() {
        loading = true;
        const res = await fetchApi<BackupResponse>('DELETE', `/api/backups/${backup.id}`, null);

        if (res.isOk()) {
            await invalidateAll();
        } else {
            addToast(`Failed to delete backup #${backup.id}: ${res.error}`, 'error');
        }

        loading = false;
    }
</script>


{#snippet secondaryBtns()}
    {#if !backup.error && backup.dumpSize && backup.dumpSize < 10e6 && !backup.prunedAt}
        <a download href="/api/backups/{backup.id}/download" class="btn btn-sm btn-success btn-soft">
            <FileDown class="w-4 h-4"/>
            Download
        </a>
    {:else if !backup.error && backup.dumpSize && !backup.prunedAt}
        <div class="tooltip tooltip-error" data-tip="Cannot download dumps larger than 10MB">
            <button class="btn btn-sm btn-success btn-soft w-full" disabled>
                <FileDown class="w-4 h-4"/>
                Download
            </button>
        </div>
    {/if}

    {#if database}
        <a class="btn btn-soft btn-sm btn-primary"
           href="/databases/{database.id}">
            <ExternalLink class="w-4 h-4"/>
            View database
        </a>
    {/if}
{/snippet}


<BaseListElement deleteConfirmationMessage="This backup and the file stored in the repository will be deleted."
                 disabled={loading}
                 error={backup.error}
                 ondelete={handleDelete}
                 {secondaryBtns}
                 {status}
                 statusTooltip={backup.prunedAt ? formatUtcDate(backup.prunedAt) : undefined}
                 title={database?.name ?? '<ERROR_UNKNOWN_DATABASE>'}>
    <div class="flex items-center gap-1">
        <Clock class="w-4 h-4"/>
        Started: {formatUtcDate(backup.startedAt!)}
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
