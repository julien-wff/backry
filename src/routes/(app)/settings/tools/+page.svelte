<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { Settings } from '$lib/components/icons';
    import ToolVersion from '$lib/components/settings/tools/ToolVersion.svelte';
    import { onMount } from 'svelte';
    import type { PageProps } from './$types';
    import ToolVersionCategory from '$lib/components/settings/tools/ToolVersionCategory.svelte';

    let { data }: PageProps = $props();

    onMount(() => {
        // Fetch the latest update for tools validity in the layout, because +page.server.ts updates it
        invalidateAll();
    });
</script>

<Head title="Settings - Tools info"/>

<PageContentHeader buttonText="Back to settings" buttonType="back" icon={Settings}>
    Settings - Tools info
</PageContentHeader>


<div class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto">
    <h2 class="font-bold text-lg">
        Command line tools information
    </h2>

    <ToolVersionCategory icon="/favicon.png" name="Common">
        <ToolVersion {...data.bun} name="Bun"/>
        <ToolVersion {...data.svelteKit} name="SvelteKit"/>
        <ToolVersion {...data.restic} name="Restic"/>
        <ToolVersion {...data.shoutrrr} name="Shoutrrr"/>
    </ToolVersionCategory>

    <ToolVersionCategory icon="/icons/postgres.svg" name="PostgreSQL">
        <ToolVersion {...data['postgresql:restore']} name="PSQL"/>
        <ToolVersion {...data['postgresql:dump']} name="PGDump"/>
    </ToolVersionCategory>

    <ToolVersionCategory icon="/icons/mysql.svg" name="MySQL">
        <ToolVersion {...data['mysql:restore']} name="MySQL"/>
        <ToolVersion {...data['mysql:check']} name="MySQL (check only)"/>
        <ToolVersion {...data['mysql:dump']} name="MySQL Dump"/>
    </ToolVersionCategory>

    <ToolVersionCategory icon="/icons/sqlite.svg" name="SQLite">
        <ToolVersion {...data['sqlite:dump']} name="SQLite"/>
        <ToolVersion {...data['sqlite:restore']} name="SQLite (restore only)"/>
    </ToolVersionCategory>

    <ToolVersionCategory icon="/icons/mongodb.svg" name="MongoDB">
        <ToolVersion {...data['mongodb:dump']} name="MongoDB Dump"/>
        <ToolVersion {...data['mongodb:restore']} name="MongoDB Restore"/>
    </ToolVersionCategory>
</div>
