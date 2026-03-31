/**
 * Structured Logging Utility for AlgoVigilance
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *
 *   // Create a scoped logger for your module
 *   const log = logger.scope('MyModule');
 *
 *   log.debug('Debug message', { data });
 *   log.info('Info message');
 *   log.warn('Warning message');
 *   log.error('Error message', error);
 *
 * Environment Variables:
 *   - NEXT_PUBLIC_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'silent'
 *   - Default: 'warn' in production, 'debug' in development
 *
 * Migration from console.log:
 *   Replace: console.log('[ModuleName] Message', data)
 *   With:    logger.scope('ModuleName').info('Message', data)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

interface LogEntry {
  level: LogLevel;
  scope: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

// Emoji prefixes for visual scanning
const LOG_EMOJI: Record<Exclude<LogLevel, 'silent'>, string> = {
  debug: '🔍',
  info: '📘',
  warn: '⚠️',
  error: '❌',
};

// Color codes for terminal (Node.js)
const LOG_COLORS: Record<Exclude<LogLevel, 'silent'>, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[34m',  // Blue
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

function getLogLevel(): LogLevel {
  // Check environment variable
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }

  // Default based on environment
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(entry: LogEntry): string {
  const { level, scope, message, timestamp } = entry;
  const emoji = LOG_EMOJI[level as keyof typeof LOG_EMOJI] || '';

  // Check if we're in browser or Node
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    // Browser format (no ANSI colors)
    return `${emoji} [${timestamp}] [${scope}] ${message}`;
  } else {
    // Node format with colors
    const color = LOG_COLORS[level as keyof typeof LOG_COLORS] || '';
    return `${color}${emoji} [${timestamp}] [${scope}] ${message}${RESET_COLOR}`;
  }
}

function createLogEntry(level: LogLevel, scope: string, message: string, data?: unknown): LogEntry {
  return {
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Safely serialize data for logging to avoid source map parsing issues
 * with third-party libraries like google-gax
 */
function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Error objects and error-like objects (cross-realm errors fail instanceof)
  if (data instanceof Error || isErrorLike(data)) {
    const err = data as { name?: string; message?: string; stack?: string; cause?: unknown };
    return {
      name: err.name ?? 'Error',
      message: err.message ?? String(data),
      // Only include first few lines of stack to avoid source map issues
      ...(err.stack ? { stack: err.stack.split('\n').slice(0, 5).join('\n') } : {}),
      ...(err.cause !== undefined ? { cause: String(err.cause) } : {}),
    };
  }

  // Handle objects with circular references or complex prototypes
  if (typeof data === 'object') {
    try {
      // Attempt to create a plain object copy
      const serialized = JSON.stringify(data, (_, value) => {
        // Handle special Firebase/Firestore types
        if (value && typeof value === 'object') {
          if (value.constructor?.name === 'Timestamp') {
            return { _type: 'Timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
          }
          if (value.constructor?.name === 'DocumentReference') {
            return { _type: 'DocumentReference', path: value.path };
          }
        }
        return value;
      }, 2);
      const parsed = JSON.parse(serialized) as unknown;

      // Detect empty serialization — object had no enumerable properties
      // Common with framework transport errors, DOMExceptions, etc.
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.keys(parsed as Record<string, unknown>).length === 0
      ) {
        const typeName = Object.prototype.toString.call(data);
        const stringRepr = String(data);
        return {
          _type: typeName,
          _value: stringRepr !== '[object Object]' ? stringRepr : undefined,
          _constructor: (data as { constructor?: { name?: string } }).constructor?.name,
        };
      }

      return parsed;
    } catch {
      // If serialization fails, return a safe string representation
      return String(data);
    }
  }

  return data;
}

/** Detect error-like objects that fail instanceof (cross-realm, server action transport) */
function isErrorLike(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    (typeof obj.message === 'string' || typeof obj.name === 'string') &&
    (typeof obj.stack === 'string' || obj.stack === undefined)
  );
}

function log(level: Exclude<LogLevel, 'silent'>, scope: string, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, scope, message, data);
  const formattedMessage = formatMessage(entry);

  // Sanitize data to avoid source map parsing issues with third-party libraries
  const safeData = data !== undefined ? sanitizeLogData(data) : undefined;

  // Use appropriate console method with try-catch to prevent source map errors
  try {
    switch (level) {
      case 'debug':
        if (safeData !== undefined) {
          console.debug(formattedMessage, safeData);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        if (safeData !== undefined) {
          console.info(formattedMessage, safeData);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (safeData !== undefined) {
          console.warn(formattedMessage, safeData);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (safeData !== undefined) {
          console.error(formattedMessage, safeData);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  } catch {
    // Fallback if console method itself throws (rare but possible with source map issues)
    console.log(`[${level.toUpperCase()}] ${formattedMessage}`, safeData !== undefined ? String(safeData) : '');
  }
}

/**
 * Scoped logger instance
 * Creates a logger with a fixed scope/module name
 */
interface ScopedLogger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

function createScopedLogger(scope: string): ScopedLogger {
  return {
    debug: (message: string, data?: unknown) => log('debug', scope, message, data),
    info: (message: string, data?: unknown) => log('info', scope, message, data),
    warn: (message: string, data?: unknown) => log('warn', scope, message, data),
    error: (message: string, data?: unknown) => log('error', scope, message, data),
  };
}

/**
 * Main logger object
 *
 * Usage:
 *   const log = logger.scope('MyModule');
 *   log.info('Something happened');
 *
 *   // Or use directly for quick logging
 *   logger.info('Global', 'Quick message');
 */
export const logger = {
  /**
   * Create a scoped logger for a specific module
   */
  scope: createScopedLogger,

  /**
   * Direct logging methods (use scope() for better organization)
   */
  debug: (scope: string, message: string, data?: unknown) => log('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown) => log('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => log('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) => log('error', scope, message, data),

  /**
   * Get current log level
   */
  getLevel: getLogLevel,

  /**
   * Check if a level would be logged
   */
  isEnabled: shouldLog,
};

// Pre-created loggers for common modules (optional convenience)
export const serverLog = logger.scope('Server');
export const clientLog = logger.scope('Client');
export const authLog = logger.scope('Auth');
export const dbLog = logger.scope('Database');
export const apiLog = logger.scope('API');
