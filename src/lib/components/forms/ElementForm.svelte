<script lang="ts">
    import { OctagonAlert } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        title: string;
        error?: string | null;
        onsubmit?: () => Promise<void | string>;
    }

    let { children, title, error = $bindable(), onsubmit }: Props = $props();

    async function handleFormSubmit(ev: SubmitEvent) {
        ev.preventDefault();
        error = null;
        error = await onsubmit?.() ?? error;
    }
</script>


<form class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto"
      onsubmit={handleFormSubmit}>
    <h2 class="font-bold text-lg">
        {title}
    </h2>

    {#if error}
        <div role="alert" class="alert alert-error alert-soft">
            <OctagonAlert class="w-4 h-4"/>
            <span class="whitespace-break-spaces">{error}</span>
        </div>
    {/if}

    {@render children()}
</form>
