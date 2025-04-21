import dayjs from 'dayjs';
import pluginDuration from 'dayjs/plugin/duration';
import pluginRelativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(pluginDuration);
dayjs.extend(pluginRelativeTime);

/**
 * Format a duration into a human-readable string.
 * Dynamically adjusts the units.
 * @param duration Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (duration: number) => {
    duration = Math.round(duration * 1000) / 1000; // round to millisecond
    const durationObj = dayjs.duration(duration, 'seconds');

    if (durationObj.asSeconds() < 60) {
        return durationObj.format('s[s] SSS[ms]');
    } else if (durationObj.asMinutes() < 60) {
        return durationObj.format('m[m] s[s]');
    } else {
        return durationObj.format('h[h] m[m] s[s]');
    }
};

/**
 * Format a size into a human-readable string.
 * @param size Size in bytes
 * @returns Formatted size string
 */
export const formatSize = (size: number) => {
    const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
    let i = 0;
    while (size >= 1024 && i < sizes.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
};
