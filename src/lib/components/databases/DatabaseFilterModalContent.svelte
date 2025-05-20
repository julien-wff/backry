<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ENGINE_META_ENTRIES } from '$lib/engines/enginesMeta';

    let enginesFilter = $state(page.url.searchParams.get('engines')?.split(',') ?? []);
    let areAllEnginesSelected = $derived(enginesFilter.length === 0 || enginesFilter.length === ENGINE_META_ENTRIES.length);

    function toggleEngine(engineId: string) {
        if (enginesFilter.includes(engineId)) {
            enginesFilter = enginesFilter.filter((id) => id !== engineId);
        } else {
            enginesFilter = [ ...enginesFilter, engineId ];
        }
    }

    function applyFilters() {
        const params = new URLSearchParams(page.url.searchParams);
        if (enginesFilter.length > 0) {
            params.set('engines', enginesFilter.join(','));
        } else {
            params.delete('engines');
        }

        goto(`?${params.toString()}`, { invalidateAll: true });
    }

    function resetFilters() {
        enginesFilter = [];
        applyFilters();
    }
</script>

<InputContainer label="Engines ({areAllEnginesSelected ? 'all' : enginesFilter.length})">
    <div class="flex gap-2">
        {#each ENGINE_META_ENTRIES as [engineId, engine] (engineId)}
            <button class="w-32 gap-2 px-4 py-2 flex flex-col items-center bg-base-300 justify-center rounded-lg cursor-pointer border-2"
                    class:border-primary={enginesFilter.includes(engineId)}
                    class:border-transparent={!enginesFilter.includes(engineId)}
                    type="button"
                    onclick={() => toggleEngine(engineId)}>
                <img alt="{engine.displayName} logo" class="w-8 h-8" src={engine.icon}/>
                {engine.displayName}
            </button>
        {/each}
    </div>
</InputContainer>

<div class="modal-action">
    <button class="btn" onclick={resetFilters}>Reset</button>
    <button class="btn btn-primary" onclick={applyFilters} type="submit">Apply</button>
</div>
