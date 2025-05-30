<script lang="ts">
    import CodeEditor from '$lib/components/common/CodeEditor.svelte';
    import { OctagonAlert } from '$lib/components/icons';
    import { NOTIFICATION_PAYLOAD_EXAMPLE, renderNotificationTemplate } from '$lib/editors/notification-template';

    interface Props {
        opened: boolean;
        inputFieldArguments: string;
    }

    let { opened, inputFieldArguments = $bindable() }: Props = $props();

    let editorValue = $state(inputFieldArguments);
    let previousOpenedState = $state(false);
    $effect(() => {
        if (opened && !previousOpenedState) {
            editorValue = inputFieldArguments.trim();
            previousOpenedState = true;
        } else if (!opened && previousOpenedState) {
            inputFieldArguments = editorValue.trim();
            previousOpenedState = false;
        }
    });

    let exampleValue = $state(JSON.stringify(NOTIFICATION_PAYLOAD_EXAMPLE, null, 2));
    let jsonError = $state<string | null>(null);
    let parsedExampleValue = $state<any>(NOTIFICATION_PAYLOAD_EXAMPLE);
    $effect((() => {
        try {
            jsonError = null;
            parsedExampleValue = JSON.parse(exampleValue);
        } catch (e) {
            jsonError = e instanceof Error ? e.message : 'Invalid JSON';
        }
    }));

    function resetExemplaryValue() {
        exampleValue = JSON.stringify(NOTIFICATION_PAYLOAD_EXAMPLE, null, 2);
    }

    let editorCompiledResult = $derived(renderNotificationTemplate(editorValue, parsedExampleValue));
</script>

<p class="mb-2">
    The notification body can be customized using an EJS template. For more information on EJS, see the
    <a class="link link-primary" href="https://ejs.co/#docs" rel="noopener noreferrer" target="_blank">
        EJS documentation
    </a>.
</p>

<p class="mb-4">
    You have access to an example payload of what will be passed to the EJS template.
    You can modify it to test how the notification body will look with different values.
</p>

<div class="collapse border-base-300 border mb-2">
    <input type="checkbox"/>
    <div class="collapse-title font-semibold">Exemple payload passed to the template</div>
    <div class="collapse-content">
        <CodeEditor bind:value={exampleValue} interactive={opened} language="json"/>
        {#if jsonError}
            <span class="text-error text-sm">
                {jsonError}
            </span>
        {/if}
        <button class="btn btn-soft btn-secondary btn-sm w-full" onclick={resetExemplaryValue} type="button">
            Reset
        </button>
    </div>
</div>

<div class="collapse border-base-300 border mb-2">
    <input checked type="checkbox"/>
    <div class="collapse-title font-semibold">Body EJS editor</div>
    <div class="collapse-content">
        <CodeEditor bind:value={editorValue} interactive={opened} language="ejs"/>
    </div>
</div>


<div class="flex flex-col gap-2">
    {#if editorCompiledResult.isErr()}
        <div role="alert" class="alert alert-error alert-soft">
            <OctagonAlert class="w-4 h-4"/>
            <span class="whitespace-break-spaces font-mono">{editorCompiledResult.error}</span>
        </div>
    {:else}
        <div class="whitespace-break-spaces textarea w-full min-h-0">{editorCompiledResult.value}</div>
    {/if}
</div>
