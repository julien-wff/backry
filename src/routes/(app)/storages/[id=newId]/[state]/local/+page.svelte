<script lang="ts">
    import EnvVarInput from '$lib/components/forms/EnvVarInput.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import { page } from '$app/state';
    import type { StoragesCheckLocalRequest, StoragesCheckLocalResponse, StoragesCreateRequest } from '$lib/types/api';

    let isExistingRepository = $state(page.params['state'] === 'existing');
    let error = $state<string | null>(null);
    let isLoading = $state(false);
    let arePreChecksValid = $state(false);

    let repoName = $state('');
    let filePath = $state('');
    let password = $state('');
    let subPath = $state('/');

    let envVars = $state<{ key: string; value: string }[]>([]);
    let envRecords = $derived(envVars.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>));

    async function handleFormSubmit(ev: SubmitEvent) {
        ev.preventDefault();
        error = null;
        isLoading = true;

        if (!arePreChecksValid) {
            await checkPath();
        } else {
            await createRepository();
        }

        isLoading = false;
    }

    async function checkPath() {
        const res = await fetch('/api/storages/check-local', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                url: filePath,
                password,
                env: envRecords,
                checkRepository: isExistingRepository,
            } as StoragesCheckLocalRequest),
        });
        const data = await res.json() as StoragesCheckLocalResponse;

        if (data.path) {
            filePath = data.path;
        }

        if (data.error !== null) {
            error = data.error;
            return;
        }

        if (isExistingRepository) {
            if (data.resticError) {
                error = data.resticError.message;
            } else {
                await saveRepositoryToDb();
            }
            return;
        }

        if (!isExistingRepository && !data.isEmpty) {
            error = 'Folder must be empty to create initialize a repository';
            return;
        }

        arePreChecksValid = true;
    }

    async function createRepository() {
        const res = await fetch('/api/storages/create-repository', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name: repoName,
                url: `local:${filePath}`,
                password,
                env: envRecords,
            } as StoragesCheckLocalRequest),
        });
        const data = await res.json();

        if (data.error) {
            error = data.error;
            return;
        }
    }

    async function saveRepositoryToDb() {
        const res = await fetch('/api/storages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name: repoName,
                url: `local:${filePath}`,
                type: 'local',
                subPath,
                password,
                env: envRecords,
            } as StoragesCreateRequest),
        });

        if (!res.ok) {
            const data = await res.json();
            error = data.error || 'Failed to save repository';
            return;
        }
    }
</script>

<NewPageHeader backText="Back to connection type" currentStep={3} icon={CloudUpload} totalSteps={3}>
    Add storage backend - local
</NewPageHeader>


<form class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto" onsubmit={handleFormSubmit}>
    <h2 class="font-bold text-lg">
        Add {isExistingRepository ? 'existing' : 'and initialize'} local Restic repository
    </h2>

    {#if error}
        <p class="text-error">Error: {error}</p>
    {/if}

    <InputContainer for="repo-name" label="Name">
        <input bind:value={repoName} class="input w-full" id="repo-name" required>
    </InputContainer>

    <InputContainer for="repo-path" label="Repository path">
        <input bind:value={filePath} class="input w-full" id="repo-path" placeholder="/data/repo-path" required>
    </InputContainer>

    <InputContainer for="repo-sub-path" label="Repository internal sub-path">
        <input bind:value={subPath} class="input w-full" id="repo-sub-path" placeholder="/" required>
    </InputContainer>

    <InputContainer for="repo-password" label="Repository password">
        <input bind:value={password} class="input w-full" id="repo-password" required type="password">
    </InputContainer>

    <EnvVarInput bind:envVars/>

    <button class="btn btn-primary" disabled={arePreChecksValid || isLoading} type="submit">
        {isExistingRepository ? 'Check and save' : 'Check path'}
    </button>

    {#if arePreChecksValid}
        <button class="btn btn-primary" type="submit">
            Create repository and save
        </button>
    {/if}
</form>
