export type ToastType = 'success' | 'error';

export interface Toast {
    message: string;
    type: ToastType;
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
        { message, type },
    ];
}

/**
 * Remove a toast popup from the bottom-right corner of the page
 * @param index Index in the toasts array to remove
 */
export function removeToast(index: number) {
    toasts.toasts = [
        ...toasts.toasts.slice(0, index),
        ...toasts.toasts.slice(index + 1),
    ];
}
