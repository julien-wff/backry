<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        label?: string;
        for?: string;
        subtitle?: string;
    }

    let { children, label, for: labelFor, subtitle }: Props = $props();
</script>


<div class="flex flex-col gap-1">
    {#if label}
        <label for={labelFor}>{label}</label>
    {/if}

    <div class="flex flex-col">
        {@render children()}
        {#if subtitle}
            <p class="text-sm text-base-content/50">{subtitle}</p>
        {/if}
    </div>
</div>
