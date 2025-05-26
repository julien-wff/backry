<script lang="ts">
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Zap } from '$lib/components/icons';
    import type { notifications } from '$lib/server/db/schema';

    interface Props {
        notification: typeof notifications.$inferSelect;
    }

    let { notification }: Props = $props();
</script>

<BaseListElement editHref="./notifications/{notification.id}" status={notification.status} title={notification.name}>
    <div class="flex items-center gap-1">
        <Zap class="w-4 h-4"/>
        {#if notification.trigger === 'run_finished'}
            On job finished
        {:else if notification.trigger === 'run_error'}
            On job error
        {:else if notification.trigger === 'cron'}
            Cron
        {/if}
    </div>
</BaseListElement>
