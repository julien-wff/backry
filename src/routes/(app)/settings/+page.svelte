<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import { Settings, Wrench } from '$lib/components/icons';
    import NewElementCard from '$lib/components/new-elements/NewElementCard.svelte';
    import NewElementsContainer from '$lib/components/new-elements/NewElementsContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
</script>

<Head title="Settings"/>

<NewPageHeader icon={Settings}>
    Settings
</NewPageHeader>

<NewElementsContainer gridClass="grid-cols-1">
    <NewElementCard href="tools" icon={Wrench}>
        Tools info
    </NewElementCard>
</NewElementsContainer>
