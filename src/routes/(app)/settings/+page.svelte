<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import FullScreenSelectorCard from '$lib/components/common/selector/FullScreenSelectorCard.svelte';
    import FullScreenSelectorContainer from '$lib/components/common/selector/FullScreenSelectorContainer.svelte';
    import { Bell, Info, Settings, Wrench, Blocks } from '$lib/components/icons';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Settings"/>

<PageContentHeader icon={Settings}>
    Settings
</PageContentHeader>

<FullScreenSelectorContainer gridClass="grid-cols-2">
    <FullScreenSelectorCard href="about" icon={Info}>
        About Backry
    </FullScreenSelectorCard>
    <FullScreenSelectorCard error={data.errors.tools} href="tools" icon={Wrench}>
        Tools info
    </FullScreenSelectorCard>
    <FullScreenSelectorCard error={data.errors.notifications > 0} href="notifications" icon={Bell}>
        Notifications
    </FullScreenSelectorCard>
    <FullScreenSelectorCard href="docker" icon={Blocks}>
        Docker
    </FullScreenSelectorCard>
</FullScreenSelectorContainer>
