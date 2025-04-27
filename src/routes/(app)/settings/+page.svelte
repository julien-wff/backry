<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import NewElementCard from '$lib/components/new-elements/NewElementCard.svelte';
    import NewElementsContainer from '$lib/components/new-elements/NewElementsContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import Settings from '@lucide/svelte/icons/settings';
    import Wrench from '@lucide/svelte/icons/wrench';
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
