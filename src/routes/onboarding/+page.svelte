<script lang="ts">
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
</script>

<svelte:head>
    <title>Welcome to Backry!</title>
</svelte:head>

<OnboardingCard step={0} title="Welcome to Backry!">
    <div>
        <p>Thank you for installing Backry!</p>
        <p>First, let's configure a few things before starting.</p>
    </div>

    <div class="card-actions justify-end">
        <a class="btn btn-primary" href="/onboarding/authentication">
            Next
        </a>
    </div>
</OnboardingCard>
