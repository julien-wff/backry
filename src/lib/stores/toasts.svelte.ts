export type ToastType = 'success' | 'error';

export interface Toast {
    message: string;
    type: ToastType;
    id: string;
}

export const toasts = $state({
    toasts: [] as Toast[],
});

/**
 * Make a toast popup in the bottom-right corner of the page
 */
export function addToast(message: string, type: ToastType) {
    toasts.toasts = [
        ...toasts.toasts,
        {
            message,
            type,
            id: crypto.randomUUID(),
        },
    ];
}

/**
 * Remove a toast popup from the bottom-right corner of the page
 * @param id The id of the toast to remove
 */
export function removeToast(id: string) {
    toasts.toasts = toasts.toasts.filter((toast) => toast.id !== id);
}
