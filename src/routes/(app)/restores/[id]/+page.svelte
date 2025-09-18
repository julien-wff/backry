<script lang="ts">
    import { History, OctagonAlert } from '$lib/components/icons.js';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import type { PageProps } from './$types.js';
    import RestoreStep from '$lib/components/restores/RestoreStep.svelte';
    import RestoreRecap from '$lib/components/restores/RestoreRecap.svelte';

    let { data }: PageProps = $props();
</script>

<Head title="Restore backup"/>

<PageContentHeader buttonText="Back" buttonType="back" icon={History}>
    Restore backup
</PageContentHeader>


<ElementForm title="{data.restore.backup?.jobDatabase.database.name} backup restore">
    <div>
        <RestoreRecap backup={data.restore.backup}
                      contrasted
                      dropDatabase={Boolean(data.restore.dropDatabase)}
                      otherConnectionString={data.restore.connectionString}
                      selectedDestination={data.restore.destination}/>
    </div>

    <div class="flex flex-col gap-1">
        <RestoreStep displayName="Check backup"
                     restore={data.restore}
                     step="check_backup"/>
        <RestoreStep displayName="Check destination"
                     restore={data.restore}
                     step="check_destination"/>
        {#if data.restore.dropDatabase}
            <RestoreStep displayName="Drop destination database"
                         restore={data.restore}
                         step="drop_db"/>
        {/if}
        <RestoreStep displayName="Restore"
                     restore={data.restore}
                     step="restore"/>
    </div>

    {#if data.restore.error}
        <div class="alert alert-error alert-soft">
            <OctagonAlert class="w-5 h-5"/>
            {data.restore.error}
        </div>
    {/if}
</ElementForm>
