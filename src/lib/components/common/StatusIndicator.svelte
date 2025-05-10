<script lang="ts">
    import { CheckCircle, CirclePlay, CircleX, OctagonAlert } from '$lib/components/icons';
    import { type BACKUP_STATUS, type ELEMENT_STATUS } from '$lib/db/schema';

    interface Props {
        status: typeof ELEMENT_STATUS[number] | typeof BACKUP_STATUS[number];
    }

    let { status }: Props = $props();
</script>


<div class="badge badge-sm"
     class:badge-error={status === 'error'}
     class:badge-info={status === 'running'}
     class:badge-neutral={status === 'inactive'}
     class:badge-success={status === 'active' || status === 'success'}>
    {#if status === 'active'}
        <CheckCircle class="w-4 h-4"/>
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
        <CheckCircle class="w-4 h-4"/>
        Success
    {/if}
</div>
