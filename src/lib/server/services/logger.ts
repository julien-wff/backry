import pino from 'pino';

const PRETTY_LOGGING = process.env.NODE_ENV !== 'production' || process.env.BACKRY_LOG_PRETTY === 'true';

export const logger = pino({
    ...(PRETTY_LOGGING ? {
        transport: {
            target: 'pino-pretty',
            options: {
                ignore: 'pid,hostname',
            },
        },
    } : {}),
    level: process.env.BACKRY_LOG_LEVEL ?? 'info',
});
