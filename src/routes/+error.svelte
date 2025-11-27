<script lang="ts">
    import { page } from '$app/state';
    import Head from '$lib/components/common/Head.svelte';
</script>

<Head title={page.error?.message}/>

<div class="flex w-full min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md p-4 bg-base-100 rounded-box">
        <h1 class="text-2xl font-bold">Oops!</h1>

        <p class="mt-4 text-lg">
            Something went wrong. Sorry for the inconvenience.
        </p>

        {#if page.error}
            <p class="mt-2 text-base-content/75 grayscale">Error: {page.error.message}</p>
        {/if}
    </div>
</div>
