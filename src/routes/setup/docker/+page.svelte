<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Info, OctagonAlert } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
    import { SetupApiStore } from '$lib/helpers/setup.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();

    let dockerIntegration = $state(true);
    let dockerHost = $state(data.dockerURI || '/var/run/docker.sock');

    const apiSetup = new SetupApiStore('complete');

    function handleValidateAndNext() {
        apiSetup.updateSettingsAndGoToNextStep({
            dockerURI: dockerIntegration ? dockerHost : undefined,
        });
    }
</script>


<Head title="Docker integration setup"/>

<OnboardingCard step={2} title="Docker">
    <div class="alert alert-soft alert-info mb-2">
        <Info class="inline w-6 h-6"/>
        <p>
            Docker integration facilitates managing backups for containerized databases. It is optional and can be
            configured later in settings.
        </p>
    </div>

    {#if apiSetup.error}
        <div class="alert alert-soft alert-error mb-2">
            <OctagonAlert class="inline w-6 h-6"/>
            <p>{apiSetup.error}</p>
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
        <button class="btn btn-primary" disabled={apiSetup.loading} onclick={handleValidateAndNext}>
            {#if dockerIntegration}
                Validate & Next
            {:else}
                Next
            {/if}
        </button>
    </div>
</OnboardingCard>
