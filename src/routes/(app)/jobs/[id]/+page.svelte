<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import ElementForm from '$lib/components/common/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Timer } from '$lib/components/icons';
    import JobDatabaseSelector from '$lib/components/jobs/JobDatabaseSelector.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import type { JobsCreateRequest } from '$lib/types/api';
    import { slugify } from '$lib/utils/format';
    import { parseIdOrNewParam } from '$lib/utils/params';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    const { id, isNew } = parseIdOrNewParam(page.params.id);

    let error = $state<string | null>();
    let isLoading = $state(false);

    let jobName = $state(data.job?.name ?? '');
    let slug = $state(data.job?.slug ?? '');
    let storageBackend = $state<number>(data.job?.storageId ?? -1);
    let cron = $state(data.job?.cron ?? '');
    let selectedDatabases = $state(data.job?.jobsDatabases.map(jd => ({
        id: jd.databaseId,
        enabled: jd.status === 'active',
    })) ?? []);

    let oldJobName = $state('');
    $effect(() => updateSlug(jobName));

    function updateSlug(_: string) {
        if (slugify(oldJobName) === slug) {
            slug = slugify(jobName);
        }
        oldJobName = jobName;
    }

    async function handleFormSubmit() {
        isLoading = true;

        const res = await fetch(isNew ? `/api/jobs` : `/api/jobs/${id}`, {
            method: isNew ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: jobName,
                slug,
                storageId: storageBackend,
                cron,
                databases: selectedDatabases,
            } satisfies JobsCreateRequest),
        });

        const body = await res.json();

        if (body.error) {
            error = body.error;
            isLoading = false;
            return;
        }

        await goto('/jobs');
    }
</script>


<NewPageHeader icon={Timer}>
    Add job pool
</NewPageHeader>


<ElementForm bind:error={error}
             onsubmit={handleFormSubmit}
             title="Add new job pool">
    <InputContainer for="job-name" label="Name">
        <input bind:value={jobName} class="input w-full" id="job-name" required>
    </InputContainer>

    <InputContainer for="slug" label="Slug">
        <input bind:value={slug} class="input w-full" id="slug" pattern="^[a-z0-9\-]+$" required>
    </InputContainer>

    <InputContainer for="backend" label="Storage backend">
        <select bind:value={storageBackend} class="select w-full" id="backend" required>
            {#each data.storages as storage (storage.id)}
                <option value={storage.id}>{storage.name}</option>
            {/each}
        </select>
    </InputContainer>

    <InputContainer for="cron" label="Cron">
        <input bind:value={cron} class="input w-full" id="cron" placeholder="0 0 */2 * *" required>
    </InputContainer>

    <JobDatabaseSelector availableDatabases={data.databases} bind:selection={selectedDatabases}/>

    <button class="btn btn-primary" disabled={isLoading || selectedDatabases.length === 0}>Save</button>
</ElementForm>
