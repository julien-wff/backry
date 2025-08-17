<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { page } from '$app/state';
    import BackupFilterModalContent from '$lib/components/backups/BackupFilterModalContent.svelte';
    import RunElement from '$lib/components/backups/RunElement.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { FileCheck, ListCheck } from '$lib/components/icons';
    import { subscribeApi } from '$lib/helpers/fetch';
    import type { BackupUpdateEventPayload } from '$lib/server/shared/events';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
    import NoBackupWIthFiltersAlert from '$lib/components/backups/NoBackupWIthFiltersAlert.svelte';

    dayjs.extend(relativeTime);
    dayjs.extend(utc);

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let runsData = $state(data.runsData);
    let knownBackupIds = $state(new Set(data.runsData.runs.flatMap(run => run.backups.map(backup => backup.id))));
    $effect(() => {
        runsData = data.runsData;
    });

    let backupCount = $derived(runsData.runs.reduce((acc, run) => acc + run.backups.length, 0));

    onMount(() => {
        return subscribeApi('/api/backups/subscribe', handleSubscriptionUpdate);
    });

    function handleSubscriptionUpdate(chunk: BackupUpdateEventPayload) {
        if (!knownBackupIds.has(chunk.id)) {
            knownBackupIds.add(chunk.id);
            invalidateAll();
        } else {
            runsData = {
                ...runsData,
                runs: runsData.runs.map(run => ({
                    ...run,
                    backups: run.backups.map(backup => (backup.id === chunk.id ? { ...backup, ...chunk } : backup)),
                })),
            };
        }
    }

    let filterModal = $state<HTMLDialogElement>();
    let filterCount = $derived(
        Number(page.url.searchParams.has('job'))
        + Number(page.url.searchParams.has('database'))
        + Number(page.url.searchParams.has('status')),
    );
</script>

<Head title="Latest backups"/>

<PageContentHeader buttonText="See all"
                   buttonType={(backupCount < runsData.limit && filterCount === 0) ? null : 'all'}
                   icon={FileCheck}
                   onsecondarybuttonclick={() => filterModal?.showModal()}
                   secondaryButtonText={filterCount > 0 ? `Filters (${filterCount})` : undefined}
                   secondaryButtonType="filter">
    {#if backupCount <= 1}
        Latest backups
    {:else}
        Latest {backupCount} backups
    {/if}
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each runsData.runs as run (run.id)}
        <RunElement {run} job={runsData.jobs.get(run.jobId)} databases={runsData.databases}/>
    {/each}
</div>

<a class="btn btn-primary btn-soft"
   class:btn-disabled={runsData.nextPageCursor === null}
   class:hidden={runsData.runs.length === 0}
   data-sveltekit-noscroll
   href="backups/all?{page.url.searchParams}"
   role="button">
    <ListCheck class="w-4 h-4"/>
    {#if filterCount > 0}
        See more ({filterCount} filter{filterCount > 1 ? 's' : ''})
    {:else}
        See all
    {/if}
</a>

{#if runsData.runs.length === 0 && filterCount > 0}
    <NoBackupWIthFiltersAlert {filterCount}/>
{/if}

<Modal bind:modal={filterModal} title="Filter backups">
    <BackupFilterModalContent databases={data.databases} jobs={data.jobs}/>
</Modal>
