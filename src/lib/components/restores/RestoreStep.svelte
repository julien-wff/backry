<script lang="ts">
    import { RESTORE_STEPS } from '$lib/common/constants';
    import { CircleCheck, CircleDot, CircleX, LoaderCircle } from '$lib/components/icons';
    import { getRestoreStepStatus } from '$lib/helpers/restore';
    import type { restores } from '$lib/server/db/schema';

    interface Props {
        step: typeof RESTORE_STEPS[number];
        displayName: string;
        restore: typeof restores.$inferSelect;
    }

    let { step, displayName, restore }: Props = $props();

    const stepStatus = $derived(getRestoreStepStatus(restore, step));
</script>

<div class="flex items-center gap-2">
    {#if stepStatus === 'completed'}
        <CircleCheck class="h-4 w-4 text-success"/>
    {:else if stepStatus === 'error'}
        <CircleX class="h-4 w-4 text-error"/>
    {:else if stepStatus === 'in_progress'}
        <LoaderCircle class="h-4 w-4 text-info animate-spin"/>
    {:else if stepStatus === 'pending'}
        <CircleDot class="h-4 w-4 opacity-75"/>
    {/if}

    {displayName}
</div>
