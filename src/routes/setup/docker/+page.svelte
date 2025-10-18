<script lang="ts">
    import { goto } from '$app/navigation';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Info, OctagonAlert } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { setupDockerSaveRequest } from '$lib/server/schemas/api';

    let dockerIntegration = $state(true);
    let dockerHost = $state('/var/run/docker.sock');

    let checking = $state(false);
    let error: string | null = $state(null);

    async function handleValidateAndNext() {
        if (checking) {
            return;
        }

        checking = true;
        error = null;

        const res = await fetchApi<object, typeof setupDockerSaveRequest>('POST', '/api/setup/docker-save', {
            uri: dockerIntegration ? dockerHost : null,
        });
        checking = false;

        if (res.isErr()) {
            error = res.error;
            return;
        }

        await goto('/setup/complete');
    }
</script>

<svelte:head>
    <title>Docker - Backry's onboarding</title>
</svelte:head>

<OnboardingCard step={2} title="Docker">
    <div class="alert alert-soft alert-info mb-2">
        <Info class="inline w-6 h-6"/>
        <p>
            Docker integration facilitates managing backups for containerized databases. It is optional and can be
            configured later in settings.
        </p>
    </div>

    {#if error}
        <div class="alert alert-soft alert-error mb-2">
            <OctagonAlert class="inline w-6 h-6"/>
            <p>{error}</p>
        </div>
    {/if}

    <InputContainer for="docker-integration" label="Docker integration">
        <label class="label">
            <input bind:checked={dockerIntegration}
                   class="toggle toggle-primary"
                   id="docker-integration"
                   type="checkbox"/>
            Enable Docker integration
        </label>
    </InputContainer>

    <InputContainer for="docker-host" label="Docker host">
        <input bind:value={dockerHost}
               class="input w-full"
               disabled={!dockerIntegration}
               id="docker-host"
               placeholder="e.g. unix:///var/run/docker.sock or tcp://localhost:2375"
               required
               type="text"/>
    </InputContainer>

    <div class="mt-2 card-actions justify-end">
        <button class="btn btn-primary" disabled={checking} onclick={handleValidateAndNext}>
            {#if dockerIntegration}
                Validate & Next
            {:else}
                Next
            {/if}
        </button>
    </div>
</OnboardingCard>
