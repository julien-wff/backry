<script lang="ts">
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import Plus from '@lucide/svelte/icons/plus';
    import Trash2 from '@lucide/svelte/icons/trash-2';

    interface Props {
        envVars: { key: string; value: string }[];
    }

    let { envVars = $bindable() }: Props = $props();

    function addEnvVar() {
        envVars = [ ...envVars, { key: '', value: '' } ];
    }

    function removeEnvVar(index: number) {
        envVars = envVars.filter((_, i) => i !== index);
    }

    function handlePaste(ev: ClipboardEvent, index: number) {
        const text = ev.clipboardData?.getData('text');
        // Test if the pasted text is in the format "KEY = VALUE"
        if (!text?.match(/^[\r\t\n ]*[\w_]+ *=[^\n]+[\n\r\t ]*$/)) {
            return;
        }

        // Extract the key and value from the pasted text, and unquote the value
        const [ key, ...values ] = text.split('=');
        let value = values.join('=').trim().replace(/^["']|["']$/g, '');

        if (key && values.length > 0) {
            ev.preventDefault();
            envVars[index] = { key: key.trim(), value };
        }
    }
</script>

<InputContainer>
    <span class="cursor-default">Environment variables</span>

    {#each envVars as _, i}
        <div class="flex gap-2 items-center">
            <input bind:value={envVars[i].key}
                   class="input w-full"
                   placeholder="Key"
                   required
                   onpaste={(ev) => handlePaste(ev, i)}>
            =
            <input bind:value={envVars[i].value} class="input w-full" placeholder="Value" required>
            <button type="button" class="btn btn-sm btn-error" onclick={() => removeEnvVar(i)}>
                <Trash2 class="w-4 h-4 text-error-content"/>
            </button>
        </div>
    {/each}
    <button class="btn btn-sm btn-primary btn-soft" onclick={addEnvVar} type="button">
        <Plus class="w-4 h-4"/>
        Add environment variable
    </button>
</InputContainer>