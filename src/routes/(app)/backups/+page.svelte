<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BackupElement from '$lib/components/backups/BackupElement.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import RunOriginIndicator from '$lib/components/common/RunOriginIndicator.svelte';
    import { FileCheck } from '$lib/components/icons';
    import type { BackupUpdateEventPayload } from '$lib/shared/events';
    import { subscribeApi } from '$lib/utils/api';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
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
            <div class="grid grid-cols-1 gap-2 rounded-lg p-2 bg-base-200" transition:fade={{ duration: 300 }}>
                <div class="flex gap-2 text-sm align-center">
                    <RunOriginIndicator origin={run.origin}/>
                    Run #{run.id} - {run.backups[0].jobDatabase.job.name} - {dayjs.utc(run.createdAt).fromNow()}
                </div>

                {#each run.backups as backup (backup.id)}
                    <div transition:fade={{ duration: 300 }}>
                        <BackupElement {backup}/>
                    </div>
                {/each}
            </div>
        {/if}
    {/each}
</div>
