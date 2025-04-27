<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import ToolVersion from '$lib/components/settings/ToolVersion.svelte';
    import Settings from '@lucide/svelte/icons/settings';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Settings - Tools info"/>

<NewPageHeader backText="Back to settings" icon={Settings}>
    Settings - Tools info
</NewPageHeader>


<div class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto">
    <h2 class="font-bold text-lg">
        Command line tools information
    </h2>

    <ToolVersion {...data.bun} name="Bun"/>
    <ToolVersion {...data.svelteKit} name="SvelteKit"/>
    <ToolVersion {...data.restic} name="Restic"/>
    <ToolVersion {...data.postgresql} name="PGDump"/>
    <ToolVersion {...data.sqlite} name="SQLite"/>
</div>
