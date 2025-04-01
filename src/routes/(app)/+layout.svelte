<script lang="ts">
    import Navbar from '$lib/components/navbar/Navbar.svelte';

    let { children } = $props();
</script>

<div class="flex min-h-screen bg-base-300">
    <Navbar/>

    <main class="flex flex-1 p-4">
        <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
            {@render children()}
        </div>
    </main>
</div>
