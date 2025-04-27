<script lang="ts">
    import { enhance } from '$app/forms';
    import Head from '$lib/components/common/Head.svelte';
    import type { DatabasesCheckRequest, DatabasesCheckResponse } from '$lib/types/api';
    import { customEnhance } from '$lib/utils/actions.js';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import { slugify } from '$lib/utils/format';
    import Database from '@lucide/svelte/icons/database';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    let error = $state<{ current: null | string }>({ current: null });

    let dbName = $state('');
    let oldDbName = $state('');
    let slug = $state('');
    $effect(() => updateSlug(dbName));

    let connectionString = $state('');

    function updateSlug(_: string) {
        if (slugify(oldDbName) === slug) {
            slug = slugify(dbName);
        }
        oldDbName = dbName;
    }

    let isConnectionTesting = $state(false);
    let databaseConnectionStatus = $state<boolean | null>(null);

    async function testDbConnection() {
        error.current = null;
        isConnectionTesting = true;

        const res = await fetch('/api/databases/check', {
            method: 'POST',
            body: JSON.stringify({
                engine: data.engine,
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

<Head title="Add database - {data.engineName}"/>

<NewPageHeader backText="Back to engines" currentStep={2} icon={Database} totalSteps={2}>
    Add database - {data.engineName}
</NewPageHeader>

<form class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto"
      method="POST"
      use:customEnhance={{ enhance, error }}>

    <h2 class="font-bold text-lg">
        Add new database connection
    </h2>

    {#if error.current}
        <p class="text-error whitespace-break-spaces">{error.current}</p>
    {/if}

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
               placeholder={data.connectionStringPlaceholder}
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
