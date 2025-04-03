<script lang="ts">
    import NewPageHeader from '$lib/components/new-elements/NewPageHeader.svelte';
    import CloudUpload from '@lucide/svelte/icons/cloud-upload';
    import { page } from '$app/state';

    let isExistingRepository = $state(page.params['state'] === 'existing');
</script>

<NewPageHeader backText="Back to connection type" currentStep={3} icon={CloudUpload} totalSteps={3}>
    Add storage backend - local
</NewPageHeader>


<form class="rounded-box bg-base-200 p-4 flex flex-col gap-4 max-w-xl w-full mx-auto">
    <div class="flex flex-col gap-1">
        <label for="repo-name">Repository name</label>
        <input class="input w-full" id="repo-name">
    </div>
    <div class="flex flex-col gap-1">
        <label for="file-path">File path</label>
        <input class="input w-full" id="file-path" placeholder="/data/repo-path">
    </div>
</form>
