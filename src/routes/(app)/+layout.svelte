<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import Navbar from '$lib/components/navbar/Navbar.svelte';
    import { onMount } from 'svelte';
    import type { LayoutProps } from './$types';

    let { children, data }: LayoutProps = $props();

    // Revalidate the whole page data every minute
    // If a validation is skipped because the tab is in the background, it will revalidate when the tab is back in focus
    let reloadSkipped = $state(false);

    onMount(() => {
        const reloadInterval = setInterval(() => {
            if (!document.hidden) {
                invalidateAll();
            } else {
                reloadSkipped = true;
            }
        }, 1000 * 60);

        return () => clearInterval(reloadInterval);
    });

    function handleVisibilityChange() {
        if (!document.hidden && reloadSkipped) {
            reloadSkipped = false;
            invalidateAll();
        }
    }
</script>

<svelte:document onvisibilitychange={handleVisibilityChange}/>

<div class="flex min-h-screen bg-base-300">
    <Navbar errors={data.errors}/>

    <main class="flex flex-1 p-4">
        <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
            {@render children()}
        </div>
    </main>
</div>
