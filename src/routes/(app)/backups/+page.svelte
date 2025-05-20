<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import RunElement from '$lib/components/backups/RunElement.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { FileCheck } from '$lib/components/icons';
    import { subscribeApi } from '$lib/helpers/fetch';
    import type { BackupUpdateEventPayload } from '$lib/server/shared/events';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    dayjs.extend(relativeTime);
    dayjs.extend(utc);

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let runs = $state(data.runs);
    let knownBackupIds = $state(new Set(data.runs.flatMap(run => run.backups.map(backup => backup.id))));
    $effect(() => {
        runs = data.runs;
        knownBackupIds = new Set(data.runs.flatMap(run => run.backups.map(backup => backup.id)));
    });

    onMount(() => {
        return subscribeApi('/api/backups/subscribe', handleSubscriptionUpdate);
    });

    function handleSubscriptionUpdate(chunk: BackupUpdateEventPayload) {
        if (!knownBackupIds.has(chunk.id)) {
            invalidateAll();
        } else {
            runs = runs.map(run => ({
                ...run,
                backups: run.backups.map(backup => (backup.id === chunk.id ? { ...backup, ...chunk } : backup)),
            }));
        }
    }
</script>

<Head title="Backups"/>

<PageContentHeader icon={FileCheck}>
    Backups
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each runs as run (run.id)}
        {#if run.backups.length > 0}
            <RunElement {run}/>
        {/if}
    {/each}
</div>
