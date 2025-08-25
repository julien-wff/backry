<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { ENGINE_META_ENTRIES, ENGINES_META } from '$lib/common/engines-meta';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import SlugInput from '$lib/components/forms/SlugInput.svelte';
    import { Database } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import { slugify } from '$lib/helpers/format';
    import type { DATABASE_ENGINES } from '$lib/server/db/schema';
    import type {
        DATABASE_ALLOWED_STATUSES,
        databaseRequest,
        DatabaseResponse,
        databasesCheckRequest,
    } from '$lib/server/schemas/api';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const { searchParams } = page.url;
    let error = $state<null | string>(data.database?.error ?? null);

    const urlEngine = (searchParams.has('engine') && Object.keys(ENGINES_META).includes(searchParams.get('engine')!)
        ? page.url.searchParams.get('engine')
        : null) as typeof DATABASE_ENGINES[number] | null;
    let selectedEngine = $state<typeof DATABASE_ENGINES[number] | null>(data.database?.engine ?? urlEngine ?? null);

    let dbName = $state(data.database?.name ?? searchParams.get('name') ?? '');
    // svelte-ignore state_referenced_locally We want to grab the initial value of dbName, it's ok
    let slug = $state(data.database?.slug ?? slugify(dbName));

    let connectionString = $state(data.database?.connectionString ?? searchParams.get('connectionString') ?? '');
    let connectionStringPlaceholder = $derived(
        (selectedEngine && ENGINES_META[selectedEngine].connectionStringPlaceholder) || '',
    );

    let containerName = $state(data.database?.containerName ?? searchParams.get('container') ?? '');

    let isConnectionTesting = $state(false);
    let databaseConnectionStatus = $state<'untested' | 'success' | 'error'>('untested');
    let isFormSubmitting = $state(false);

    // Reset connection status when the connection string changes
    $effect(() => {
        if (connectionString) {
            databaseConnectionStatus = 'untested';
        }
    });

    // Automatically select the engine based on the connection string if not already selected
    $effect(() => {
        if (!selectedEngine && connectionString) {
            const engine = ENGINE_META_ENTRIES.find(([ _, engineMeta ]) => engineMeta.isUrlFromEngine?.(connectionString))?.[0];

            if (engine) {
                selectedEngine = engine;
            }
        }
    });

    async function testDbConnection() {
        if (!selectedEngine) {
            error = 'Please select a database engine';
            return;
        }

        error = null;
        isConnectionTesting = true;

        const res = await fetchApi<{}, typeof databasesCheckRequest>(
            'POST',
            '/api/databases/check',
            {
                engine: selectedEngine,
                connectionString,
            },
        );

        isConnectionTesting = false;

        if (res.isErr()) {
            error = res.error;
            databaseConnectionStatus = 'error';
        } else {
            error = null;
            databaseConnectionStatus = 'success';
        }
    }

    async function handleFormSubmit() {
        if (!selectedEngine) {
            return 'Please select a database engine';
        }
        isFormSubmitting = true;

        // Undefined means leave it unchanged
        let databaseStatus: typeof DATABASE_ALLOWED_STATUSES[number] | undefined = undefined;
        let databaseError: string | null | undefined = undefined;
        if (databaseConnectionStatus === 'success') {
            databaseStatus = 'active';
            databaseError = null;
        } else if (databaseConnectionStatus === 'error') {
            databaseStatus = 'error';
            databaseError = error;
        }

        const res = await fetchApi<DatabaseResponse, typeof databaseRequest>(
            data.database ? 'PUT' : 'POST',
            data.database ? `/api/databases/${data.database.id}` : '/api/databases',
            {
                name: dbName,
                slug,
                engine: selectedEngine,
                connectionString,
                containerName: containerName || null,
                status: databaseStatus,
                error: databaseError,
            },
        );
        isFormSubmitting = false;

        if (res.isErr()) {
            return res.error;
        }

        await goto('/databases');
    }
</script>

<Head title="{data.database ? `Edit ${data.database.name}` : 'Add'} database"/>

<PageContentHeader buttonType="back" icon={Database}>
    {data.database ? 'Edit' : 'Add'} database
</PageContentHeader>

<ElementForm error={error}
             onsubmit={handleFormSubmit}
             title="{data.database ? 'Edit' : 'Add new'} database connection">
    <InputContainer label="Engine">
        <div class="flex gap-2">
            {#each ENGINE_META_ENTRIES as [ engineId, engine ] (engineId)}
                <div class="w-32 gap-2 px-4 py-2 flex flex-col items-center bg-base-300 justify-center rounded-lg cursor-pointer border-2"
                     class:border-primary={selectedEngine === engineId}
                     class:border-transparent={selectedEngine !== engineId}
                     role="button"
                     tabindex="0"
                     onclick={() => {
                         selectedEngine = engineId;
                     }}
                     onkeydown={(e) => {
                         if (e.key === 'Enter' || e.key === ' ') {
                             selectedEngine = engineId;
                         }
                     }}>
                    <img alt="{engine.displayName} logo" class="w-8 h-8" src={engine.icon}/>
                    {engine.displayName}
                </div>
            {/each}
        </div>

        <input name="engine" required type="hidden" value={selectedEngine}/>
    </InputContainer>

    <InputContainer for="db-name" label="Name">
        <input bind:value={dbName} class="input w-full" id="db-name" minlength="2" name="name" required>
    </InputContainer>

    <SlugInput baseValue={dbName} bind:slug disabled={!!data.database} source="database"/>

    <InputContainer for="connection-string" label="Connection string">
        <input bind:value={connectionString}
               class="input w-full"
               id="connection-string"
               minlength="2"
               name="connectionString"
               placeholder={connectionStringPlaceholder}
               required>
    </InputContainer>

    <InputContainer for="container-name" label="Docker container name (if any)">
        <input autocapitalize="off"
               bind:value={containerName}
               class="input w-full"
               id="container-name"
               name="containerName">
    </InputContainer>

    <div class="flex gap-2">
        <button class="btn flex-1"
                class:btn-error={databaseConnectionStatus === 'error'}
                class:btn-info={databaseConnectionStatus === 'untested'}
                class:btn-success={databaseConnectionStatus === 'success'}
                disabled={isConnectionTesting}
                onclick={testDbConnection}
                type="button">
            Test connection
            {#if databaseConnectionStatus === 'error'}
                (fail)
            {:else if databaseConnectionStatus === 'success'}
                (success)
            {/if}
        </button>

        <button class="btn btn-primary flex-1" disabled={isFormSubmitting} type="submit">
            Save {databaseConnectionStatus === 'error' ? 'anyway' : ''}
        </button>
    </div>
</ElementForm>
