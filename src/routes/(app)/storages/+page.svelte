<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import StorageElement from '$lib/components/storages/StorageElement.svelte';
    import TableHeader from '$lib/components/table/TableHeader.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Storages"/>

<TableHeader icon={CloudUpload}>Storages</TableHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.storages as storage (storage.id)}
        <StorageElement {storage}/>
    {/each}
</div>
