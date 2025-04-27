<script lang="ts">
    import ElementForm from '$lib/components/common/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import type { JobsCreateRequest } from '$lib/types/api';
    import { slugify } from '$lib/utils/format';
    import Timer from '@lucide/svelte/icons/timer';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let error = $state<string | null>();
    let isLoading = $state(false);

    let jobName = $state('');
    let slug = $state('');
    let storageBackend = $state<number>(-1);
    let cron = $state('');
    let databases = $state<Array<{ id: number }>>([]);

    let canAddDatabases = $derived(databases.length < data.databases.length);

    function handleAddDatabase() {
        databases = [
            ...databases,
            { id: -1 },
        ];
    }

    function handleRemoveDatabase(index: number) {
        databases = databases.filter((_, i) => index != i);
    }

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

        const res = await fetch(`/api/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: jobName,
                slug,
                storageId: storageBackend,
                cron,
                databases,
            } as JobsCreateRequest),
        });

        if (!res.ok) {
            error = 'Unknown error';
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

    <InputContainer label="Databases">
        {#each databases as _, i}
            <fieldset class="relative fieldset bg-base-100 border border-base-300 p-4 rounded-box">
                <legend class="fieldset-legend">Database #{i + 1}</legend>

                <button type="button" class="btn btn-error btn-soft btn-xs absolute right-4 -top-6"
                        onclick={() => handleRemoveDatabase(i)}>
                    <Trash2 class="w-3 h-3"/>
                    Remove
                </button>

                <select class="select select-sm w-full" bind:value={databases[i].id} id="database-{i}" required>
                    {#each data.databases as availableDb (availableDb.id)}
                        <option value={availableDb.id}>{availableDb.name}</option>
                    {/each}
                </select>
            </fieldset>
        {/each}

        <button class="btn btn-primary btn-sm btn-soft"
                class:mt-1={databases.length > 0}
                disabled={!canAddDatabases}
                onclick={handleAddDatabase}
                type="button">
            Add database
        </button>
    </InputContainer>

    <button class="btn btn-primary" disabled={isLoading || databases.length === 0}>Save</button>
</ElementForm>
