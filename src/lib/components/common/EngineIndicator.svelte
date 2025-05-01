<script lang="ts">
    import type { DATABASE_ENGINES } from '$lib/db/schema';
    import { ENGINES_META } from '$lib/engines/enginesMeta';

    interface Props {
        engine: typeof DATABASE_ENGINES[number];
    }

    let { engine: engineId }: Props = $props();
    const engine = ENGINES_META[engineId];
</script>

<div class="flex items-center gap-1">
    <img alt={engine.displayName} class="w-4 h-4" src={engine.icon}/>
    {engine.displayName}
</div>
