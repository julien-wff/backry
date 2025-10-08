<script lang="ts">
    import type { ModalControls } from '$lib/helpers/modal';
    import Modal from '$lib/components/common/Modal.svelte';
    import type { EngineMeta } from '$lib/types/engine';
    import dedent from 'dedent';

    interface Props {
        controls?: ModalControls;
        engineMeta: EngineMeta;
        ondropaccept?: () => void;
    }

    let { controls = $bindable(), engineMeta, ondropaccept }: Props = $props();

    const defaultMessage = dedent`
        Enabling this option will entirely drop the existing database before restoring the backup. Use at your own risk.
    `;
</script>

<Modal bind:controls title="Confirm database drop">
    <div class="mb-1 whitespace-pre-wrap">{engineMeta.dropOnRestoreMessage || defaultMessage}</div>
    <div class="mb-4">Are you sure you want to proceed?</div>

    <div class="modal-action">
        <button class="btn" type="submit">Cancel</button>
        <button class="btn btn-warning" onclick={ondropaccept} type="submit">Drop and recreate</button>
    </div>
</Modal>
