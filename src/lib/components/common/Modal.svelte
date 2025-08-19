<!--
This component is a mess, but there are reasons.

I need the modal to be on the root of the document body, because it uses forms, and forms cannot be nested (or it can cause weird behaviors)
Svelte doesn't support portals, so I have to move the node manually, once mounted.

I also want only one modal mounted at a time; otherwise it can cause performance issues with hundreds of them,
like in the all backups page.
To do that, I allow only the first modal to be instantiated to be mounted on the body. Every time a modal is shown,
being the mounted one or not, the properties (content, title...) of this mounted modal is updated.
Why don't I mount the modal only when controls.open() is called? Because doing so causees a weird open animation, idk why.
A workaround would be to add an arbitrary delay between mounting and opening, like 50ms, but I don't like that.
And of course, if the mounted modal component is destroyed, I have to set another one as mounted.

Finally, if you've read this far... I'm sorry.
-->

<script lang="ts" module>
    import type { Snippet } from 'svelte';

    // Properties for the currently opened modal
    let mountedModalElement = $state<HTMLDialogElement | null>(null);
    let mountedModalContent = $state<Snippet | null>(null);
    let mountedModalTitle = $state<string | null>(null);
    let mountedModalWidth = $state<'normal' | 'large'>('normal');

    // Properties to manage the "singleton" component behavior
    let modalInstancesIndexes = $state<Array<number>>([]);
    let mountedModalIndex = $state(-1);
    let mountedModalContentIndex = $state(-1);

    // Close behavior handlers
    let onCloseList = $state<Map<number, (() => void) | undefined>>(new Map());
    let openSequence = $state(0);

    function handleMountedModalClose() {
        onCloseList.get(mountedModalContentIndex)?.();
        let currentOpenSequence = openSequence;

        setTimeout(() => {
            if (currentOpenSequence !== openSequence) {
                // Avoid resetting the modal if it was opened again before the timeout
                return;
            }

            mountedModalContent = null;
            mountedModalTitle = null;
            mountedModalWidth = 'normal';
        }, 300); // Delay to allow the close animation to finish
    }
</script>

<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import type { ModalControls as AbstractModalControls } from '$lib/helpers/modal';

    interface Props {
        controls: AbstractModalControls | undefined;
        children: Snippet;
        onclose?: () => void;
        title?: string;
        width?: 'normal' | 'large';
    }

    let { controls = $bindable(), children, onclose, title, width }: Props = $props();

    class ModalControls implements AbstractModalControls {
        open() {
            mountedModalContent = children;
            mountedModalTitle = title || null;
            mountedModalWidth = width || 'normal';

            mountedModalContentIndex = instanceModalIndex!;
            openSequence++;

            tick().then(() => mountedModalElement?.showModal());
        }

        close() {
            mountedModalElement?.close();
        }
    }

    let instanceModalIndex = $state<number | null>(null);
    let instanceModalElement = $state<HTMLDialogElement | null>(null);

    onMount(() => {
        controls = new ModalControls();
        instanceModalIndex = modalInstancesIndexes.length;
        modalInstancesIndexes = [ ...modalInstancesIndexes, instanceModalIndex ];
        onCloseList.set(instanceModalIndex, onclose);

        if (mountedModalIndex === -1) {
            // If no modal is mounted, let this one be the mounted one (via the $effect below)
            mountedModalIndex = instanceModalIndex;
        }
    });

    onDestroy(() => {
        modalInstancesIndexes = modalInstancesIndexes.filter(index => index !== instanceModalIndex);
        onCloseList.delete(instanceModalIndex!);

        if (mountedModalIndex === instanceModalIndex) {
            // If this is the mounted modal, cleanup
            instanceModalElement?.removeEventListener('close', handleMountedModalClose);
            instanceModalElement?.remove();
            // Set the mounted modal index to the last one in the list, or -1 if none left
            mountedModalIndex = modalInstancesIndexes.length > 0
                ? modalInstancesIndexes[modalInstancesIndexes.length - 1]
                : -1;
        }
    });

    $effect(() => {
        if (mountedModalIndex === instanceModalIndex && instanceModalElement) {
            // If this modal is the mounted one, move it to the body and bind the listener
            mountedModalElement = instanceModalElement;
            instanceModalElement.parentElement?.removeChild(instanceModalElement);
            document.body.appendChild(instanceModalElement);
            instanceModalElement.addEventListener('close', handleMountedModalClose);
        }
    });
</script>

{#if mountedModalIndex === instanceModalIndex}
    <dialog class="modal" bind:this={instanceModalElement} {onclose}>
        <form class="modal-box"
              class:max-w-2xl={mountedModalWidth === 'large'}
              method="dialog">
            {#if mountedModalTitle}
                <h3 class="font-bold text-lg mb-4">{mountedModalTitle}</h3>
            {/if}

            {@render mountedModalContent?.()}
        </form>

        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
{/if}
