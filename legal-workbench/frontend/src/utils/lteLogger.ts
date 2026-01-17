/**
 * LTE Logger Utility
 *
 * Configurable logging system for the Legal Text Extractor module.
 * Persists log level preference in localStorage.
 */

export type LogLevel = 'minimal' | 'warning' | 'full';

const STORAGE_KEY = 'lte-log-level';
const DEFAULT_LEVEL: LogLevel = 'warning';

/**
 * Get current log level from localStorage
 */
export function getLogLevel(): LogLevel {
  if (typeof window === 'undefined') return DEFAULT_LEVEL;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ['minimal', 'warning', 'full'].includes(stored)) {
    return stored as LogLevel;
  }
  return DEFAULT_LEVEL;
}

/**
 * Set log level and persist to localStorage
 */
export function setLogLevel(level: LogLevel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, level);
}

/**
 * Check if a message type should be logged based on current level
 */
function shouldLog(
  messageType: 'error' | 'warning' | 'info' | 'debug' | 'request' | 'response' | 'state'
): boolean {
  const level = getLogLevel();

  switch (level) {
    case 'minimal':
      // Only critical errors
      return messageType === 'error';

    case 'warning':
      // Warnings and errors
      return messageType === 'error' || messageType === 'warning';

    case 'full':
      // Everything
      return true;

    default:
      return false;
  }
}

/**
 * Format timestamp for console output
 */
function formatTime(): string {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

/**
 * LTE Logger object with methods for different log types
 */
export const lteLogger = {
  /**
   * Log critical error (always shown except in silent mode)
   */
  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(`[LTE ${formatTime()}] ERROR: ${message}`, ...args);
    }
  },

  /**
   * Log warning (shown in warning and full modes)
   */
  warning(message: string, ...args: unknown[]): void {
    if (shouldLog('warning')) {
      console.warn(`[LTE ${formatTime()}] WARN: ${message}`, ...args);
    }
  },

  /**
   * Log info message (shown only in full mode)
   */
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(`[LTE ${formatTime()}] INFO: ${message}`, ...args);
    }
  },

  /**
   * Log debug message (shown only in full mode)
   */
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(`[LTE ${formatTime()}] DEBUG: ${message}`, ...args);
    }
  },

  /**
   * Log API request (shown only in full mode)
   */
  request(method: string, url: string, data?: unknown): void {
    if (shouldLog('request')) {
      console.log(`[LTE ${formatTime()}] REQUEST: ${method} ${url}`, data ?? '');
    }
  },

  /**
   * Log API response (shown only in full mode)
   */
  response(method: string, url: string, status: number, data?: unknown): void {
    if (shouldLog('response')) {
      const statusColor = status >= 400 ? 'color: red' : 'color: green';
      console.log(
        `[LTE ${formatTime()}] RESPONSE: ${method} ${url} %c${status}`,
        statusColor,
        data ?? ''
      );
    }
  },

  /**
   * Log state change (shown only in full mode)
   */
  state(action: string, data?: unknown): void {
    if (shouldLog('state')) {
      console.log(`[LTE ${formatTime()}] STATE: ${action}`, data ?? '');
    }
  },

  /**
   * Get current log level
   */
  getLevel: getLogLevel,

  /**
   * Set log level
   */
  setLevel: setLogLevel,
};

export default lteLogger;
