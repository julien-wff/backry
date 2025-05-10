<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BackupElement from '$lib/components/backups/BackupElement.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { FileCheck } from '$lib/components/icons';
    import type { BackupUpdateEventPayload } from '$lib/shared/events';
    import { subscribeApi } from '$lib/utils/api';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let backups = $state(data.backups);
    $effect(() => {
        backups = data.backups;
    });

    onMount(() => {
        return subscribeApi('/api/backups/subscribe', handleSubscriptionUpdate);
    });

    function handleSubscriptionUpdate(chunk: BackupUpdateEventPayload) {
        const backupRun = backups.find(backup => backup.id === chunk.id);
        if (!backupRun) {
            invalidateAll();
        } else {
            backups = backups.map(backup => (backup.id === chunk.id ? { ...backup, ...chunk } : backup));
        }
    }
</script>

<Head title="Backups"/>

<PageContentHeader icon={FileCheck}>
    Backups
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each backups as backup (backup.id)}
        <BackupElement {backup}/>
    {/each}
</div>
