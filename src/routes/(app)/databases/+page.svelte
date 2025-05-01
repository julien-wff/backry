<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import DatabaseElement from '$lib/components/databases/DatabaseElement.svelte';
    import { Database } from '$lib/components/icons';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>

<Head title="Databases"/>

<PageContentHeader buttonType="new" icon={Database}>
    Databases
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.databases as database (database.id)}
        <DatabaseElement {database}/>
    {/each}
</div>
