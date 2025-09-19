<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        name: string;
        icon: string;
    }

    let { children, name, icon }: Props = $props();
</script>

<div class="flex flex-col gap-2">
    <h3 class="flex items-center gap-1 font-bold w-full border-b border-base-300">
        <img alt="{name} icon" class="w-4 h-4" src={icon}/>
        {name}
    </h3>
    {@render children()}
</div>
