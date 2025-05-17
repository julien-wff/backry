<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import JobDeletePolicyEditor from '$lib/components/jobs/JobDeletePolicyEditor.svelte';

    interface Props {
        deletePolicy: string;
        cron: string;
        isCronValid: boolean;
    }

    let { deletePolicy = $bindable(), cron, isCronValid }: Props = $props();
</script>

{#snippet editorContent({ opened }: { opened: boolean })}
    <JobDeletePolicyEditor {opened} bind:inputFieldArguments={deletePolicy} {cron} {isCronValid}/>
{/snippet}

<InputContainer {editorContent} for="delete-policy" label="Delete policy">
    <input bind:value={deletePolicy}
           class="w-full input"
           id="delete-policy"
           placeholder="--keep-last 10 --keep-monthly 2"
           type="text"/>
</InputContainer>
