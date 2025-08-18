<script lang="ts">
    import Modal from '$lib/components/common/Modal.svelte';
    import { CircleHelp, Hammer } from '$lib/components/icons';
    import type { Snippet } from 'svelte';
    import type { ModalControls } from '$lib/helpers/modal';

    interface Props {
        children: Snippet;
        label?: string;
        for?: string;
        subtitle?: string;
        helpContent?: Snippet;
        editorContent?: Snippet<[ { opened: boolean } ]>;
        editorTitle?: string;
        editorModalWidth?: 'normal' | 'large';
    }

    let {
        children,
        label,
        for: labelFor,
        subtitle,
        helpContent,
        editorContent,
        editorTitle,
        editorModalWidth,
    }: Props = $props();

    let helpModalControls = $state<ModalControls>();
    let editorModalControls = $state<ModalControls>();

    let editorModalOpened = $state(false);

    function showEditorModal() {
        editorModalControls?.open();
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
                        onclick={() => helpModalControls?.open()}>
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
    <Modal bind:controls={helpModalControls} title={label}>
        {@render helpContent()}

        <div class="modal-action">
            <form method="dialog">
                <button class="btn btn-primary">Close</button>
            </form>
        </div>
    </Modal>
{/if}


{#if editorContent}
    <Modal bind:controls={editorModalControls}
           onclose={() => (editorModalOpened = false)}
           title={editorTitle ?? `${label} editor`}
           width={editorModalWidth}>
        {@render editorContent({ opened: editorModalOpened })}

        <div class="modal-action">
            <form method="dialog">
                <button class="btn btn-primary">Close</button>
            </form>
        </div>
    </Modal>
{/if}
