import type { PageServerLoad } from './$types';
import { heapStats } from 'bun:jsc';

export const load: PageServerLoad = async ({}) => {
    return {
        heapStats: heapStats(),
        memoryUsage: process.memoryUsage(),
    };
};
