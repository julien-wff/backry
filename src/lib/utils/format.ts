import dayjs from 'dayjs';
import pluginDuration from 'dayjs/plugin/duration';
import pluginRelativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(pluginDuration);
dayjs.extend(pluginRelativeTime);
dayjs.extend(utc);

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

/**
 * Format a UTC date (from database) into a human-readable date from the browser's timezone.
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatUtcDate = (date: string) => {
    return dayjs.utc(date).local().format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Transform a string into a slug.
 * Replaces spaces with dashes and removes special characters.
 * Only a-z 0-9 and dashes are kept.
 * @param text The string to slugify
 * @returns The slugified string
 */
export const slugify = (text: string) =>
    text
        .trim()
        .toLowerCase()
        .replace(/[^0-9a-z-]/g, '-')
        .replace(/-+/g, '-');
