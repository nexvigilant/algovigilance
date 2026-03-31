/**
 * Logger Unit Tests
 *
 * Tests the structured logging utility including log level filtering,
 * scoped loggers, and data sanitization.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// We test the logger behavior through its exported interface
// Mocking console methods to capture output
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log,
};

describe('Logger', () => {
  let consoleOutput: { method: string; args: unknown[] }[];

  beforeEach(() => {
    consoleOutput = [];

    // Mock all console methods
    console.debug = jest.fn((...args) => {
      consoleOutput.push({ method: 'debug', args });
    });
    console.info = jest.fn((...args) => {
      consoleOutput.push({ method: 'info', args });
    });
    console.warn = jest.fn((...args) => {
      consoleOutput.push({ method: 'warn', args });
    });
    console.error = jest.fn((...args) => {
      consoleOutput.push({ method: 'error', args });
    });
    console.log = jest.fn((...args) => {
      consoleOutput.push({ method: 'log', args });
    });

    // Reset module cache to get fresh logger instance
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
  });

  describe('Scoped Logger', () => {
    it('should create a scoped logger with module name', async () => {
      // Set log level to debug to capture all logs
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('TestModule');

      log.info('Test message');

      expect(consoleOutput.length).toBeGreaterThan(0);
      expect(consoleOutput[0].args[0]).toContain('[TestModule]');
    });

    it('should include timestamp in log output', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('TimestampTest');

      log.info('Test message');

      expect(consoleOutput.length).toBeGreaterThan(0);
      // ISO timestamp format
      expect(consoleOutput[0].args[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should support debug level', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('DebugTest');

      log.debug('Debug message');

      expect(consoleOutput.some(o => o.method === 'debug')).toBe(true);
    });

    it('should support info level', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('InfoTest');

      log.info('Info message');

      expect(consoleOutput.some(o => o.method === 'info')).toBe(true);
    });

    it('should support warn level', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('WarnTest');

      log.warn('Warning message');

      expect(consoleOutput.some(o => o.method === 'warn')).toBe(true);
    });

    it('should support error level', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('ErrorTest');

      log.error('Error message');

      expect(consoleOutput.some(o => o.method === 'error')).toBe(true);
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect debug level (shows all)', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('LevelTest');

      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');

      expect(consoleOutput.length).toBe(4);
    });

    it('should respect info level (hides debug)', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'info';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('LevelTest');

      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');

      expect(consoleOutput.some(o => o.method === 'debug')).toBe(false);
      expect(consoleOutput.some(o => o.method === 'info')).toBe(true);
    });

    it('should respect warn level (hides debug and info)', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'warn';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('LevelTest');

      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');

      expect(consoleOutput.some(o => o.method === 'debug')).toBe(false);
      expect(consoleOutput.some(o => o.method === 'info')).toBe(false);
      expect(consoleOutput.some(o => o.method === 'warn')).toBe(true);
      expect(consoleOutput.some(o => o.method === 'error')).toBe(true);
    });

    it('should respect error level (only errors)', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'error';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('LevelTest');

      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');

      expect(consoleOutput.length).toBe(1);
      expect(consoleOutput[0].method).toBe('error');
    });

    it('should respect silent level (no output)', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'silent';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('LevelTest');

      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');

      expect(consoleOutput.length).toBe(0);
    });
  });

  describe('Data Logging', () => {
    it('should log data objects', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('DataTest');

      const data = { userId: '123', action: 'login' };
      log.info('User action', data);

      expect(consoleOutput.length).toBeGreaterThan(0);
      expect(consoleOutput[0].args.length).toBe(2);
    });

    it('should handle Error objects', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('ErrorTest');

      const error = new Error('Test error');
      log.error('Something failed', error);

      expect(consoleOutput.length).toBeGreaterThan(0);
      // Second argument should be sanitized error
      expect(consoleOutput[0].args[1]).toHaveProperty('name');
      expect(consoleOutput[0].args[1]).toHaveProperty('message');
    });

    it('should handle null data', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('NullTest');

      log.info('Message with null', null);

      expect(consoleOutput.length).toBeGreaterThan(0);
    });

    it('should handle undefined data', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      const log = logger.scope('UndefinedTest');

      log.info('Message with undefined', undefined);

      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });

  describe('Direct Logger Methods', () => {
    it('should support direct debug method', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      logger.debug('DirectScope', 'Direct debug message');

      expect(consoleOutput.some(o => o.args[0].includes('[DirectScope]'))).toBe(true);
    });

    it('should support direct info method', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      logger.info('DirectScope', 'Direct info message');

      expect(consoleOutput.some(o => o.args[0].includes('[DirectScope]'))).toBe(true);
    });

    it('should support direct warn method', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      logger.warn('DirectScope', 'Direct warn message');

      expect(consoleOutput.some(o => o.args[0].includes('[DirectScope]'))).toBe(true);
    });

    it('should support direct error method', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { logger } = await import('@/lib/logger');
      logger.error('DirectScope', 'Direct error message');

      expect(consoleOutput.some(o => o.args[0].includes('[DirectScope]'))).toBe(true);
    });
  });

  describe('Pre-created Loggers', () => {
    it('should export serverLog', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { serverLog } = await import('@/lib/logger');
      serverLog.info('Server message');

      expect(consoleOutput.some(o => o.args[0].includes('[Server]'))).toBe(true);
    });

    it('should export authLog', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { authLog } = await import('@/lib/logger');
      authLog.info('Auth message');

      expect(consoleOutput.some(o => o.args[0].includes('[Auth]'))).toBe(true);
    });

    it('should export dbLog', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { dbLog } = await import('@/lib/logger');
      dbLog.info('Database message');

      expect(consoleOutput.some(o => o.args[0].includes('[Database]'))).toBe(true);
    });

    it('should export apiLog', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const { apiLog } = await import('@/lib/logger');
      apiLog.info('API message');

      expect(consoleOutput.some(o => o.args[0].includes('[API]'))).toBe(true);
    });
  });

  describe('Logger Utility Methods', () => {
    it('should expose getLevel method', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'warn';

      const { logger } = await import('@/lib/logger');
      const level = logger.getLevel();

      expect(level).toBe('warn');
    });

    it('should expose isEnabled method', async () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'warn';

      const { logger } = await import('@/lib/logger');

      expect(logger.isEnabled('debug')).toBe(false);
      expect(logger.isEnabled('info')).toBe(false);
      expect(logger.isEnabled('warn')).toBe(true);
      expect(logger.isEnabled('error')).toBe(true);
    });
  });
});
