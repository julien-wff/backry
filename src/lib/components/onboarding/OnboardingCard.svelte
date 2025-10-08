<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        step: number;
        title: string;
    }

    let { children, step, title }: Props = $props();
</script>

<div class="grid place-items-center min-h-screen p-4">
    <div class="card w-full max-w-lg bg-base-100 shadow-xl">
        <div class="card-body">
            <ul class="steps mb-2">
                <li class="step" class:step-primary={step >= 0}>Welcome</li>
                <li class="step" class:step-primary={step >= 1}>Authentication</li>
                <li class="step" class:step-primary={step >= 2}>Docker</li>
                <li class="step" class:step-primary={step >= 3}>Complete</li>
            </ul>

            <h2 class="card-title">{title}</h2>

            {@render children()}
        </div>
    </div>
</div>
