<script lang="ts">
    import ConfirmDeleteModal from '$lib/components/common/ConfirmDeleteModal.svelte';
    import StatusIndicator from '$lib/components/common/StatusIndicator.svelte';
    import { CopyPlus, EllipsisVertical, Pencil, Play, Power, PowerOff, Trash2 } from '$lib/components/icons';
    import { type ELEMENT_STATUS, type EXECUTION_STATUS } from '$lib/db/schema';
    import type { Snippet } from 'svelte';

    interface Props {
        status?: typeof ELEMENT_STATUS[number] | typeof EXECUTION_STATUS[number];
        title: string;
        deleteConfirmationMessage?: string;
        children?: Snippet;
        editHref?: string;
        onduplicate?: () => void;
        onstatuschange?: () => void;
        ondelete?: () => void;
        onrun?: () => void;
        disabled?: boolean;
        error?: string | null;
        secondaryBtns?: Snippet;
    }

    let {
        status,
        title,
        deleteConfirmationMessage,
        children,
        editHref,
        onduplicate,
        onstatuschange,
        ondelete,
        onrun,
        disabled,
        error,
        secondaryBtns,
    }: Props = $props();

    let deleteDialog = $state<HTMLDialogElement>();

    function handleDelete(ev: MouseEvent) {
        if (ev.shiftKey) {
            ondelete?.();
        } else {
            deleteDialog?.showModal();
        }
    }
</script>

<div class="bg-base-100 p-2 flex flex-col gap-2 rounded-box shadow-base-100">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            {#if status}
                {#if error}
                    <div class="tooltip tooltip-error flex" data-tip={error}>
                        <StatusIndicator {status}/>
                    </div>
                {:else}
                    <StatusIndicator {status}/>
                {/if}
            {/if}
            {title}
        </div>

        <div class="flex gap-2">
            {#if editHref}
                <a href={disabled ? null : editHref}>
                    <button {disabled} class="btn btn-sm btn-primary">
                        <Pencil class="w-4 h-4"/>
                        Edit
                    </button>
                </a>
            {/if}

            {#if onstatuschange}
                <button {disabled} class="btn btn-sm btn-warning" onclick={onstatuschange}>
                    {#if status === 'inactive'}
                        <Power class="w-4 h-4"/>
                        Enable
                    {:else}
                        <PowerOff class="w-4 h-4"/>
                        Disable
                    {/if}
                </button>
            {/if}

            {#if onrun}
                <button {disabled} class="btn btn-sm btn-success" onclick={onrun}>
                    <Play class="w-4 h-4"/>
                    Run now
                </button>
            {/if}

            {#if onduplicate || ondelete || secondaryBtns}
                <div class="dropdown dropdown-end">
                    <div class="btn btn-square btn-sm btn-soft" role="button" tabindex="0">
                        <EllipsisVertical class="w-4 h-4"/>
                    </div>
                    <div class="menu dropdown-content gap-2 bg-base-200 rounded-box z-1 w-48 p-2 shadow-sm">
                        {#if onduplicate}
                            <button {disabled} class="btn btn-soft btn-sm btn-primary" onclick={onduplicate}>
                                <CopyPlus class="w-4 h-4"/>
                                Duplicate and edit
                            </button>
                        {/if}
                        {#if ondelete}
                            <button {disabled} class="btn btn-soft btn-sm btn-error" onclick={handleDelete}>
                                <Trash2 class="w-4 h-4"/>
                                Delete
                            </button>
                        {/if}
                        {@render secondaryBtns?.()}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    {#if children}
        <div class="flex gap-4 opacity-75 text-sm filter grayscale">
            {@render children()}
        </div>
    {/if}
</div>


<ConfirmDeleteModal bind:dialog={deleteDialog} {deleteConfirmationMessage} {ondelete}/>
