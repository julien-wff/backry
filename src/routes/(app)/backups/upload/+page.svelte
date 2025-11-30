<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { CloudUpload } from '$lib/components/icons';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import BackupUploadUsageGuide from '$lib/components/backups/BackupUploadUsageGuide.svelte';
    import type { PageProps } from './$types';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ENGINES_META } from '$lib/common/engines-meta';

    let { data }: PageProps = $props();

    let error: null | string = $state(null);

    let selectedDatabase = $state<number | null>(null);
    let selectedJob = $state<number | null>(null);

    let availableDatabases = $derived.by(() => {
        const databases = data.jobs.flatMap(j => j.jobsDatabases.flatMap(jd => jd.database));
        return new Map(databases.map(db => [ db.id, db ]));
    });

    let availableJobs = $derived(data.jobs.filter(j => j.jobsDatabases.some(jd => jd.databaseId === selectedDatabase)));

    async function handleFormSubmit() {

    }
</script>

<Head title="Manual backup upload"/>

<PageContentHeader buttonType="back"
                   icon={CloudUpload}>
    Manual backup upload
</PageContentHeader>


<ElementForm error={error}
             onsubmit={handleFormSubmit}
             title="Manual backup upload">
    <BackupUploadUsageGuide/>

    <InputContainer for="database" label="Database">
        <select bind:value={selectedDatabase} class="w-full select" id="database" required>
            <option disabled selected value={null}>Select a database</option>
            {#each availableDatabases.values() as database (database.id)}
                <option value={database.id} disabled={!['active', 'unhealthy'].includes(database.status)}>
                    {database.name} ({ENGINES_META[database.engine]?.displayName})
                </option>
            {/each}
        </select>
    </InputContainer>

    <InputContainer for="job" label="Associated job">
        <select bind:value={selectedJob}
                class="w-full select disabled:border-base-content/20"
                disabled={selectedDatabase === null}
                id="job"
                required>
            {#each availableJobs as job (job.id)}
                <option value={job.id} disabled={!['active', 'unhealthy'].includes(job.status)}>
                    {job.name}
                </option>
            {/each}
        </select>
    </InputContainer>
</ElementForm>
