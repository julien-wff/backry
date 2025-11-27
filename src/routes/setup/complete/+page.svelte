<script lang="ts">
    import { goto } from '$app/navigation';
    import Head from '$lib/components/common/Head.svelte';
    import { OctagonAlert } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
    import { SetupApiStore } from '$lib/helpers/setup.svelte';

    const apiSetup = new SetupApiStore(() => goto('/dashboard'));

    function handleValidateAndNext() {
        apiSetup.updateSettingsAndGoToNextStep({
            setupComplete: true,
        });
    }
</script>


<Head title="Setup complete"/>

<OnboardingCard step={3} title="Complete">
    <p>
        Onboarding is now complete. If you want to change something, you can always go to the settings page later.
    </p>
    <p>Thank you for installing Backry, and happy backing up!</p>

    {#if apiSetup.error}
        <div class="alert alert-soft alert-error mb-2">
            <OctagonAlert class="inline w-6 h-6"/>
            <p>{apiSetup.error}</p>
        </div>
    {/if}

    <div class="card-actions justify-end">
        <button class="btn btn-primary" disabled={apiSetup.loading} onclick={handleValidateAndNext}>
            Finish
        </button>
    </div>
</OnboardingCard>
