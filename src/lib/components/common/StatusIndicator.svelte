<script lang="ts">
    import type { ELEMENT_STATUS } from '$lib/db/schema';
    import CheckCircle from '@lucide/svelte/icons/check-circle';
    import CircleX from '@lucide/svelte/icons/circle-x';
    import OctogonAlert from '@lucide/svelte/icons/octagon-alert';

    interface Props {
        status: typeof ELEMENT_STATUS[number];
    }

    let { status }: Props = $props();
</script>


<div class="badge badge-sm"
     class:badge-error={status === 'error'}
     class:badge-neutral={status === 'inactive'}
     class:badge-success={status === 'active'}>
    {#if status === 'active'}
        <CheckCircle class="w-4 h-4"/>
        Active
    {:else if status === 'inactive'}
        <CircleX class="w-4 h-4"/>
        Inactive
    {:else if status === 'error'}
        <OctogonAlert class="w-4 h-4"/>
        Error
    {/if}
</div>
