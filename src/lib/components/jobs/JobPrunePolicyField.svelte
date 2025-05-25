<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import JobPrunePolicyEditor from '$lib/components/jobs/JobPrunePolicyEditor.svelte';

    interface Props {
        prunePolicy: string;
        cron: string;
        isCronValid: boolean;
    }

    let { prunePolicy = $bindable(), cron, isCronValid }: Props = $props();
</script>

{#snippet editorContent({ opened }: { opened: boolean })}
    <JobPrunePolicyEditor {opened} bind:inputFieldArguments={prunePolicy} {cron} {isCronValid}/>
{/snippet}

<InputContainer {editorContent} for="prune-policy" label="Prune policy">
    <input bind:value={prunePolicy}
           class="w-full input"
           id="prune-policy"
           placeholder="--keep-last 10 --keep-monthly 2"
           type="text"/>
</InputContainer>
