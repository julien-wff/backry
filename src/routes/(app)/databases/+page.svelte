<script lang="ts">
    import { page } from '$app/state';
    import { ENGINES_META } from '$lib/common/engines-meta';
    import Head from '$lib/components/common/Head.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import DatabaseElement from '$lib/components/databases/DatabaseElement.svelte';
    import DatabaseFilterModalContent from '$lib/components/databases/DatabaseFilterModalContent.svelte';
    import { Database } from '$lib/components/icons';
    import type { ModalControls } from '$lib/helpers/modal';
    import type { PageData } from './$types';

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
    {#if !data.splitDatabasesByEngine}
        {#each data.databases as database (database.id)}
            <DatabaseElement {database} hideContainer={!data.settings.dockerURI}/>
        {/each}
    {:else}
        {#each data.databasesByEngine as { engine }}
            {@const meta = ENGINES_META[engine]}
            {@const databases = data.databases.filter(db => db.engine === engine)}

            {#if databases.length > 0}
                <div class="grid grid-cols-1 gap-2">
                    <div class="flex items-center gap-2">
                        <img class="inline h-5" src={meta.icon} alt=""/>
                        <h2 class="text-lg font-medium">{meta.displayName}</h2>
                    </div>

                    <div class="grid grid-cols-1 gap-2">
                        {#each databases as database (database.id)}
                            <DatabaseElement {database} hideEngine hideContainer={!data.settings.dockerURI}/>
                        {/each}
                    </div>
                </div>
            {/if}
        {/each}
    {/if}
</div>

<Modal bind:controls={filterModalControls} title="Filter databases">
    <DatabaseFilterModalContent/>
</Modal>
