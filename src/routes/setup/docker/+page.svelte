<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Info } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';

    let dockerIntegration = $state(true);
    let dockerHost = $state('/var/run/docker.sock');

    function handleValidateAndNext() {
        // TODO
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

    <InputContainer for="docker-integration" label="Docker integration">
        <label class="label">
            <input bind:checked={dockerIntegration}
                   class="toggle toggle-primary"
                   id="docker-integration"
                   onchange={handleDropInputToggle}
                   type="checkbox"/>
            Enable Docker integration
        </label>
    </InputContainer>

    <InputContainer for="docker-host" label="Docker host">
        <input bind:value={dockerHost}
               class="input w-full"
               disabled={!dockerIntegration}
               id="docker-host"
               onchange={handleDropInputToggle}
               placeholder="e.g. unix:///var/run/docker.sock or tcp://localhost:2375"
               type="text"/>
    </InputContainer>

    <div class="mt-2 card-actions justify-end">
        {#if dockerIntegration}
            <button class="btn btn-primary" onclick={handleValidateAndNext}>
                Validate & Next
            </button>
        {:else}
            <a class="btn btn-primary" href="/setup/complete">
                Next
            </a>
        {/if}
    </div>
</OnboardingCard>
