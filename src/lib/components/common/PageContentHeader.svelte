<script lang="ts">
    import { page } from '$app/state';
    import { ChevronLeft, Funnel, type IconType, Plus } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        icon: typeof IconType;
        buttonType?: null | 'back' | 'new';
        buttonText?: string;
        secondaryButtonType?: null | 'filter';
        secondaryButtonText?: string;
        onsecondarybuttonclick?: () => void;
    }

    let {
        children,
        icon: Icon,
        buttonType = null,
        buttonText,
        secondaryButtonType = null,
        secondaryButtonText,
        onsecondarybuttonclick,
    }: Props = $props();
</script>

<div class="w-full flex items-center justify-between h-10">
    <h2 class="text-2xl font-bold flex items-center gap-2">
        <Icon class="w-6 h-6 text-primary"/>
        {@render children()}
    </h2>

    <div class="flex gap-4">
        {#if secondaryButtonType === 'filter'}
            <button class="btn btn-secondary btn-soft" onclick={onsecondarybuttonclick}>
                <Funnel class="w-4 h-4"/>
                <span class="text-sm">{secondaryButtonText ?? 'Filter'}</span>
            </button>
        {/if}

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
</div>
