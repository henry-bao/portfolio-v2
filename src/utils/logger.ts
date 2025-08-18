// Simple environment-aware logger to centralize logging behavior
// - debug/info/warn: no-op in production builds
// - error: always logs

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopmentEnvironment: boolean = import.meta.env.DEV === true;

const formatPrefix = (level: LogLevel): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]`;
};

const debug = (...args: unknown[]): void => {
    if (isDevelopmentEnvironment) {
        // eslint-disable-next-line no-console
        console.debug(formatPrefix('debug'), ...args);
    }
};

const info = (...args: unknown[]): void => {
    if (isDevelopmentEnvironment) {
        // eslint-disable-next-line no-console
        console.info(formatPrefix('info'), ...args);
    }
};

const warn = (...args: unknown[]): void => {
    if (isDevelopmentEnvironment) {
        // eslint-disable-next-line no-console
        console.warn(formatPrefix('warn'), ...args);
    }
};

const error = (...args: unknown[]): void => {
    // eslint-disable-next-line no-console
    console.error(formatPrefix('error'), ...args);
};

export const logger = { debug, info, warn, error } as const;

export type Logger = typeof logger;

