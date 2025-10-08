<script lang="ts">
    import { OctagonAlert } from '$lib/components/icons';
    import OnboardingCard from '$lib/components/onboarding/OnboardingCard.svelte';
</script>

<svelte:head>
    <title>Authentication - Backry's onboarding</title>
</svelte:head>

<OnboardingCard step={1} title="Authentication">
    <div class="alert alert-soft alert-warning mb-2">
        <OctagonAlert class="inline w-6 h-6"/>
        <div>
            Authentication is not yet implemented. Please make sure your Backry instance is secured and not publicly
            accessible.
        </div>
    </div>

    <div class="card-actions justify-end">
        <a class="btn btn-primary" href="/onboarding/docker">
            Next
        </a>
    </div>
</OnboardingCard>
