<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import { OctagonAlert } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
    import { SetupApiStore } from '$lib/helpers/setup.svelte';

    const apiSetup = new SetupApiStore('docker');

    function handleValidateAndNext() {
        apiSetup.updateSettingsAndGoToNextStep();
    }
</script>


<Head title="Authentication setup"/>

<OnboardingCard step={1} title="Authentication">
    <div class="alert alert-soft alert-warning mb-2">
        <OctagonAlert class="inline w-6 h-6"/>
        <div>
            Authentication is not yet implemented. Please make sure your Backry instance is secured and not publicly
            accessible.
        </div>
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
