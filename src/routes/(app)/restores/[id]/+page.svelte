<script lang="ts">
    import { History, OctagonAlert } from '$lib/components/icons.js';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import type { PageProps } from './$types.js';
    import RestoreStep from '$lib/components/restores/RestoreStep.svelte';
    import RestoreRecap from '$lib/components/restores/RestoreRecap.svelte';
    import { onMount } from 'svelte';
    import { subscribeApi } from '$lib/helpers/fetch';
    import type { RestoreUpdateEventPayload } from '$lib/server/shared/events';

    let { data }: PageProps = $props();

    let restore = $derived(data.restore);

    onMount(() => {
        // Only subscribe to unfinished restores
        if (!restore.finishedAt) {
            return subscribeApi(`/api/restores/${data.restore.id}/subscribe`, handleSubscriptionUpdate);
        }
    });

    function handleSubscriptionUpdate(chunk: RestoreUpdateEventPayload) {
        restore = { ...restore, ...chunk };
    }
</script>

<Head title="Restore backup"/>

<PageContentHeader buttonText="Back" buttonType="back" icon={History}>
    Restore backup
</PageContentHeader>


<ElementForm title="{restore.backup?.jobDatabase.database.name ?? 'Unknown'} backup restore">
    <div>
        <RestoreRecap backup={restore.backup}
                      contrasted
                      dropDatabase={restore.dropDatabase}
                      otherConnectionString={restore.connectionString}
                      selectedDestination={restore.destination}
                      sourceDatabase={restore.backup?.jobDatabase.database ?? null}
                      sourceJobName={restore.backup?.jobDatabase.job.name}/>
    </div>

    <div class="flex flex-col gap-1">
        <RestoreStep displayName="Check backup" {restore} step="check_backup"/>
        <RestoreStep displayName="Check destination" {restore} step="check_destination"/>
        {#if restore.dropDatabase}
            <RestoreStep displayName="Drop destination database" {restore} step="drop_db"/>
        {/if}
        <RestoreStep displayName="Restore" {restore} step="restore"/>
    </div>

    {#if restore.error}
        <div class="alert alert-error alert-soft">
            <OctagonAlert class="w-5 h-5"/>
            {restore.error}
        </div>
    {/if}
</ElementForm>
