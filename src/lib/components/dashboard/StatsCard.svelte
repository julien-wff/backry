<script lang="ts">
    import { type IconType } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        title: string;
        icon: typeof IconType;
        href: string;
        children: Snippet;
        stat: string | number;
    }

    let { title, icon: Icon, href, children, stat }: Props = $props();
</script>


<a class="w-full bg-base-100 rounded-box p-4" {href}>
    <div class="flex items-center gap-2">
        <Icon size={24}/>
        <h3 class="text-lg font-bold">
            {title}
        </h3>
    </div>

    <div class="mt-4">
        <span class="text-2xl font-bold">
            {stat}
        </span>
        <span class="text-sm">
            {@render children()}
        </span>
    </div>
</a>
