<script lang="ts">
    import ConfirmDeleteModal from '$lib/components/common/ConfirmDeleteModal.svelte';
    import StatusIndicator from '$lib/components/common/StatusIndicator.svelte';
    import {
        CopyPlus,
        EllipsisVertical,
        HeartPulse,
        Pencil,
        Play,
        Power,
        PowerOff,
        Trash2,
    } from '$lib/components/icons';
    import { type BACKUP_STATUS, type ELEMENT_STATUS } from '$lib/server/db/schema';
    import type { Snippet } from 'svelte';
    import type { ModalControls } from '$lib/helpers/modal';

    interface Props {
        status?: typeof ELEMENT_STATUS[number] | typeof BACKUP_STATUS[number];
        statusTooltip?: string | null;
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
        healthBtnMessage?: string;
        healthBtnHref?: string;
        secondaryBtns?: Snippet;
    }

    let {
        status,
        statusTooltip,
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
        healthBtnMessage,
        healthBtnHref,
        secondaryBtns,
    }: Props = $props();

    let deleteModalControls = $state<ModalControls>();

    function handleDelete(ev: MouseEvent) {
        if (ev.shiftKey) {
            ondelete?.();
        } else {
            deleteModalControls?.open();
        }
    }
</script>

<div class="flex flex-col gap-2 p-2 bg-base-100 rounded-box shadow-base-100">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            {#if status}
                <StatusIndicator {status} tooltip={error ?? statusTooltip}/>
            {/if}
            {title}
        </div>

        <div class="flex gap-2">
            {#if editHref}
                <a href={disabled ? null : editHref}>
                    <button {disabled} class="btn btn-sm btn-primary">
                        <Pencil class="h-4 w-4"/>
                        Edit
                    </button>
                </a>
            {/if}

            {#if onstatuschange}
                <button {disabled} class="btn btn-sm btn-warning" onclick={onstatuschange}>
                    {#if status === 'inactive'}
                        <Power class="h-4 w-4"/>
                        Enable
                    {:else}
                        <PowerOff class="h-4 w-4"/>
                        Disable
                    {/if}
                </button>
            {/if}

            {#if onrun}
                <button {disabled} class="btn btn-sm btn-success" onclick={onrun}>
                    <Play class="h-4 w-4"/>
                    Run now
                </button>
            {/if}

            {#if healthBtnMessage && healthBtnHref}
                <a class="btn btn-success btn-sm" href={healthBtnHref}>
                    <HeartPulse class="w-4 h-4"/>
                    {healthBtnMessage}
                </a>
            {/if}

            {#if onduplicate || ondelete || secondaryBtns}
                <div class="dropdown dropdown-end">
                    <div class="btn btn-square btn-sm btn-soft" role="button" tabindex="0">
                        <EllipsisVertical class="h-4 w-4"/>
                    </div>
                    <div class="w-48 gap-2 p-2 shadow-sm menu dropdown-content bg-base-200 rounded-box z-1">
                        {#if onduplicate}
                            <button {disabled} class="btn btn-soft btn-sm btn-primary" onclick={onduplicate}>
                                <CopyPlus class="h-4 w-4"/>
                                Duplicate and edit
                            </button>
                        {/if}
                        {#if ondelete}
                            <button {disabled} class="btn btn-soft btn-sm btn-error" onclick={handleDelete}>
                                <Trash2 class="h-4 w-4"/>
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
        <div class="flex flex-nowrap gap-4 text-sm opacity-75 grayscale filter">
            {@render children()}
        </div>
    {/if}
</div>


<ConfirmDeleteModal bind:controls={deleteModalControls} {deleteConfirmationMessage} {ondelete}/>
