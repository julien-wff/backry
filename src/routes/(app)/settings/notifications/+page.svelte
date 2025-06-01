<script lang="ts">
    import Head from '$lib/components/common/Head.svelte';
    import PageContentHeader from '$lib/components/common/PageContentHeader.svelte';
    import { Bell } from '$lib/components/icons';
    import NotificationElement from '$lib/components/notifications/NotificationElement.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
</script>


<Head title="Settings - Notifications"/>

<PageContentHeader buttonType="new" icon={Bell}>
    Settings - Notifications
</PageContentHeader>

<div class="grid grid-cols-1 gap-4">
    {#each data.notifications as notification (notification.id)}
        <NotificationElement {notification}/>
    {/each}
</div>
