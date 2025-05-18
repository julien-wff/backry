<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Database } from '$lib/components/icons';
    import type { DATABASE_ENGINES } from '$lib/db/schema';
    import { ENGINE_META_ENTRIES, ENGINES_META } from '$lib/engines/enginesMeta';
    import { type databaseRequest, type DatabaseResponse, type databasesCheckRequest } from '$lib/schemas/api';
    import { fetchApi } from '$lib/utils/api';
    import { slugify } from '$lib/utils/format';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const { searchParams } = page.url;
    let error = $state<null | string>(null);

    const urlEngine = (searchParams.has('engine') && Object.keys(ENGINES_META).includes(searchParams.get('engine')!)
        ? page.url.searchParams.get('engine')
        : null) as typeof DATABASE_ENGINES[number] | null;
    let selectedEngine = $state<typeof DATABASE_ENGINES[number] | null>(data.database?.engine ?? urlEngine ?? null);

    let dbName = $state(data.database?.name ?? searchParams.get('name') ?? '');
    let oldDbName = $state('');
    let slug = $state(data.database?.slug ?? '');
    $effect(() => updateSlug(dbName));

    let connectionString = $state(data.database?.connectionString ?? searchParams.get('connectionString') ?? '');
    let connectionStringPlaceholder = $derived(
        (selectedEngine && ENGINES_META[selectedEngine].connectionStringPlaceholder) || '',
    );

    function updateSlug(_: string) {
        if (slugify(oldDbName) === slug) {
            slug = slugify(dbName);
        }
        oldDbName = dbName;
    }

    let isConnectionTesting = $state(false);
    let databaseConnectionStatus = $state<boolean | null>(null);
    let isFormSubmitting = $state(false);

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
            databaseConnectionStatus = false;
        } else {
            error = null;
            databaseConnectionStatus = true;
        }
    }

    async function handleFormSubmit() {
        if (!selectedEngine) {
            return 'Please select a database engine';
        }
        isFormSubmitting = true;

        const res = await fetchApi<DatabaseResponse, typeof databaseRequest>(
            data.database ? 'PUT' : 'POST',
            data.database ? `/api/databases/${data.database.id}` : '/api/databases',
            {
                name: dbName,
                slug,
                engine: selectedEngine,
                connectionString,
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
            {#each ENGINE_META_ENTRIES as [engineId, engine] (engineId)}
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

    <InputContainer for="slug" label="Slug">
        <input bind:value={slug} class="input w-full" id="slug" minlength="2" name="slug" pattern="^[a-z0-9\-]+$"
               required>
    </InputContainer>

    <InputContainer for="connection-string" label="Connection string">
        <input bind:value={connectionString}
               class="input w-full"
               id="connection-string"
               minlength="2"
               name="connectionString"
               placeholder={connectionStringPlaceholder}
               required>
    </InputContainer>

    <div class="flex gap-2">
        <button class="btn flex-1"
                class:btn-error={databaseConnectionStatus === false}
                class:btn-info={databaseConnectionStatus === null}
                class:btn-success={databaseConnectionStatus === true}
                disabled={isConnectionTesting}
                onclick={testDbConnection}
                type="button">
            Test connection
            {#if databaseConnectionStatus === false}
                (fail)
            {:else if databaseConnectionStatus === true}
                (success)
            {/if}
        </button>

        <button class="btn btn-primary flex-1" disabled={!databaseConnectionStatus || isFormSubmitting} type="submit">
            Save
        </button>
    </div>
</ElementForm>
