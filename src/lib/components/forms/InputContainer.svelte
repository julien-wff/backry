<script lang="ts">
    import { CircleHelp, Hammer } from '$lib/components/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        label?: string;
        for?: string;
        subtitle?: string;
        helpContent?: Snippet;
        editorContent?: Snippet<[ { opened: boolean } ]>;
    }

    let { children, label, for: labelFor, subtitle, helpContent, editorContent }: Props = $props();

    let helpModal = $state<HTMLDialogElement | undefined>();
    let editorModal = $state<HTMLDialogElement | undefined>();

    let editorModalOpened = $state(false);

    function showEditorModal() {
        editorModal?.showModal();
        editorModalOpened = true;
    }
</script>


<div class="flex flex-col gap-1">
    {#if label}
        <div class="flex items-center gap-2">
            <label for={labelFor} class="flex-1">{label}</label>

            {#if editorContent}
                <button class="btn btn-xs btn-secondary btn-soft"
                        type="button"
                        onclick={showEditorModal}>
                    <Hammer size="16"/>
                    Open in editor
                </button>
            {/if}

            {#if helpContent}
                <button class="cursor-pointer rounded-full p-1 hover:bg-base-content/10"
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
            <h3 class="mb-4 text-lg font-bold">{label}</h3>

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


{#if editorContent}
    <dialog class="modal" bind:this={editorModal} onclose={() => (editorModalOpened = false)}>
        <div class="modal-box">
            <h3 class="mb-4 text-lg font-bold">{label} editor</h3>

            {@render editorContent({ opened: editorModalOpened })}

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
