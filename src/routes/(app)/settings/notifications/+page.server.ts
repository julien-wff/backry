import { notificationsList } from '$lib/server/queries/notifications';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const notifications = await notificationsList();

    return {
        notifications,
    };
};
