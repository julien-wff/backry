import { notificationsList } from '#lib/server/queries/notifications.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const notifications = await notificationsList();

    return {
        notifications,
    };
};
