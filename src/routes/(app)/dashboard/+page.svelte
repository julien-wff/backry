<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import LatestBackupsCard from '$lib/components/dashboard/LatestBackupsCard.svelte';
    import NextJobsCard from '$lib/components/dashboard/NextJobsCard.svelte';
    import StatsCard from '$lib/components/dashboard/StatsCard.svelte';
    import StatusCard from '$lib/components/dashboard/StatusCard.svelte';
    import {
        CloudUpload,
        Database,
        FileChartPie,
        FileCheck,
        HardDrive,
        LayoutDashboard,
        Timer,
    } from '$lib/components/icons';
    import { formatSize } from '$lib/helpers/format';
    import { formatDuration } from '$lib/helpers/format.js';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Dashboard"/>

<PageContentHeader icon={LayoutDashboard}>
    Dashboard
</PageContentHeader>

<div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 gap-4">
        <StatusCard active={data.stats.databases.active}
                    error={data.stats.databases.error}
                    href="/databases"
                    icon={Database}
                    title="{data.stats.databases.total} Databases"/>
        <StatusCard active={data.stats.storages.active}
                    error={data.stats.storages.error}
                    href="/storages"
                    icon={CloudUpload}
                    title="{data.stats.storages.total} Storage backends"
                    unhealthy={data.stats.storages.unhealthy}/>
        <StatusCard active={data.stats.jobs.active}
                    href="/jobs"
                    icon={Timer}
                    inactive={data.stats.jobs.inactive}
                    title="{data.stats.jobs.total} Backup jobs"/>
    </div>

    <div class="grid grid-cols-2 gap-4">
        <LatestBackupsCard backups={data.stats.latestBackups}/>
        <NextJobsCard jobs={data.stats.nextJobs}/>
    </div>

    <div class="grid grid-cols-4 gap-4">
        <StatsCard href="/backups"
                   icon={FileCheck}
                   stat={data.stats.backupsCount}
                   title="Backup count">
            backup{data.stats.backupsCount > 1 ? 's' : ''} total
        </StatsCard>
        <StatsCard href="/storages"
                   icon={HardDrive}
                   stat={formatSize(data.stats.totalStorageSize)}
                   title="Total disk usage">
            used
        </StatsCard>
        <StatsCard href="/backups"
                   icon={FileChartPie}
                   stat={formatSize(data.stats.averageDumpSize)}
                   title="Dump size">
            average
        </StatsCard>
        <StatsCard href="/backups"
                   icon={Timer}
                   stat={formatDuration(data.stats.averageBackupDuration)}
                   title="Backup duration">
            average
        </StatsCard>
    </div>
</div>
