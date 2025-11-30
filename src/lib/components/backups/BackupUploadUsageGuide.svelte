<script lang="ts">
    import { Info } from '$lib/components/icons';
    import Modal from '$lib/components/common/Modal.svelte';
    import type { ModalControls } from '$lib/helpers/modal';

    let controls = $state<ModalControls>();
</script>

<div class="alert alert-soft alert-info mb-2">
    <Info class="inline w-6 h-6"/>
    <div class="flex items-center gap-2">
        <p>Before using this feature, please read the</p>
        <button class="btn btn-info btn-sm" onclick={() => controls?.open()}>Usage guide</button>
    </div>
</div>

<Modal bind:controls title="Backup upload usage guide">
    <p>Use this feature to manually upload a backup file to Backry. This is useful if:</p>
    <ul class="list-disc list-outside pl-4 mb-2">
        <li>You have a backup file stored locally you want to add to Backry</li>
        <li>You want to re-upload a backup file you've downloaded and edited</li>
    </ul>

    <p class="mb-2">In all cases, you'll then be able to restore the uploaded backup.</p>

    <p class="font-bold">Important notes:</p>
    <ul class="list-disc list-outside pl-4 mb-2">
        <li>A database needs to be associated to a job to upload a backup.</li>
        <li>
            Uploaded backups are subject to the same retention policies as regular backups, defined by the selected job.
        </li>
    </ul>

    <div class="modal-action">
        <button class="btn btn-secondary btn-soft">Close</button>
    </div>
</Modal>
