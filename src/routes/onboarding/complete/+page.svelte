<script lang="ts">
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
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
        <a class="btn btn-primary" href="/dashboard">
            Finish
        </a>
    </div>
</OnboardingCard>
