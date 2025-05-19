<script lang="ts">
    import { FileCheck } from '$lib/components/icons';
    import type { getDashboardStats } from '$lib/queries/shared';
    import { formatDuration, formatSize } from '$lib/utils/format.js';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';

    dayjs.extend(relativeTime);
    dayjs.extend(utc);

    interface Props {
        backups: Awaited<ReturnType<typeof getDashboardStats>>['latestBackups'];
    }

    let { backups }: Props = $props();
</script>


<a class="w-full bg-base-100 rounded-box p-4" href="/backups">
    <div class="flex items-center gap-2">
        <FileCheck size={24}/>
        <h3 class="text-lg font-bold">
            Latest backups
        </h3>
    </div>

    <div class="flex flex-col gap-2 mt-4">
        {#each backups as backup (backup.id)}
            {@const backupDate = dayjs.utc(backup.finishedAt).fromNow()}

            <div class="flex items-center justify-between gap-2 bg-base-200 py-2 px-3 rounded-box">
                <div class="flex flex-col">
                    <span>{backup.jobDatabase.job.name} - {backup.jobDatabase.database.name}</span>
                    <span class="text-sm text-base-content/50 line-clamp-1">
                        {backupDate.slice(0, 1).toUpperCase()}{backupDate.slice(1)} -
                        {#if backup.error}
                            <span class="text-error/80">
                                {backup.error}
                            </span>
                        {:else}
                            {formatDuration(backup.duration ?? -1)} -
                            {formatSize(backup.dumpSize ?? -1)}
                        {/if}
                    </span>
                </div>
                <span class="status status-lg"
                      class:status-error={backup.error}
                      class:status-success={!backup.error}>
                </span>
            </div>
        {/each}
    </div>
</a>
