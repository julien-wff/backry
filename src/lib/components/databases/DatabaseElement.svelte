<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import CollapsableElementList from '$lib/components/common/CollapsableElementList.svelte';
    import EngineIndicator from '$lib/components/common/EngineIndicator.svelte';
    import { EthernetPort, FileCheck, Timer } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { databasesListExtendedFiltered } from '$lib/server/queries/databases';
    import type { DatabaseResponse } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';

    interface Props {
        database: Awaited<ReturnType<typeof databasesListExtendedFiltered>>[number];
    }


    let { database }: Props = $props();
    let loading = $state(false);

    let jobListFormatted = $derived(database.jobsDatabases.map(db => ({
        id: db.job.id,
        name: db.job.name,
        disabled: db.job.status === 'inactive',
    })));

    async function deleteDatabase() {
        loading = true;
        const res = await fetchApi<DatabaseResponse>('DELETE', `/api/databases/${database.id}`, null);

        if (res.isOk()) {
            await invalidateAll();
        } else {
            addToast(`Failed to delete database #${database.id}: ${res.error}`, 'error');
        }

        loading = false;
    }
</script>


{#snippet secondaryButtons()}
    <a class="btn btn-success btn-sm btn-soft" href="/backups?database={database.id}">
        <FileCheck class="w-4 h-4"/>
        View backups
    </a>
{/snippet}


<BaseListElement deleteConfirmationMessage={`The database "${database.name}" will be deleted from Backry.`}
                 disabled={loading}
                 editHref={`/databases/${database.id}`}
                 error={database.error}
                 ondelete={deleteDatabase}
                 secondaryBtns={secondaryButtons}
                 status={database.status}
                 title={database.name}>
    <EngineIndicator engine={database.engine}/>

    <div class="flex items-center gap-1">
        <EthernetPort class="w-4 h-4"/>
        {database.connectionString}
    </div>

    <div class="flex items-center gap-1">
        <Timer class="w-4 h-4"/>
        {#if database.jobsDatabases.length === 0}
            No jobs
        {:else}
            Jobs:
            <CollapsableElementList elements={jobListFormatted}/>
        {/if}
    </div>
</BaseListElement>
