<script lang="ts">
    import { page } from '$app/state';
    import BackupFilterModalContent from '$lib/components/backups/BackupFilterModalContent.svelte';
    import RunElement from '$lib/components/backups/RunElement.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { FileCheck } from '$lib/components/icons';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';
    import { onMount } from 'svelte';
    import type { PageProps } from './$types';
    import { BackupsStore } from '$lib/stores/backups.svelte';

    dayjs.extend(relativeTime);
    dayjs.extend(utc);

    let { data }: PageProps = $props();

    let filterModal = $state<HTMLDialogElement>();
    let filterCount = $derived(
        Number(page.url.searchParams.has('job'))
        + Number(page.url.searchParams.has('database'))
        + Number(page.url.searchParams.has('status')),
    );

    const backupsStore = new BackupsStore(() => data.runsData);
    let bottomElement: HTMLElement;

    onMount(() => {
        const unsubscribeStore = backupsStore.subscribe();
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                backupsStore.fetchNextPage(page.url.searchParams);
            }
        }, {
            rootMargin: '400px',
        });
        observer.observe(bottomElement);

        return () => {
            unsubscribeStore();
            observer.disconnect();
        };
    });
</script>

<Head title="Latest backups"/>

<PageContentHeader icon={FileCheck}
                   onsecondarybuttonclick={() => filterModal?.showModal()}
                   secondaryButtonText={filterCount > 0 ? `Filters (${filterCount})` : undefined}
                   secondaryButtonType="filter">
    {#if backupsStore.backupCount <= 1}
        Latest backups
    {:else}
        Latest {backupsStore.backupCount} backups
    {/if}
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each backupsStore.runs as run (run.id)}
        <RunElement {run} job={backupsStore.getRunJob(run)} databases={backupsStore.databases}/>
    {/each}
</div>

<button class="btn btn-primary btn-soft"
        bind:this={bottomElement}
        onclick={() => backupsStore.fetchNextPage(page.url.searchParams)}
        disabled={!backupsStore.isMoreAvailable}>
    Load more
</button>

<Modal bind:modal={filterModal} title="Filter backups">
    <BackupFilterModalContent databases={data.databases}
                              jobs={data.jobs}
                              onupdated={() => backupsStore.resetApiData()}/>
</Modal>
