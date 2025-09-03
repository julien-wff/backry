<script lang="ts">
    import Modal from '$lib/components/common/Modal.svelte';
    import type { ModalControls } from '$lib/helpers/modal';
    import type { getBackup } from '$lib/server/queries/backups';
    import RestoreRecap from '$lib/components/restores/RestoreRecap.svelte';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { restoreRequest, RestoreResponse } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';
    import { goto } from '$app/navigation';

    interface Props {
        controls: ModalControls | undefined;
        backup: NonNullable<Awaited<ReturnType<typeof getBackup>>>;
        selectedDestination: 'current' | 'other';
        otherConnectionString: string;
        dropDatabase: boolean;
    }

    let { controls = $bindable(), backup, selectedDestination, otherConnectionString, dropDatabase }: Props = $props();

    let loading = $state(false);

    async function handleStartRestore(e: Event) {
        e.preventDefault();
        if (loading) {
            return;
        }

        loading = true;

        const res = await fetchApi<RestoreResponse, typeof restoreRequest>('POST', '/api/restores', {
            backupId: backup.id,
            dropDatabase,
            destination: selectedDestination,
            otherConnectionString: selectedDestination === 'other' ? otherConnectionString : null,
        });

        if (res.isErr()) {
            addToast(res.error, 'error');
        } else {
            await goto(`/restores/${res.value.id}`);
        }

        loading = false;
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
        <button class="btn" disabled={loading} onclick={() => controls?.close()}>Back</button>
        <button class="btn btn-warning" disabled={loading} onclick={handleStartRestore}>Start restore</button>
    </div>
</Modal>
