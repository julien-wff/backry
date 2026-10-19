<script lang="ts">
    import { untrack } from 'svelte';
    import { ENGINES_META } from '#lib/common/engines-meta.ts';
    import type { DATABASE_ENGINES } from '#lib/server/db/schema.ts';

    interface Props {
        engine: typeof DATABASE_ENGINES[number];
    }

    let { engine: engineId }: Props = $props();
    const engine = untrack(() => ENGINES_META[engineId]);
</script>

<div class="flex items-center gap-1">
    <img alt={engine.displayName} class="w-4 h-4" src={engine.icon}/>
    {engine.displayName}
</div>
