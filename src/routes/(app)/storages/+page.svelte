<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { CloudUpload } from '$lib/components/icons';
    import StorageElement from '$lib/components/storages/StorageElement.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Storages"/>

<PageContentHeader buttonType="new" icon={CloudUpload}>
    Storages
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.storages as storage (storage.id)}
        <StorageElement {storage}/>
    {/each}
</div>
