<script lang="ts">
    interface Props {
        dialog?: HTMLDialogElement;
        ondelete?: () => void;
        deleteConfirmationMessage?: string;
    }

    let { dialog = $bindable(), ondelete, deleteConfirmationMessage }: Props = $props();
</script>

<dialog bind:this={dialog} class="modal">
    <form class="modal-box" method="dialog">
        <h3 class="font-bold text-lg">Are you sure?</h3>

        <p class="py-4">
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
    </form>

    <form class="modal-backdrop" method="dialog">
        <button type="submit">Close</button>
    </form>
</dialog>
