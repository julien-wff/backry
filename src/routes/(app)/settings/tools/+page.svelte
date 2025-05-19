<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { Settings } from '$lib/components/icons';
    import ToolVersion from '$lib/components/settings/ToolVersion.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Settings - Tools info"/>

<PageContentHeader buttonText="Back to settings" buttonType="back" icon={Settings}>
    Settings - Tools info
</PageContentHeader>


<div class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto">
    <h2 class="font-bold text-lg">
        Command line tools information
    </h2>

    <ToolVersion {...data.bun} name="Bun"/>
    <ToolVersion {...data.svelteKit} name="SvelteKit"/>
    <ToolVersion {...data.restic} name="Restic"/>
    <ToolVersion {...data['postgresql:dump']} name="PGDump"/>
    <ToolVersion {...data['mysql:check']} name="MySQL"/>
    <ToolVersion {...data['mysql:dump']} name="MySQL Dump"/>
    <ToolVersion {...data['sqlite:dump']} name="SQLite"/>
    <ToolVersion {...data['mongodb:dump']} name="MongoDB Dump"/>
</div>
