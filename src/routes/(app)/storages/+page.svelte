<script lang="ts">
    import DatabaseElement from '$lib/components/databases/DatabaseElement.svelte';
    import TableHeader from '$lib/components/table/TableHeader.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<TableHeader icon={CloudUpload}>Storages</TableHeader>
