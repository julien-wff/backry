<script lang="ts">
    import { goto } from '$app/navigation';
    import ElementForm from '$lib/components/common/ElementForm.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import EnvVarInput from '$lib/components/forms/EnvVarInput.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ArchiveRestore, CloudUpload, PackageOpen } from '$lib/components/icons';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import type { StoragesCheckRequest, StoragesCheckResponse, StoragesCreateRequest } from '$lib/types/api';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();

    let isExistingRepository = $state(!!data.storage);
    let error = $state<string | null>(null);
    let isLoading = $state(false);
    let arePreChecksValid = $state(false);

    let repoName = $state(data.storage?.name ?? '');
    let repoUrl = $state(data.storage?.url ?? '');
    let password = $state(data.storage?.password ?? '');

    let envVars = $state<{ key: string; value: string }[]>(
        Object.entries(data.storage?.env ?? {}).map(([ key, value ]) => ({ key, value })),
    );
    let envRecords = $derived(envVars.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>));

    async function handleFormSubmit() {
        isLoading = true;

        if (!arePreChecksValid) {
            await checkURL();
        } else {
            await createRepository();
        }

        isLoading = false;
    }

    async function checkURL() {
        const res = await fetch('/api/storages/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                url: repoUrl,
                password,
                env: envRecords,
                checkRepository: isExistingRepository,
            } as StoragesCheckRequest),
        });
        const data = await res.json() as StoragesCheckResponse;

        if (data.newLocalUrl) {
            repoUrl = data.newLocalUrl;
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

        if (!isExistingRepository && data.isLocalFolderEmptyEmpty === false) {
            error = 'Folder must be empty to initialize a new repository';
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
                url: repoUrl,
                password,
                env: envRecords,
            } as StoragesCheckRequest),
        });
        const data = await res.json();

        if (data.error) {
            error = data.error.message || data.error;
            return;
        }

        await saveRepositoryToDb();
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
                url: repoUrl,
                password,
                env: envRecords,
            } as StoragesCreateRequest),
        });

        if (!res.ok) {
            const data = await res.json();
            error = data.error || 'Failed to save repository';
            return;
        }

        await goto('/storages');
    }
</script>

<Head title="New storage backend"/>

<NewPageHeader icon={CloudUpload}>
    Add {isExistingRepository ? 'existing' : 'new'} storage backend
</NewPageHeader>


<ElementForm bind:error={error}
             onsubmit={handleFormSubmit}
             title="Add {isExistingRepository ? 'existing' : 'and initialize'} Restic repository">
    <InputContainer label="Repository">
        <div class="flex gap-2">
            <button class="flex-1 gap-2 px-4 py-2 flex flex-col items-center bg-base-300 justify-center rounded-lg cursor-pointer border-2 text-center"
                    class:border-primary={!isExistingRepository}
                    class:border-transparent={isExistingRepository}
                    onclick={() => (isExistingRepository = false)}
                    type="button">
                <PackageOpen size={24}/>
                New repository
            </button>
            <button class="flex-1 gap-2 px-4 py-2 flex flex-col items-center bg-base-300 justify-center rounded-lg cursor-pointer border-2 text-center"
                    class:border-primary={isExistingRepository}
                    class:border-transparent={!isExistingRepository}
                    onclick={() => (isExistingRepository = true)}
                    type="button">
                <ArchiveRestore size={24}/>
                Existing repository
            </button>
        </div>
    </InputContainer>

    <InputContainer for="repo-name" label="Name">
        <input bind:value={repoName} class="input w-full" id="repo-name" required>
    </InputContainer>

    <InputContainer for="repo-path" label="Repository URL">
        <input bind:value={repoUrl} class="input w-full" id="repo-path" placeholder="local:/data/repo-path" required>
    </InputContainer>

    <InputContainer for="repo-password" label="Repository password">
        <input bind:value={password} class="input w-full" id="repo-password" required type="password">
    </InputContainer>

    <EnvVarInput bind:envVars/>

    <button class="btn btn-primary" disabled={arePreChecksValid || isLoading} type="submit">
        {isExistingRepository ? 'Check and save' : 'Check URL'}
    </button>

    {#if arePreChecksValid}
        <button class="btn btn-primary" type="submit" disabled={isLoading}>
            Create repository and save
        </button>
    {/if}
</ElementForm>
