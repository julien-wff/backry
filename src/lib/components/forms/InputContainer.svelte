<script lang="ts">
    import { CircleHelp } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        label?: string;
        for?: string;
        subtitle?: string;
        helpContent?: Snippet;
    }

    let { children, label, for: labelFor, subtitle, helpContent }: Props = $props();

    let helpModal = $state<HTMLDialogElement | undefined>();
</script>


<div class="flex flex-col gap-1">
    {#if label}
        <div class="flex items-center gap-2">
            <label for={labelFor} class="flex-1">{label}</label>

            {#if helpContent}
                <button class="p-1 rounded-full hover:bg-base-content/10 cursor-pointer"
                        type="button"
                        onclick={() => helpModal?.showModal()}>
                    <CircleHelp size="16"/>
                </button>
            {/if}
        </div>
    {/if}

    <div class="flex flex-col">
        {@render children()}
        {#if subtitle}
            <p class="text-sm text-base-content/50">{subtitle}</p>
        {/if}
    </div>
</div>


{#if helpContent}
    <dialog class="modal" bind:this={helpModal}>
        <div class="modal-box">
            <h3 class="text-lg font-bold mb-4">{label}</h3>

            {@render helpContent()}

            <div class="modal-action">
                <form method="dialog">
                    <button class="btn btn-primary">Close</button>
                </form>
            </div>
        </div>

        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
{/if}
