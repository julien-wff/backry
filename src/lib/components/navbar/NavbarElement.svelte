<script lang="ts">
    import { page } from '$app/state';
    import type { Icon as IconType } from '@lucide/svelte';

    interface Props {
        icon: typeof IconType;
        label: string;
        href: string;
    }

    const { icon: Icon, label, href }: Props = $props();
</script>

<a class="flex flex-col items-center gap-2 p-2 hover:bg-base-300 rounded-box"
   class:bg-base-300={page.url.pathname.startsWith(href)}
   {href}>
    <Icon size={24}/>
    <span class="text-sm">{label}</span>
</a>
