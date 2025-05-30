<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import BaseListElement from '$lib/components/common/BaseListElement.svelte';
    import { Clock, EthernetPort, Zap } from '$lib/components/icons';
    import { fetchApi } from '$lib/helpers/fetch';
    import { formatUtcDate } from '$lib/helpers/format.js';
    import type { notifications } from '$lib/server/db/schema';
    import type { notificationPatchRequest, NotificationResponse } from '$lib/server/schemas/api';
    import { addToast } from '$lib/stores/toasts.svelte';

    interface Props {
        notification: typeof notifications.$inferSelect;
    }

    let { notification }: Props = $props();

    let loading = $state(false);
    let anonymizedUrl = $derived((() => {
        const url = URL.parse(notification.url);
        if (!url) {
            return notification.url;
        }
        url.username = '';
        url.password = '';
        url.search = '';
        url.pathname = '';
        return url.toString();
    })());

    async function deleteNotification() {
        loading = true;
        const res = await fetchApi<NotificationResponse>(
            'DELETE',
            `/api/settings/notifications/${notification.id}`,
            null,
        );

        if (res.isOk()) {
            await invalidateAll();
        } else {
            addToast(`Failed to delete notification ${notification.name}: ${res.error}`, 'error');
        }

        loading = false;
    }

    async function changeNotificationStatus() {
        loading = true;
        const res = await fetchApi<NotificationResponse, typeof notificationPatchRequest>(
            'PATCH',
            `/api/settings/notifications/${notification.id}`,
            {
                status: notification.status === 'inactive' ? 'active' : 'inactive',
            },
        );

        if (res.isOk()) {
            await invalidateAll();
        }

        loading = false;
    }
</script>


<BaseListElement disabled={loading}
                 editHref="./notifications/{notification.id}"
                 error={notification.error}
                 ondelete={deleteNotification}
                 onstatuschange={changeNotificationStatus}
                 status={notification.status}
                 title={notification.name}>
    <div class="flex items-center gap-1">
        <Zap class="w-4 h-4"/>
        {#if notification.trigger === 'run_finished'}
            On job finished
        {:else if notification.trigger === 'run_error'}
            On job error
        {:else if notification.trigger === 'cron'}
            Cron
        {/if}
    </div>

    <div class="flex flex-1 items-center gap-1">
        <EthernetPort class="w-4 h-4"/>
        {anonymizedUrl}
    </div>

    {#if notification.firedAt}
        <div class="flex items-center gap-1">
            <Clock class="w-4 h-4"/>
            <span>
                Last fired:
                {formatUtcDate(notification.firedAt)}
            </span>
        </div>
    {/if}
</BaseListElement>
