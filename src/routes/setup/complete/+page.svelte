<script lang="ts">
    import { goto } from '$app/navigation';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
    import { SetupApiStore } from '$lib/helpers/setup.svelte';

    const apiSetup = new SetupApiStore(() => {
        goto('/dashboard');
    });

    function handleValidateAndNext() {
        apiSetup.updateSettingsAndGoToNextStep({
            setupComplete: true,
        });
    }
</script>

<svelte:head>
    <title>Backry's onboarding complete</title>
</svelte:head>

<OnboardingCard step={3} title="Complete">
    <p>
        Onboarding is now complete. If you want to change something, you can always go to the settings page later.
    </p>
    <p>Thank you for installing Backry, and happy backing up!</p>

    <div class="card-actions justify-end">
        <button class="btn btn-primary" disabled={apiSetup.loading} onclick={handleValidateAndNext}>
            Finish
        </button>
    </div>
</OnboardingCard>
