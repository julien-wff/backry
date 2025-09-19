<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { History } from '$lib/components/icons';
    import type { PageData } from './$types';
    import RestoreElement from '$lib/components/restores/RestoreElement.svelte';
    import HowToRestoreAlert from '$lib/components/restores/HowToRestoreAlert.svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Restores"/>

<PageContentHeader icon={History}>
    Restores
</PageContentHeader>

{#if data.restores.length === 0}
    <HowToRestoreAlert/>
{:else}
    <div class="grid grid-cols-1 gap-4">
        {#each data.restores as restore (restore.id)}
            <RestoreElement {restore}/>
        {/each}
    </div>
{/if}
