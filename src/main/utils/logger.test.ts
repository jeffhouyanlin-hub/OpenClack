import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './logger';
import { join } from 'path';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';

describe('Logger', () => {
  let logger: Logger;
  let testLogDir: string;

  beforeEach(() => {
    testLogDir = join(tmpdir(), `openclack-test-logs-${Date.now()}`);
    logger = new Logger({ logDir: testLogDir, minLevel: 'debug' });
  });

  afterEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup
    }
  });

  describe('constructor', () => {
    it('should create logger with default options', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger.getLogDir()).toContain('.openclaw');
    });

    it('should accept custom log directory', () => {
      expect(logger.getLogDir()).toBe(testLogDir);
    });
  });

  describe('write', () => {
    it('should create log directory and write entries', async () => {
      await logger.info('test message');
      const logFile = logger.getCurrentLogFile();
      const content = await fs.readFile(logFile, 'utf-8');
      expect(content).toContain('test message');
      expect(content).toContain('INFO');
    });

    it('should write all log levels', async () => {
      await logger.debug('debug msg');
      await logger.info('info msg');
      await logger.warning('warn msg');
      await logger.error('error msg');
      const logFile = logger.getCurrentLogFile();
      const content = await fs.readFile(logFile, 'utf-8');
      expect(content).toContain('DEBUG');
      expect(content).toContain('INFO');
      expect(content).toContain('WARNING');
      expect(content).toContain('ERROR');
    });

    it('should include details when provided', async () => {
      await logger.error('failed', 'stack trace here');
      const content = await fs.readFile(logger.getCurrentLogFile(), 'utf-8');
      expect(content).toContain('stack trace here');
    });

    it('should include timestamp', async () => {
      await logger.info('timestamped');
      const content = await fs.readFile(logger.getCurrentLogFile(), 'utf-8');
      // ISO timestamp pattern
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('minLevel', () => {
    it('should filter out messages below min level', async () => {
      const warnLogger = new Logger({ logDir: testLogDir, minLevel: 'warning' });
      await warnLogger.debug('should not appear');
      await warnLogger.info('should not appear');
      await warnLogger.warning('should appear');
      await warnLogger.error('should appear');
      const content = await fs.readFile(warnLogger.getCurrentLogFile(), 'utf-8');
      expect(content).not.toContain('should not appear');
      expect(content).toContain('should appear');
    });
  });

  describe('getCurrentLogFile', () => {
    it('should return path with date', () => {
      const logFile = logger.getCurrentLogFile();
      expect(logFile).toContain('openclack-');
      expect(logFile).toContain('.log');
    });
  });

  describe('getLogDir', () => {
    it('should return the log directory', () => {
      expect(logger.getLogDir()).toBe(testLogDir);
    });
  });
});
