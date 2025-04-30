<script lang="ts">
    import { page } from '$app/state';
</script>

<div class="flex w-full flex-1 items-center justify-center p-4">
    <div class="w-full max-w-md p-4 bg-base-100 rounded-box">
        <h1 class="text-2xl font-bold">Oops!</h1>

        <p class="mt-4 text-lg">Something went wrong.</p>

        {#if page.error}
            <p class="mt-2 opacity-50 grayscale">Error: {page.error.message}</p>
        {/if}
    </div>
</div>
