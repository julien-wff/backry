<script lang="ts">
    import { page } from '$app/state';
    import Head from '$lib/components/common/Head.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import DatabaseElement from '$lib/components/databases/DatabaseElement.svelte';
    import DatabaseFilterModalContent from '$lib/components/databases/DatabaseFilterModalContent.svelte';
    import { Database } from '$lib/components/icons';
    import type { PageData } from './$types';
    import type { ModalControls } from '$lib/helpers/modal';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let filterModalControls = $state<ModalControls>();
    let filterCount = $derived(page.url.searchParams.get('engines')?.split(',').length ?? 0);
</script>

<Head title="Databases"/>

<PageContentHeader buttonType="new"
                   icon={Database}
                   onsecondarybuttonclick={() => filterModalControls?.open()}
                   secondaryButtonText={filterCount > 0 ? `Filter (${filterCount})` : undefined}
                   secondaryButtonType="filter">
    Databases
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.databases as database (database.id)}
        <DatabaseElement {database}/>
    {/each}
</div>

<Modal bind:controls={filterModalControls} title="Filter databases">
    <DatabaseFilterModalContent/>
</Modal>
