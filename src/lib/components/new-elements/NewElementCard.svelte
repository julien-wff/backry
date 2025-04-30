<script lang="ts">
    import { page } from '$app/state';
    import { type IconType } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        icon: typeof IconType | string;
        href: string;
    }

    let { children, icon: Icon, href }: Props = $props();
</script>


<a class="flex flex-col gap-4 items-center justify-center w-64 p-4 bg-base-100 rounded-box hover:scale-105 transition-all duration-200 ease-in-out"
   href="{page.url.pathname}/{href}">

    {#if typeof Icon === 'string'}
        <img src={Icon} alt="Icon" class="w-12 h-12"/>
    {:else}
        <Icon class="w-12 h-12 text-primary"/>
    {/if}

    <h2 class="text-xl text-center font-bold flex items-center gap-2">
        {@render children()}
    </h2>
</a>
