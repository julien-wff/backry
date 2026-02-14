<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { CloudUpload } from '$lib/components/icons';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import BackupUploadUsageGuide from '$lib/components/backups/BackupUploadUsageGuide.svelte';
    import type { PageProps } from './$types';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { ENGINES_META } from '$lib/common/engines-meta';
    import { fetchApi, uploadFileInChunks } from '$lib/helpers/fetch';
    import { Tween } from 'svelte/motion';
    import { formatSize } from '$lib/helpers/format';
    import type { BackupResponse, backupUploadRequest } from '$lib/server/schemas/api';

    let { data }: PageProps = $props();

    let error: null | string = $state(null);

    let selectedDatabase = $state<number | null>(null);
    let selectedJob = $state<number | null>(null);
    let selectedFiles: FileList | null = $state(null);

    let availableDatabases = $derived.by(() => {
        const databases = data.jobs.flatMap(j => j.jobsDatabases.flatMap(jd => jd.database));
        return new Map(databases.map(db => [ db.id, db ]));
    });

    let availableJobs = $derived(data.jobs.filter(j => j.jobsDatabases.some(jd => jd.databaseId === selectedDatabase)));

    let isUploading = $state(false);
    let isUploadSuccessful = $state(false);
    let uploadedBytes = new Tween(0, { duration: 50 });
    let totalBytes = $state(0);
    let uploadProgress = $derived(totalBytes === 0 ? null : uploadedBytes.current / totalBytes);

    async function handleFormSubmit() {
        if (isUploading || !selectedDatabase || !selectedJob || !selectedFiles) {
            return;
        }
        isUploading = true;

        const initRes = await fetchApi<BackupResponse, typeof backupUploadRequest>(
            'POST',
            `/api/backups/upload`,
            {
                databaseId: selectedDatabase,
                jobId: selectedJob,
            },
        );
        if (initRes.isErr()) {
            error = initRes.error;
            isUploading = false;
            return;
        }

        const uploadRes = await uploadFileInChunks(
            `/api/backups/upload/chunk?backupId=${initRes.value.id}`,
            selectedFiles.item(0)!,
            (up, tot) => {
                uploadedBytes.set(up);
                totalBytes = tot;
            },
        );
        if (uploadRes.isErr()) {
            error = uploadRes.error;
            isUploading = false;
            return;
        }

        const finishRes = await fetchApi<BackupResponse>(
            'POST',
            `/api/backups/upload/finish?backupId=${initRes.value.id}`,
            null,
        );
        if (finishRes.isErr()) {
            error = finishRes.error;
            isUploading = false;
            return;
        }

        isUploading = false;
        isUploadSuccessful = true;
    }
</script>

<Head title="Manual backup upload"/>

<PageContentHeader buttonType="back"
                   icon={CloudUpload}>
    Manual backup upload
</PageContentHeader>


<ElementForm bind:error
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

    <InputContainer for="file" label="Backup file">
        <input bind:files={selectedFiles}
               class="w-full file-input"
               disabled={selectedDatabase === null}
               id="file"
               required
               type="file"/>
    </InputContainer>

    {#if !isUploadSuccessful}
        <button class="w-full btn btn-primary mt-2"
                disabled={selectedDatabase === null || selectedJob === null || selectedFiles === null || selectedFiles.length === 0 || isUploading}>
            Upload backup
        </button>
    {:else}
        <a class="w-full btn btn-success mt-2" href="/backups">
            Upload successful! Go to backups list.
        </a>
    {/if}

    {#if isUploading}
        <div>
            <progress class="progress progress-primary w-full mt-2" value={uploadProgress} max="1"></progress>
            {#if totalBytes === 0}
                Uploading file...
            {:else}
                Uploading file ({formatSize(uploadedBytes.current)} / {formatSize(totalBytes)})
            {/if}
        </div>
    {/if}
</ElementForm>
