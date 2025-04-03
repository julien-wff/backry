<script lang="ts">
    import { page } from '$app/state';
    import type { Icon as IconType } from '@lucide/svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        icon: typeof IconType;
        href: string;
    }

    let { children, icon: Icon, href }: Props = $props();
</script>


<a class="flex flex-col gap-4 items-center justify-center w-64 p-4 bg-base-100 rounded-box hover:scale-105 transition-all duration-200 ease-in-out"
   href="{page.url.pathname}/{href}">
    <Icon class="w-12 h-12 text-primary"/>
    <h2 class="text-xl text-center font-bold flex items-center gap-2">
        {@render children()}
    </h2>
</a>
