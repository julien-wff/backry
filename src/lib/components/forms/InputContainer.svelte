<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        label?: string;
        for?: string;
    }

    let { children, label, for: labelFor }: Props = $props();
</script>


<div class="flex flex-col gap-1">
    {#if label}
        <label for={labelFor}>{label}</label>
    {/if}

    {@render children()}
</div>
