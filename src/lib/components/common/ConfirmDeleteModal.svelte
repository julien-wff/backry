<script lang="ts">
    import Modal from '$lib/components/common/Modal.svelte';
    import type { ModalControls } from '$lib/helpers/modal';

    interface Props {
        controls: ModalControls | undefined;
        ondelete?: () => void;
        deleteConfirmationMessage?: string;
    }

    let { controls = $bindable(), ondelete, deleteConfirmationMessage }: Props = $props();
</script>

<Modal bind:controls title="Are you sure?">
    <p class="pb-4">
        {#if deleteConfirmationMessage}
            {deleteConfirmationMessage}
            <br/>
        {/if}
        This action cannot be undone.
    </p>

    <div class="modal-action">
        <button class="btn" type="submit">Cancel</button>
        <button class="btn btn-error" onclick={ondelete} type="submit">Delete</button>
    </div>
</Modal>
