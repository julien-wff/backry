<script lang="ts">
    import { CircleCheck, CirclePlay, CircleX, OctagonAlert, Trash2 } from '$lib/components/icons';
    import { type BACKUP_STATUS, type ELEMENT_STATUS } from '$lib/server/db/schema';

    interface Props {
        status: typeof ELEMENT_STATUS[number] | typeof BACKUP_STATUS[number];
        tooltip?: string | null;
    }

    let { status, tooltip }: Props = $props();
</script>


<div class="tooltip grid place-items-center"
     class:tooltip-error={status === 'error'}
     class:tooltip-warning={status === 'pruned'}
     data-tip={tooltip}>
    <div class="badge badge-sm"
         class:badge-error={status === 'error'}
         class:badge-info={status === 'running'}
         class:badge-neutral={status === 'inactive'}
         class:badge-success={status === 'active' || status === 'success'}
         class:badge-warning={status === 'pruned'}>
        {#if status === 'active'}
            <CircleCheck class="w-4 h-4"/>
            Active
        {:else if status === 'inactive'}
            <CircleX class="w-4 h-4"/>
            Inactive
        {:else if status === 'error'}
            <OctagonAlert class="w-4 h-4"/>
            Error
        {:else if status === 'running'}
            <CirclePlay class="w-4 h-4"/>
            Running
        {:else if status === 'success'}
            <CircleCheck class="w-4 h-4"/>
            Success
        {:else if status === 'pruned'}
            <Trash2 class="w-4 h-4"/>
            Pruned
        {/if}
    </div>
</div>

