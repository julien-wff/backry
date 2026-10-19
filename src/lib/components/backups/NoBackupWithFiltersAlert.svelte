<script lang="ts">
    import { goto } from '$app/navigation';
    import { Funnel } from '#lib/components/icons.ts';

    interface Props {
        filterCount: number;
    }

    let { filterCount }: Props = $props();

    function resetFilters() {
        goto(`?`, { refreshAll: true, replace: true });
    }
</script>

<div class="alert alert-vertical sm:alert-horizontal" role="alert">
    <Funnel class="w-5 h-5 text-secondary"/>
    <div>
        <div>No backup matches the {filterCount} filter{filterCount > 1 ? 's' : ''} you have set.</div>
    </div>
    <button class="btn btn-sm" onclick={resetFilters}>Reset filters</button>
</div>
