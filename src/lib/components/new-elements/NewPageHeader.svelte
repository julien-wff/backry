<script lang="ts">
    import type { Icon as IconType } from '@lucide/svelte';
    import ChevronLeft from '@lucide/svelte/icons/chevron-left';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        icon: typeof IconType;
        backText?: string;
        currentStep?: number;
        totalSteps?: number;
    }

    let { children, icon: Icon, backText, currentStep, totalSteps }: Props = $props();
</script>


<div class="flex flex-col gap-2">
    <div class="w-full flex items-center justify-between">
        <h2 class="text-2xl font-bold flex items-center gap-2">
            <Icon class="w-6 h-6 text-primary"/>
            {@render children()}
        </h2>
        <button class="btn btn-primary btn-soft" onclick={() => window.history.back()}>
            <ChevronLeft class="w-4 h-4"/>
            {backText ?? 'Back to list'}
        </button>
    </div>

    {#if (currentStep ?? -1) >= 0 && totalSteps}
        <div class="flex gap-1 w-full h-2 rounded-full overflow-hidden">
            {#each Array(totalSteps) as _, i}
                <div class="flex-1 bg-base-200" class:bg-primary={i < (currentStep ?? 0)}></div>
            {/each}
        </div>
    {/if}
</div>
