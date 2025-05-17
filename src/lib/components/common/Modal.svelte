<script lang="ts">
    import { onDestroy, onMount, type Snippet, tick } from 'svelte';

    interface Props {
        modal?: HTMLDialogElement | null;
        children: Snippet;
        onclose?: () => void;
        title?: string;
    }

    let { modal = $bindable(), children, onclose, title }: Props = $props();

    let loaded = $state(false);

    onMount(async () => {
        loaded = true;
        await tick();
        // Move modal to the end of the body
        const modalParent = modal?.parentElement;
        if (modalParent && modal) {
            modalParent.removeChild(modal);
            document.body.appendChild(modal);
        }
    });

    onDestroy(() => {
        if (modal && modal.parentElement) {
            modal.parentElement.removeChild(modal);
        }
    });
</script>

{#if loaded}
    <dialog class="modal" bind:this={modal} {onclose}>
        <form class="modal-box" method="dialog">
            {#if title}
                <h3 class="font-bold text-lg mb-4">{title}</h3>
            {/if}

            {@render children()}
        </form>

        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
{/if}
