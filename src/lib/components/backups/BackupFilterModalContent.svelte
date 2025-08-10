<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import type { databases as databasesSchema } from '$lib/server/db/schema';
    import type { jobListLimited } from '$lib/server/queries/jobs';

    interface Props {
        jobs: Awaited<ReturnType<typeof jobListLimited>>;
        databases: typeof databasesSchema.$inferSelect[];
        onupdated?: () => void;
    }

    let { jobs, databases, onupdated }: Props = $props();

    function intParam(key: string) {
        const value = page.url.searchParams.get(key);
        return isNaN(parseInt(value ?? '')) ? null : parseInt(value!);
    }

    let selectedJobId = $state<number | null>(intParam('job'));
    let selectedDatabaseId = $state<number | null>(intParam('database'));
    let selectedStatus = $state<string | null>(page.url.searchParams.get('status'));

    function resetFilters() {
        selectedJobId = null;
        selectedDatabaseId = null;
        selectedStatus = null;
        applyFilters();
    }

    async function applyFilters() {
        const params = page.url.searchParams;

        if (selectedJobId) {
            params.set('job', String(selectedJobId));
        } else {
            params.delete('job');
        }

        if (selectedDatabaseId) {
            params.set('database', String(selectedDatabaseId));
        } else {
            params.delete('database');
        }

        if (selectedStatus) {
            params.set('status', selectedStatus);
        } else {
            params.delete('status');
        }

        await goto(`?${params.toString()}`, { invalidateAll: true });
        onupdated?.();
    }
</script>

<div class="flex flex-col gap-2">
    <InputContainer label="Job">
        <select bind:value={selectedJobId} class="select w-full">
            <option value={null}>All jobs</option>
            {#each jobs as job (job.id)}
                <option value={job.id}>{job.name}</option>
            {/each}
        </select>
    </InputContainer>

    <InputContainer label="Database">
        <select bind:value={selectedDatabaseId} class="select w-full">
            <option value={null}>All databases</option>
            {#each databases as database (database.id)}
                <option value={database.id}>{database.name}</option>
            {/each}
        </select>
    </InputContainer>

    <InputContainer label="Status">
        <select bind:value={selectedStatus} class="select w-full">
            <option value={null}>Any status</option>
            <option value={"success"}>Success</option>
            <option value={"pruned"}>Pruned</option>
            <option value={"error"}>Error</option>
        </select>
    </InputContainer>
</div>

<div class="modal-action">
    <button class="btn" onclick={resetFilters}>Reset</button>
    <button class="btn btn-primary" onclick={applyFilters}>Apply</button>
</div>
