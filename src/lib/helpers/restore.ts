import type { restores } from '$lib/server/db/schema';
import { RESTORE_STEPS } from '$lib/common/constants';

export function getRestoreStepStatus(restore: typeof restores.$inferSelect, step: typeof RESTORE_STEPS[number]) {
    const currentIndex = RESTORE_STEPS.indexOf(restore.currentStep);
    const stepIndex = RESTORE_STEPS.indexOf(step);
    const isError = !!restore.error;
    const isFinished = !!restore.finishedAt;

    if (stepIndex < currentIndex || (stepIndex === currentIndex && !isError && isFinished)) {
        return 'completed';
    } else if (stepIndex === currentIndex) {
        if (isError) {
            return 'error';
        } else {
            return 'in_progress';
        }
    } else {
        return 'pending';
    }
}

export function getRestoreStatus(restore: typeof restores.$inferSelect) {
    if (restore.error) {
        return 'error';
    } else if (restore.finishedAt) {
        return 'success';
    } else {
        return 'running';
    }
}
