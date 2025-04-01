<script lang="ts">
    import { page } from '$app/state';
    import type { Icon as IconType } from '@lucide/svelte';
    import Plus from '@lucide/svelte/icons/plus';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        icon: typeof IconType;
    }

    let { children, icon: Icon }: Props = $props();
</script>

<div class="w-full flex items-center justify-between">
    <h2 class="text-2xl font-bold flex items-center gap-2">
        <Icon class="w-6 h-6 text-primary"/>
        {@render children()}
    </h2>
    <a href="{page.url.pathname}/new">
        <button class="btn btn-primary">
            <Plus class="w-4 h-4"/>
            Add new
        </button>
    </a>
</div>
