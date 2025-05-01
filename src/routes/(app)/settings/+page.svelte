<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { Settings, Wrench } from '$lib/components/icons';
    import NewElementCard from '$lib/components/new-elements/NewElementCard.svelte';
    import NewElementsContainer from '$lib/components/new-elements/NewElementsContainer.svelte';
</script>

<Head title="Settings"/>

<PageContentHeader icon={Settings}>
    Settings
</PageContentHeader>

<NewElementsContainer gridClass="grid-cols-1">
    <NewElementCard href="tools" icon={Wrench}>
        Tools info
    </NewElementCard>
</NewElementsContainer>
