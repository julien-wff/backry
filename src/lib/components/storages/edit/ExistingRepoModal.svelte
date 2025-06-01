<script lang="ts">
    import Modal from '$lib/components/common/Modal.svelte';

    interface Props {
        modal: HTMLDialogElement | null;
        oncontinue?: () => void;
    }

    let { modal = $bindable(), oncontinue }: Props = $props();
</script>

<Modal bind:modal title="Warning on using existing repository">
    <p>
        Using an existing Restic repository is <b>not recommended</b>. While this feature has been tested and
        <i>should</i> be safe, there's always a risk of data loss or synchronization issues. If you understand these
        risks and have no alternative, click "Continue" to proceed.
    </p>

    <div class="modal-action">
        <button class="btn" onclick={() => modal?.close()}>Back</button>
        <button class="btn btn-warning" onclick={oncontinue}>Continue</button>
    </div>
</Modal>
