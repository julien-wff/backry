<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        gridClass: string;
    }

    let { children, gridClass }: Props = $props();
</script>

<div class="flex-1 grid place-content-center h-max">
    <div class="grid {gridClass} items-stretch gap-4">
        {@render children()}
    </div>
</div>

