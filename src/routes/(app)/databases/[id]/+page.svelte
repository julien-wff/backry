<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/state';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Database, OctagonAlert } from '$lib/components/icons';
    import type { DATABASE_ENGINES } from '$lib/db/schema';
    import { ENGINE_META_ENTRIES, ENGINES_META } from '$lib/engines/enginesMeta';
    import type { DatabasesCheckRequest, DatabasesCheckResponse } from '$lib/types/api';
    import { customEnhance } from '$lib/utils/actions.js';
    import { slugify } from '$lib/utils/format';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const { searchParams } = page.url;
    let error = $state<{ current: null | string }>({ current: null });

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

    async function testDbConnection() {
        if (!selectedEngine) {
            error.current = 'Please select a database engine';
            return;
        }

        error.current = null;
        isConnectionTesting = true;

        const res = await fetch('/api/databases/check', {
            method: 'POST',
            body: JSON.stringify({
                engine: selectedEngine,
                url: connectionString,
            } satisfies DatabasesCheckRequest),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        isConnectionTesting = false;

        if (res.ok) {
            const { error: responseError }: DatabasesCheckResponse = await res.json();
            if (responseError) {
                error.current = responseError;
                databaseConnectionStatus = false;
            } else {
                error.current = null;
                databaseConnectionStatus = true;
            }
        } else {
            error.current = 'Failed to test connection';
        }
    }
</script>

<Head title="{data.database ? `Edit ${data.database.name}` : 'Add'} database"/>

<PageContentHeader buttonType="back" icon={Database}>
    {data.database ? 'Edit' : 'Add'} database
</PageContentHeader>

<form class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto"
      method="POST"
      use:customEnhance={{ enhance, error }}>

    <h2 class="font-bold text-lg">
        {data.database ? 'Edit' : 'Add new'} database connection
    </h2>

    {#if error.current}
        <div role="alert" class="alert alert-error alert-soft">
            <OctagonAlert class="w-4 h-4"/>
            <span class="whitespace-break-spaces">{error.current}</span>
        </div>
    {/if}

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

        <button class="btn btn-primary flex-1" disabled={!databaseConnectionStatus} type="submit">
            Save
        </button>
    </div>
</form>
