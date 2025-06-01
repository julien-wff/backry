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
 * @param showMs Whether to show milliseconds in the output
 * @returns Formatted duration string
 */
export const formatDuration = (duration: number, showMs = true) => {
    const durationObj = dayjs.duration(duration, 'seconds');

    if (durationObj.asMilliseconds() < 1000 && showMs) {
        return `${durationObj.milliseconds().toFixed(0)}ms`;
    } else if (durationObj.asSeconds() < 60) {
        let result = `${durationObj.seconds()}s`;
        if (showMs) {
            result += ` ${durationObj.milliseconds().toFixed(0).padStart(3, '0')}ms`;
        }
        return result;
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
