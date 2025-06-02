<script lang="ts">
    import { goto } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import SlugInput from '$lib/components/forms/SlugInput.svelte';
    import { Timer } from '$lib/components/icons';
    import JobDatabaseSelector from '$lib/components/jobs/JobDatabaseSelector.svelte';
    import JobPrunePolicyField from '$lib/components/jobs/JobPrunePolicyField.svelte';
    import { randomId } from '$lib/helpers/common';
    import { fetchApi } from '$lib/helpers/fetch';
    import { type jobRequest, type JobResponse } from '$lib/server/schemas/api';
    import { sendAt, validateCronExpression } from 'cron';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let error = $state<string | null>();
    let isLoading = $state(false);

    let jobName = $state(data.job?.name ?? '');
    let slug = $state(data.job?.slug ?? '');
    let storageBackend = $state<number>(data.job?.storageId ?? -1);
    let cron = $state(data.job?.cron ?? '');
    let prunePolicy = $state(data.job?.prunePolicy ?? '');
    let selectedDatabases = $state(data.job?.jobsDatabases.map(jd => ({
        databaseId: jd.databaseId,
        enabled: jd.status === 'active',
        selectionId: randomId(),
    })) ?? []);

    const clientTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cronMessage = $derived(validateCronExpression(cron).valid
        ? `Next: ${sendAt(cron).setZone(data.serverTimeZone, { keepLocalTime: true }).toJSDate().toLocaleString()} (${clientTimeZone})`
        : 'Invalid expression',
    );

    async function handleFormSubmit() {
        isLoading = true;

        const res = await fetchApi<JobResponse, typeof jobRequest>(
            data.isNew ? 'POST' : 'PUT',
            data.isNew ? `/api/jobs` : `/api/jobs/${data.id}`, {
                name: jobName,
                slug,
                storageId: storageBackend,
                cron,
                prunePolicy,
                databases: selectedDatabases.map(db => ({
                    id: db.databaseId,
                    enabled: db.enabled,
                })),
            },
        );

        if (res.isErr()) {
            error = res.error;
            isLoading = false;
            return;
        }

        await goto('/jobs');
    }
</script>


{#snippet cronHelp()}
    <div class="flex flex-col gap-2">
        <p>
            A cron expression is a string consisting of 5 or 6 fields separated by spaces. Each field represents a
            unit of time.
        </p>
        <p>
            Cron jobs runs on Backry's server or container timezone,
            <span class="text-nowrap text-primary">{data.serverTimeZone}</span>.
            <br/>
            To change the timezone, see
            <a href="https://github.com/julien-wff/backry" class="link link-primary">the documentation</a>.
        </p>
        <p>
            To learn more about cron expressions, visit
            <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" class="link link-primary">
                crontab.guru
            </a>.
        </p>
    </div>
{/snippet}


<Head title="{data.job ? `Edit ${data.job.name}` : 'Add'} job"/>

<PageContentHeader buttonType="back" icon={Timer}>
    {data.job ? 'Edit' : 'Add'} job
</PageContentHeader>

<ElementForm bind:error={error}
             onsubmit={handleFormSubmit}
             title="{data.job ? 'Edit' : 'Add'} job">
    <InputContainer for="job-name" label="Name">
        <input bind:value={jobName} class="w-full input" id="job-name" required>
    </InputContainer>


    <SlugInput baseValue={jobName} bind:slug disabled={!!data.job} source="job"/>

    <InputContainer for="backend" label="Storage backend">
        <select bind:value={storageBackend} class="w-full select" id="backend" required>
            {#each data.storages as storage (storage.id)}
                <option value={storage.id} disabled={storage.status !== 'active'}>
                    {storage.name}
                </option>
            {/each}
        </select>
    </InputContainer>

    <InputContainer for="cron" helpContent={cronHelp} label="Cron" subtitle={cronMessage}>
        <input bind:value={cron} class="w-full input" id="cron" placeholder="0 0 */2 * *" required>
    </InputContainer>

    <JobPrunePolicyField bind:prunePolicy {cron} isCronValid={validateCronExpression(cron).valid}/>

    <JobDatabaseSelector availableDatabases={data.databases} bind:selection={selectedDatabases}/>

    <button class="btn btn-primary" disabled={isLoading || selectedDatabases.length === 0}>Save</button>
</ElementForm>
