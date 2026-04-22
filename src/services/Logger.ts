const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV !== 'production';

/**
 * Production-safe logger. Debug/info logs are silenced when
 * EXPO_PUBLIC_APP_ENV === 'production'. Errors always log.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (IS_DEV) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (IS_DEV) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (IS_DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
