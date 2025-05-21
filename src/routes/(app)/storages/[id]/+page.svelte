<script lang="ts">
    import { goto } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import EnvVarInput from '$lib/components/forms/EnvVarInput.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ArchiveRestore, CloudUpload, PackageOpen } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import {
        type storageInitRepositoryRequest,
        type storageRequest,
        type StorageResponse,
        type storagesCheckRequest,
        type StoragesCheckResponse,
        type StoragesInitRepositoryResponse,
    } from '$lib/server/schemas/api';
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
            await initRepository();
        }

        isLoading = false;
    }

    async function checkURL() {
        const res = await fetchApi<StoragesCheckResponse, typeof storagesCheckRequest>('POST', '/api/storages/check', {
            url: repoUrl,
            password,
            env: envRecords,
            checkRepository: isExistingRepository,
        });

        if (res.isErr()) {
            error = res.error;
            return;
        }

        if (res.value.newLocalUrl) {
            repoUrl = res.value.newLocalUrl;
        }

        if (res.value.error !== null) {
            error = res.value.error;
            return;
        }

        if (isExistingRepository) {
            if (res.value.resticError) {
                error = res.value.resticError.message;
            } else {
                await saveStorageAndRedirect();
            }
            return;
        }

        if (!isExistingRepository && res.value.isLocalFolderEmptyEmpty === false) {
            error = 'Folder must be empty to initialize a new repository';
            return;
        }

        arePreChecksValid = true;
    }

    async function initRepository() {
        const res = await fetchApi<StoragesInitRepositoryResponse, typeof storageInitRepositoryRequest>(
            'POST',
            '/api/storages/init-repository',
            {
                url: repoUrl,
                password,
                env: envRecords,
            },
        );

        if (res.isErr()) {
            error = res.error;
            return;
        }

        await saveStorageAndRedirect();
    }

    async function saveStorageAndRedirect() {
        const res = await fetchApi<StorageResponse, typeof storageRequest>(
            data.storage ? 'PUT' : 'POST',
            data.storage ? `/api/storages/${data.storage.id}` : '/api/storages',
            {
                name: repoName,
                url: repoUrl,
                password,
                env: envRecords,
            },
        );

        if (res.isErr()) {
            error = res.error;
            return;
        }

        await goto('/storages');
    }
</script>

<Head title="{data.storage ? `Edit ${data.storage.name}` : 'New'} storage backend"/>

<PageContentHeader buttonType="back" icon={CloudUpload}>
    {data.storage ? 'Edit' : 'Add'} {isExistingRepository ? 'existing' : 'new'} storage backend
</PageContentHeader>


<ElementForm bind:error={error}
             onsubmit={handleFormSubmit}
             title="{data.storage ? 'Edit' : 'Add'} {isExistingRepository ? 'existing' : 'and initialize'} Restic repository">
    {#if !data.storage}
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
    {/if}

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
