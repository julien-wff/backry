<script lang="ts">
    import DatabaseElement from '$lib/components/databases/DatabaseElement.svelte';
    import TableHeader from '$lib/components/table/TableHeader.svelte';
    import Database from '@lucide/svelte/icons/database';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>


<TableHeader icon={Database}>Databases</TableHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.databases as database (database.id)}
        <DatabaseElement {database}/>
    {/each}
</div>
