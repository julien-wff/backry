<script lang="ts">
    import type { DATABASE_ENGINES } from '$lib/db/schema';

    interface Props {
        engine: typeof DATABASE_ENGINES[number];
    }

    let { engine }: Props = $props();
</script>

<div class="flex items-center gap-1">
    {#if engine === 'postgresql-16'}
        <img src="/icons/postgres.svg" alt="Postgres 16" class="w-4 h-4"/>
        Postgres 16
    {/if}
</div>
