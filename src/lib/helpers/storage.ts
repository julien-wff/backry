import type { ResticLock } from '$lib/types/restic';
import dayjs from 'dayjs';

/**
 * Count the number of stale locks (more than 30 mins old) in the provided array of Restic locks.
 * @param locks An array of ResticLock objects to check for stale locks.
 * @return The count of stale locks.
 */
export const staleLocksCount = (locks: ResticLock[]) =>
    locks.filter(lock => dayjs(lock.time).add(30, 'minutes').isBefore()).length;
