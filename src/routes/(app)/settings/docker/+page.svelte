<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Blocks, OctagonAlert } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { settingsChangeRequest } from '$lib/server/schemas/api';
    import type { Settings } from '$lib/server/settings/settings';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();

    let dockerURI = $state(data.settings.dockerURI ?? '');
    let dockerIntegrationEnabled = $state(data.settings.dockerURI !== null);

    let loading = $state(false);
    let error = $state<string | null>(null);

    async function handleSave(ev: Event) {
        ev.preventDefault();

        if (loading) return;

        loading = true;
        error = null;

        const res = await fetchApi<Settings, typeof settingsChangeRequest>(
            'PATCH',
            '/api/settings',
            { dockerURI: dockerIntegrationEnabled ? dockerURI : null },
        );

        if (res.isErr()) {
            loading = false;
            error = res.error;
            return;
        }

        await invalidateAll();
        loading = false;
    }
</script>

<Head title="Settings - Docker integration"/>

<PageContentHeader buttonText="Back to settings" buttonType="back" icon={Blocks}>
    Settings - Docker integration
</PageContentHeader>


<form class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto" onsubmit={handleSave}>
    <h2 class="font-bold text-lg">
        Docker integration settings
    </h2>

    {#if error}
        <div role="alert" class="alert alert-error alert-soft">
            <OctagonAlert class="w-4 h-4"/>
            <span class="whitespace-break-spaces">{error}</span>
        </div>
    {/if}

    <InputContainer for="docker-integration" label="Docker integration">
        <label class="label">
            <input bind:checked={dockerIntegrationEnabled}
                   class="toggle toggle-primary"
                   id="docker-integration"
                   type="checkbox"/>
            Enable Docker integration
        </label>
    </InputContainer>

    <InputContainer for="docker-host" label="Docker host">
        <input bind:value={dockerURI}
               class="input w-full"
               disabled={!dockerIntegrationEnabled}
               id="docker-host"
               placeholder="e.g. unix:///var/run/docker.sock or tcp://localhost:2375"
               required={dockerIntegrationEnabled}
               type="text"/>
    </InputContainer>

    <button class="btn btn-primary" disabled={loading} type="submit">
        {#if dockerIntegrationEnabled}
            Validate & Save
        {:else}
            Save
        {/if}
    </button>
</form>
