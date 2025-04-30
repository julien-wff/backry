<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import StatusCard from '$lib/components/dashboard/StatusCard.svelte';
    import { CloudUpload, Database, LayoutDashboard, RefreshCw } from '$lib/components/icons';
    import TableHeader from '$lib/components/table/TableHeader.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Dashboard"/>

<TableHeader icon={LayoutDashboard} noNew>
    Dashboard
</TableHeader>

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
                title="{data.stats.storages.total} Storage backends"/>
    <StatusCard active={data.stats.jobs.active}
                href="/jobs"
                icon={RefreshCw}
                inactive={data.stats.jobs.inactive}
                title="{data.stats.jobs.total} Backup job pools"/>
</div>
