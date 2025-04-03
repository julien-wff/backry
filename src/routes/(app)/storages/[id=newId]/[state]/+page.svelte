<script lang="ts">
    import NewElementCard from '$lib/components/new-elements/NewElementCard.svelte';
    import NewElementsContainer from '$lib/components/new-elements/NewElementsContainer.svelte';
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import FolderOpen from '@lucide/svelte/icons/folder-open';
    import FileTerminal from '@lucide/svelte/icons/file-terminal';
</script>

<NewPageHeader backText="Back to state" currentStep={2} icon={CloudUpload} totalSteps={3}>
    Add storage backend - connection type
</NewPageHeader>

<NewElementsContainer gridClass="grid-cols-2">
    <NewElementCard href="local" icon={FolderOpen}>
        Local file
    </NewElementCard>
    <NewElementCard href="custom" icon={FileTerminal}>
        Custom
    </NewElementCard>
</NewElementsContainer>
