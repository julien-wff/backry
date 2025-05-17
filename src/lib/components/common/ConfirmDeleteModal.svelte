<script lang="ts">
    import Modal from '$lib/components/common/Modal.svelte';

    interface Props {
        dialog?: HTMLDialogElement;
        ondelete?: () => void;
        deleteConfirmationMessage?: string;
    }

    let { dialog = $bindable(), ondelete, deleteConfirmationMessage }: Props = $props();
</script>

<Modal bind:modal={dialog} title="Are you sure?">
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
