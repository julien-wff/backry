<script lang="ts">
    import { page } from '$app/state';
    import { ChevronLeft, type IconType, Plus } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        icon: typeof IconType;
        buttonType?: 'none' | 'back' | 'new';
        buttonText?: string;
    }

    let { children, icon: Icon, buttonType = 'none', buttonText }: Props = $props();
</script>

<div class="w-full flex items-center justify-between h-10">
    <h2 class="text-2xl font-bold flex items-center gap-2">
        <Icon class="w-6 h-6 text-primary"/>
        {@render children()}
    </h2>

    {#if buttonType === 'new'}
        <a href="{page.url.pathname}/new">
            <button class="btn btn-primary">
                <Plus class="w-4 h-4"/>
                {buttonText ?? 'Add new'}
            </button>
        </a>
    {:else if buttonType === 'back'}
        <button class="btn btn-primary btn-soft" onclick={() => window.history.back()}>
            <ChevronLeft class="w-4 h-4"/>
            {buttonText ?? 'Back to list'}
        </button>
    {/if}
</div>
