<script lang="ts">
    import type { RUN_ORIGIN } from '$lib/db/schema';

    interface Props {
        origin: typeof RUN_ORIGIN[number];
    }

    let { origin }: Props = $props();
</script>

{#if origin === 'manual'}
    <div class="badge badge-sm badge-warning badge-soft">Manual</div>
{:else if origin === 'scheduled'}
    <div class="badge badge-sm badge-info badge-soft">Scheduled</div>
{/if}
