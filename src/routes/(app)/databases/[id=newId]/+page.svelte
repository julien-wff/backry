<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import NewElementCard from '$lib/components/new-elements/NewElementCard.svelte';
    import NewElementsContainer from '$lib/components/new-elements/NewElementsContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import Database from '@lucide/svelte/icons/database';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="Add database - engine"/>

<NewPageHeader currentStep={1} icon={Database} totalSteps={2}>
    Add database - engine
</NewPageHeader>

<NewElementsContainer gridClass="grid-cols-2">
    {#each data.engines as engine (engine.id)}
        <NewElementCard href={engine.id} icon="/icons/{engine.icon}">
            {engine.displayName}
        </NewElementCard>
    {/each}
</NewElementsContainer>
