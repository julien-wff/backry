<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { FolderHeart } from '$lib/components/icons';
    import LocksDisplay from '$lib/components/storages/LocksDisplay.svelte';
    import PruneDesyncDisplay from '$lib/components/storages/PruneDesyncDisplay.svelte';
    import StaleSnapshotsDisplay from '$lib/components/storages/StaleSnapshotsDisplay.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head title="{data.storage.name} repository health"/>

<PageContentHeader buttonType="back" icon={FolderHeart}>
    {data.storage.name} Repository health
</PageContentHeader>

<ElementForm title="Repository health">
    <InputContainer label="Locks">
        <LocksDisplay/>
    </InputContainer>

    <InputContainer label="Stale snapshots">
        <StaleSnapshotsDisplay/>
    </InputContainer>

    <InputContainer label="Pruned backups desynchronization">
        <PruneDesyncDisplay/>
    </InputContainer>
</ElementForm>
