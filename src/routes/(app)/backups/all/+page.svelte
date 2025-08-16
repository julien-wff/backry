<script lang="ts">
    import { page } from '$app/state';
    import BackupFilterModalContent from '$lib/components/backups/BackupFilterModalContent.svelte';
    import RunElement from '$lib/components/backups/RunElement.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { ListCheck, Plus } from '$lib/components/icons';
    import dayjs from 'dayjs';
    import relativeTime from 'dayjs/plugin/relativeTime';
    import utc from 'dayjs/plugin/utc';
    import type { PageData } from './$types';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { RunsQueryResult } from '$lib/server/schemas/api';
    import { onMount } from 'svelte';

    dayjs.extend(relativeTime);
    dayjs.extend(utc);

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    type RunsData = typeof data['runsData'];

    let apiData = $state<RunsData | null>(null);
    let runsData = $derived(mergeData(data.runsData, apiData));

    let filterModal = $state<HTMLDialogElement>();
    let filterCount = $derived(
        Number(page.url.searchParams.has('job'))
        + Number(page.url.searchParams.has('database'))
        + Number(page.url.searchParams.has('status')),
    );

    function resetApiData() {
        apiData = null;
    }

    async function loadMoreRuns() {
        if (runsData.nextPageCursor === null) {
            return;
        }

        const params = new URLSearchParams(page.url.searchParams);
        params.set('cursor', runsData.nextPageCursor.toString());
        params.set('limit', runsData.limit.toString());

        const res = await fetchApi<RunsQueryResult>('GET', `/api/runs?${params}`, null);
        if (res.isErr()) {
            console.error('Failed to fetch next page of backups:', res.error);
            return;
        }

        const resData = {
            ...res.value,
            jobs: new Map(res.value.jobs.map(job => [ job.id, job ] as const)),
            databases: new Map(res.value.databases.map(db => [ db.id, db ] as const)),
        };

        if (apiData === null) {
            apiData = resData;
        } else {
            apiData = mergeData(apiData, resData);
        }
    }

    function mergeData(baseData: RunsData, newData: RunsData | null): RunsData {
        const runs = [ ...baseData.runs ];
        for (const newRun of (newData?.runs ?? [])) {
            const baseRunIdx = runs.findIndex(br => br.id === newRun.id);
            const baseRun = runs[baseRunIdx];
            if (baseRunIdx !== -1) {
                runs[baseRunIdx] = {
                    ...baseRun,
                    backups: [ ...baseRun.backups, ...newRun.backups ],
                };
            } else {
                runs.push(newRun);
            }
        }

        return ({
            ...baseData,
            runs,
            nextPageCursor: newData !== null ? newData.nextPageCursor : baseData.nextPageCursor,
            jobs: new Map([ ...baseData.jobs.entries(), ...(newData?.jobs.entries() ?? []) ]),
            databases: new Map([ ...baseData.databases.entries(), ...(newData?.databases.entries() ?? []) ]),
        });
    }

    function handleRunDelete(deletedRun: RunsData['runs'][number]) {
        if (apiData?.runs.find(apiRun => apiRun.id === deletedRun.id)) {
            // If the run is in the current API data, remove it from there
            apiData.runs = apiData.runs.filter(apiRun => apiRun.id !== deletedRun.id);
        } else if (apiData) {
            // If the run is in the page data, remove the x first backups from the API data, since invalidateAll will
            // load them into the page data
            // x is the number of backups in the deleted run
            const backupsToRemove = deletedRun.backups.length;
            for (let i = 0; i < backupsToRemove; i++) {
                const firstNonEmptyRun = apiData.runs.findIndex(r => r.backups.length > 0);
                if (firstNonEmptyRun === -1) {
                    break; // No more runs with backups to remove
                }
                apiData.runs[firstNonEmptyRun].backups = apiData.runs[firstNonEmptyRun].backups.slice(1);
            }
        }
    }

    function handleBackupDelete(deletedBackup: RunsData['runs'][number]['backups'][number]) {
        if (apiData?.runs.find(apiRun => apiRun.backups.some(apiBackup => apiBackup.id === deletedBackup.id))) {
            // Remove the backup from the API data
            apiData.runs = apiData.runs.map(apiRun => ({
                ...apiRun,
                backups: apiRun.backups.filter(apiBackup => apiBackup.id !== deletedBackup.id),
            }));
        } else if (apiData) {
            // If the backup is in the page data, remove the first backup of the first run, since invalidateAll will
            // load it into the API data
            const firstRunWithBackups = apiData.runs.findIndex(apiRun => apiRun.backups.length > 0);
            if (firstRunWithBackups === -1) {
                return; // No runs with backups to remove
            }
            apiData.runs[firstRunWithBackups].backups = apiData.runs[firstRunWithBackups].backups.slice(1);
        }
    }

    let bottomElement: HTMLElement;

    onMount(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreRuns();
            }
        }, {
            rootMargin: '400px',
        });
        observer.observe(bottomElement);

        return () => observer.disconnect();
    });
</script>

<Head title="All backups"/>

<PageContentHeader buttonText="Back to live backups"
                   buttonType="back"
                   icon={ListCheck}
                   onsecondarybuttonclick={() => filterModal?.showModal()}
                   secondaryButtonText={filterCount > 0 ? `Filters (${filterCount})` : undefined}
                   secondaryButtonType="filter">
    All backups
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each runsData.runs.filter(r => r.backups.length > 0) as run (run.id)}
        <RunElement {run}
                    job={runsData.jobs.get(run.jobId)}
                    databases={runsData.databases}
                    onrundeleted={() => handleRunDelete(run)}
                    onbackupdeleted={handleBackupDelete}/>
    {/each}
</div>

<button bind:this={bottomElement}
        class="btn btn-primary btn-soft"
        disabled={runsData.nextPageCursor === null}
        onclick={loadMoreRuns}>
    <Plus class="w-4 h-4"/>
    Load more
</button>

<Modal bind:modal={filterModal} title="Filter backups">
    <BackupFilterModalContent databases={data.databases} jobs={data.jobs} onfilterschange={resetApiData}/>
</Modal>
