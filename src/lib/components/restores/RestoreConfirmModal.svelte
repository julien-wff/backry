<script lang="ts">
    import Modal from '$lib/components/common/Modal.svelte';
    import type { ModalControls } from '$lib/helpers/modal';
    import type { getBackup } from '$lib/server/queries/backups';
    import RestoreRecap from '$lib/components/restores/RestoreRecap.svelte';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { restoreRequest } from '$lib/server/schemas/api';

    interface Props {
        controls: ModalControls | undefined;
        backup: NonNullable<Awaited<ReturnType<typeof getBackup>>>;
        selectedDestination: 'current' | 'other';
        otherConnectionString: string;
        dropDatabase: boolean;
    }

    let { controls = $bindable(), backup, selectedDestination, otherConnectionString, dropDatabase }: Props = $props();

    async function handleStartRestore(e: Event) {
        e.preventDefault();

        await fetchApi<object, typeof restoreRequest>('POST', '/api/restores', {
            backupId: backup.id,
            dropDatabase,
            destination: selectedDestination,
            otherConnectionString: selectedDestination === 'other' ? otherConnectionString : null,
        });
    }
</script>

<Modal bind:controls title="Restore recap">
    <RestoreRecap {backup} {dropDatabase} {otherConnectionString} {selectedDestination}/>

    <div class="alert mt-2" role="alert">
        <div>
            <h3 class="font-bold">Warnings</h3>
            <div>Once started, this operation cannot be canceled.</div>
            <div>If some services depend on the destination database, make sure to stop them beforehand.</div>
        </div>
    </div>

    <div class="modal-action">
        <button class="btn" onclick={() => controls?.close()}>Back</button>
        <button class="btn btn-warning" onclick={handleStartRestore}>Start restore</button>
    </div>
</Modal>
