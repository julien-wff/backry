<script lang="ts">
    import StatusIndicator from '$lib/components/common/StatusIndicator.svelte';
    import { type EXECUTION_STATUS, type ELEMENT_STATUS } from '$lib/db/schema';
    import CopyPlus from '@lucide/svelte/icons/copy-plus';
    import Pencil from '@lucide/svelte/icons/pencil';
    import PowerOff from '@lucide/svelte/icons/power-off';
    import Power from '@lucide/svelte/icons/power';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import Play from '@lucide/svelte/icons/play';
    import type { Snippet } from 'svelte';

    interface Props {
        status?: typeof ELEMENT_STATUS[number] | typeof EXECUTION_STATUS[number];
        title: string;
        children?: Snippet;
        editHref?: string;
        onduplicate?: () => void;
        onstatuschange?: () => void;
        ondelete?: () => void;
        onrun?: () => void;
        disabled?: boolean;
    }

    let { status, title, children, editHref, onduplicate, onstatuschange, ondelete, onrun, disabled }: Props = $props();
</script>

<div class="bg-base-100 p-2 flex flex-col gap-2 rounded-box shadow-base-100">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
            {#if status}
                <StatusIndicator {status}/>
            {/if}
            {title}
        </div>

        <div class="flex gap-2">
            {#if editHref}
                <a href={editHref} class="btn btn-sm btn-primary">
                    <Pencil class="w-4 h-4"/>
                    Edit
                </a>
            {/if}
            {#if onduplicate}
                <button {disabled} class="btn btn-soft btn-sm btn-primary" onclick={onduplicate}>
                    <CopyPlus class="w-4 h-4"/>
                    Duplicate and edit
                </button>
            {/if}
            {#if onstatuschange && (status === 'active' || status === 'inactive')}
                <button {disabled} class="btn btn-sm btn-warning" onclick={onstatuschange}>
                    {#if status === 'active'}
                        <PowerOff class="w-4 h-4"/>
                        Disable
                    {:else}
                        <Power class="w-4 h-4"/>
                        Enable
                    {/if}
                </button>
            {/if}
            {#if ondelete}
                <button {disabled} class="btn btn-soft btn-sm btn-error" onclick={ondelete}>
                    <Trash2 class="w-4 h-4"/>
                    Delete
                </button>
            {/if}
            {#if onrun}
                <button {disabled} class="btn btn-sm btn-success" onclick={onrun}>
                    <Play class="w-4 h-4"/>
                    Run now
                </button>
            {/if}
        </div>
    </div>

    {#if children}
        <div class="flex gap-4 opacity-75 text-sm filter grayscale">
            {@render children()}
        </div>
    {/if}
</div>
