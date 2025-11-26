<script lang="ts">
    import { OctagonAlert } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
    import { SetupApiStore } from '$lib/helpers/setup.svelte';

    const apiSetup = new SetupApiStore('authentication');

    function handleValidateAndNext() {
        apiSetup.updateSettingsAndGoToNextStep();
    }
</script>

<svelte:head>
    <title>Welcome to Backry!</title>
</svelte:head>

<OnboardingCard step={0} title="Welcome to Backry!">
    <div>
        <p>Thank you for installing Backry!</p>
        <p>First, let's configure a few things before starting.</p>
    </div>

    {#if apiSetup.error}
        <div class="alert alert-soft alert-error mb-2">
            <OctagonAlert class="inline w-6 h-6"/>
            <p>{apiSetup.error}</p>
        </div>
    {/if}

    <div class="card-actions justify-end">
        <button class="btn btn-primary" disabled={apiSetup.loading} onclick={handleValidateAndNext}>
            Next
        </button>
    </div>
</OnboardingCard>
