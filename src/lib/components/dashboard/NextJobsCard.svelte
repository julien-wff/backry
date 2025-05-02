<script lang="ts">
    import { Timer } from '$lib/components/icons';
    import type { getDashboardStats } from '$lib/queries/shared';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';

    dayjs.extend(relativeTime);

    interface Props {
        jobs: Awaited<ReturnType<typeof getDashboardStats>>['nextJobs'];
    }

    let { jobs }: Props = $props();
</script>


<a class="w-full bg-base-100 rounded-box p-4" href="/jobs">
    <div class="flex items-center gap-2">
        <Timer size={24}/>
        <h3 class="text-lg font-bold">
            Next job runs
        </h3>
    </div>

    <div class="flex flex-col gap-2 mt-4">
        {#each jobs as job}
            {@const executionDate = dayjs(job.nextDate).fromNow()}

            <div class="flex items-center justify-between gap-2 bg-base-200 py-2 px-3 rounded-box">
                <div class="flex flex-col">
                    <span>
                        {job.name} - {job.jobsDatabases?.length ?? 0}
                        database{(job.jobsDatabases?.length ?? 0) > 1 ? 's' : ''}
                    </span>
                    <span class="text-sm text-base-content/50 line-clamp-1">
                        {executionDate.slice(0, 1).toUpperCase()}{executionDate.slice(1)} -
                        to {job.storage?.name}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</a>
