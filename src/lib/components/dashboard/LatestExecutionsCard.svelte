<script lang="ts">
    import { FileCheck } from '$lib/components/icons';
    import type { getDashboardStats } from '$lib/queries/shared';
    import { formatDuration, formatSize } from '$lib/utils/format.js';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';

    dayjs.extend(relativeTime);

    interface Props {
        executions: Awaited<ReturnType<typeof getDashboardStats>>['latestExecutions'];
    }

    let { executions }: Props = $props();
</script>


<a class="w-full bg-base-100 rounded-box p-4" href="/executions">
    <div class="flex items-center gap-2">
        <FileCheck size={24}/>
        <h3 class="text-lg font-bold">
            Latest backups
        </h3>
    </div>

    <div class="flex flex-col gap-2 mt-4">
        {#each executions as execution (execution.id)}
            {@const executionDate = dayjs(execution.finishedAt).fromNow()}

            <div class="flex items-center justify-between gap-2 bg-base-200 py-2 px-3 rounded-box">
                <div class="flex flex-col">
                    <span>{execution.jobDatabase.job.name} - {execution.jobDatabase.database.name}</span>
                    <span class="text-sm text-base-content/50 line-clamp-1">
                        {executionDate.slice(0, 1).toUpperCase()}{executionDate.slice(1)} -
                        {#if execution.error}
                            <span class="text-error/80">
                                {execution.error}
                            </span>
                        {:else}
                            {formatDuration(execution.duration ?? -1)} -
                            {formatSize(execution.dumpSize ?? -1)}
                        {/if}
                    </span>
                </div>
                <span class="status status-lg"
                      class:status-error={execution.error}
                      class:status-success={!execution.error}>
                </span>
            </div>
        {/each}
    </div>
</a>
