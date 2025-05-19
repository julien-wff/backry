<script lang="ts">
    import { CircleCheck, CircleX, OctagonAlert } from '$lib/components/icons';
    import { removeToast, toasts } from '$lib/stores/toasts.svelte';
    import { flip } from 'svelte/animate';
    import { fade } from 'svelte/transition';
</script>

<div class="toast">
    {#each toasts.toasts as toast (toast.id)}
        <div class="alert w-96"
             animate:flip={{duration: 300}}
             out:fade={{duration: 100}}
             class:alert-error={toast.type === 'error'}
             class:alert-success={toast.type === 'success'}>

            {#if toast.type === 'error'}
                <OctagonAlert class="w-6 h-6"/>
            {:else if toast.type === 'success'}
                <CircleCheck class="w-6 h-6"/>
            {/if}

            <span>{toast.message}</span>

            <button class="cursor-pointer p-2" onclick={() => removeToast(toast.id)}>
                <CircleX class="w-4 h-4"/>
            </button>

        </div>
    {/each}
</div>
