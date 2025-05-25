<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import FullScreenSelectorCard from '$lib/components/common/selector/FullScreenSelectorCard.svelte';
    import FullScreenSelectorContainer from '$lib/components/common/selector/FullScreenSelectorContainer.svelte';
    import { Settings, Wrench } from '$lib/components/icons';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Settings"/>

<PageContentHeader icon={Settings}>
    Settings
</PageContentHeader>

<FullScreenSelectorContainer gridClass="grid-cols-1">
    <FullScreenSelectorCard error={data.errors.tools} href="tools" icon={Wrench}>
        Tools info
    </FullScreenSelectorCard>
</FullScreenSelectorContainer>
