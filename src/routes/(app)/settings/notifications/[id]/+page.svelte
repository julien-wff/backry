<script lang="ts">
    import { goto } from '$app/navigation';
    import CodeEditor from '$lib/components/common/CodeEditor.svelte';
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import ElementForm from '$lib/components/forms/ElementForm.svelte';
    import InputContainer from '$lib/components/forms/InputContainer.svelte';
    import { Bell } from '$lib/components/icons';
    import NotificationTemplateEditor from '$lib/components/settings/notifications/NotificationTemplateEditor.svelte';
    import { fetchApi } from '$lib/helpers/fetch';
    import type { NOTIFICATION_TRIGGER } from '$lib/server/db/schema';
    import type { notificationRequest, NotificationResponse, notificationTestRequest } from '$lib/server/schemas/api';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let error = $state<string | null>(null);
    let isSubmitting = $state(false);
    let isNotificationTesting = $state(false);

    let notificationName = $state(data.notification?.name ?? '');
    let trigger = $state<typeof NOTIFICATION_TRIGGER[number] | null>(data.notification?.trigger ?? null);
    let shoutrrrUrl = $state(data.notification?.url ?? '');
    let body = $state(data.notification?.body ?? '');
    let title = $state(data.notification?.title ?? '');

    async function testNotification() {
        isNotificationTesting = true;
        error = null;

        const res = await fetchApi<{}, typeof notificationTestRequest>('POST', '/api/settings/notifications/test', {
            url: shoutrrrUrl,
            body,
            title: title || null,
        });
        isNotificationTesting = false;

        if (res.isErr()) {
            error = res.error;
            return;
        }
    }

    async function handleSubmit() {
        isSubmitting = true;

        const res = await fetchApi<NotificationResponse, typeof notificationRequest>(
            data.notification ? 'PUT' : 'POST',
            data.notification ? `/api/settings/notifications/${data.notification.id}` : '/api/settings/notifications',
            {
                name: notificationName,
                trigger: trigger!,
                url: shoutrrrUrl,
                body,
                title: title || null,
            },
        );

        if (res.isErr()) {
            isSubmitting = false;
            return res.error;
        }

        await goto('/settings/notifications');
    }
</script>


<Head title="{data.notification ? `Edit ${data.notification.name}` : 'Add'} notification"/>

<PageContentHeader buttonType="back" icon={Bell}>
    {data.notification ? 'Edit' : 'Add'} notification
</PageContentHeader>

{#snippet titleEditorContent({ opened }: { opened: boolean })}
    <NotificationTemplateEditor {opened} bind:inputFieldArguments={title} fieldName="Title"/>
{/snippet}

{#snippet bodyEditorContent({ opened }: { opened: boolean })}
    <NotificationTemplateEditor {opened} bind:inputFieldArguments={body} fieldName="Body"/>
{/snippet}

<ElementForm bind:error onsubmit={handleSubmit} title="{data.notification ? 'Edit' : 'Add'} notification">
    <InputContainer for="notification-name" label="Name">
        <input bind:value={notificationName} class="w-full input" id="notification-name" required>
    </InputContainer>

    <InputContainer for="trigger" label="Trigger">
        <select bind:value={trigger} class="w-full select" id="trigger" required>
            <option disabled value={null}></option>
            <option value="run_finished">On job finished (with or without failed backups)</option>
            <option value="run_error">On job failed (one or more failed backups)</option>
        </select>
    </InputContainer>

    <InputContainer for="shoutrrr-url" label="Shoutrrr URL">
        <input bind:value={shoutrrrUrl}
               class="w-full input"
               id="shoutrrr-url"
               placeholder="smtp://username:password@host:port/?from=fromAddress&to=recipient"
               required>
    </InputContainer>

    <InputContainer editorContent={titleEditorContent}
                    editorModalWidth="large"
                    editorTitle="Notification title editor"
                    label="Notification title (if supported)">
        <CodeEditor bind:value={title} language="ejs"/>
    </InputContainer>

    <InputContainer editorContent={bodyEditorContent} editorModalWidth="large" label="Notification body">
        <CodeEditor bind:value={body} language="ejs"/>
    </InputContainer>

    <div class="flex gap-2">
        <button class="btn flex-1"
                disabled={isNotificationTesting}
                onclick={testNotification}
                type="button">
            Test notification
        </button>

        <button class="btn btn-primary flex-1" disabled={isNotificationTesting || isSubmitting}>
            Save
        </button>
    </div>
</ElementForm>
