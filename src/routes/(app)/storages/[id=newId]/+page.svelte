<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import NewElementCard from '$lib/components/new-elements/NewElementCard.svelte';
    import NewElementsContainer from '$lib/components/new-elements/NewElementsContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import PackageOpen from '@lucide/svelte/icons/package-open';
    import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
</script>

<Head title="New storage backend"/>

<NewPageHeader currentStep={1} icon={CloudUpload} totalSteps={2}>
    Add storage backend - repository status
</NewPageHeader>

<NewElementsContainer gridClass="grid-cols-2">
    <NewElementCard href="init" icon={ArchiveRestore}>
        New Restic repository
    </NewElementCard>
    <NewElementCard href="existing" icon={PackageOpen}>
        Existing Restic repository
    </NewElementCard>
</NewElementsContainer>
