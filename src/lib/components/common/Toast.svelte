<script lang="ts">
    import { CircleCheck, CircleX, OctagonAlert } from '$lib/components/icons';
    import { type Toast } from '$lib/stores/toasts.svelte';

    interface Props {
        toast: Toast;
        ondismiss?: () => void;
    }

    let { toast, ondismiss }: Props = $props();
</script>

<div class="alert w-96"
     class:alert-error={toast.type === 'error'}
     class:alert-success={toast.type === 'success'}>

    {#if toast.type === 'error'}
        <OctagonAlert class="w-6 h-6"/>
    {:else if toast.type === 'success'}
        <CircleCheck class="w-6 h-6"/>
    {/if}

    <span>{toast.message}</span>

    <button class="cursor-pointer p-2" onclick={ondismiss}>
        <CircleX class="w-4 h-4"/>
    </button>

</div>
