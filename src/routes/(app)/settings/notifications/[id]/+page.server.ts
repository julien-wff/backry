import { parseIdOrNewParam } from '$lib/server/api/params';
import { getNotification } from '$lib/server/queries/notifications';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ params }) => {
    const { id, isNew } = parseIdOrNewParam(params.id);
    if (id === null && !isNew) {
        return error(400, 'Invalid notification ID');
    }

    let notification: Awaited<ReturnType<typeof getNotification>> | null = null;
    if (id !== null) {
        notification = await getNotification(id);
        if (!notification) {
            return error(404, 'Notification not found');
        }
    }

    return {
        notification,
    };
};
