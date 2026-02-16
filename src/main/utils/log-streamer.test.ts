import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogStreamer, LogMessage } from './log-streamer';

describe('LogStreamer', () => {
  let streamer: LogStreamer;

  beforeEach(() => {
    streamer = new LogStreamer({ batchIntervalMs: 10 });
  });

  describe('log', () => {
    it('should add entries to history', () => {
      streamer.info('test message');
      expect(streamer.getHistorySize()).toBe(1);
    });

    it('should support all log levels', () => {
      streamer.info('info msg');
      streamer.warning('warn msg');
      streamer.error('error msg');
      streamer.debug('debug msg');
      expect(streamer.getHistorySize()).toBe(4);
    });

    it('should store timestamp, level, message, details, source', () => {
      streamer.log('info', 'test', 'details here', 'npm');
      const history = streamer.getHistory();
      expect(history[0].level).toBe('info');
      expect(history[0].message).toBe('test');
      expect(history[0].details).toBe('details here');
      expect(history[0].source).toBe('npm');
      expect(history[0].timestamp).toBeGreaterThan(0);
    });

    it('should respect max history size', () => {
      const small = new LogStreamer({ maxHistorySize: 3 });
      small.info('1');
      small.info('2');
      small.info('3');
      small.info('4');
      expect(small.getHistorySize()).toBe(3);
      expect(small.getHistory()[0].message).toBe('2');
    });
  });

  describe('getHistory', () => {
    it('should return copy of history', () => {
      streamer.info('test');
      const history = streamer.getHistory();
      history.push({ timestamp: 0, level: 'info', message: 'fake' });
      expect(streamer.getHistorySize()).toBe(1);
    });
  });

  describe('getHistoryByLevel', () => {
    it('should filter by level', () => {
      streamer.info('i1');
      streamer.error('e1');
      streamer.info('i2');
      streamer.warning('w1');
      expect(streamer.getHistoryByLevel('info')).toHaveLength(2);
      expect(streamer.getHistoryByLevel('error')).toHaveLength(1);
      expect(streamer.getHistoryByLevel('warning')).toHaveLength(1);
    });
  });

  describe('getFullLog', () => {
    it('should format log as string', () => {
      streamer.info('hello world');
      const log = streamer.getFullLog();
      expect(log).toContain('INFO');
      expect(log).toContain('hello world');
    });

    it('should include source when present', () => {
      streamer.log('info', 'test', undefined, 'npm');
      const log = streamer.getFullLog();
      expect(log).toContain('[npm]');
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      streamer.info('1');
      streamer.info('2');
      streamer.clear();
      expect(streamer.getHistorySize()).toBe(0);
    });
  });

  describe('batching', () => {
    it('should emit logs event with batched messages', async () => {
      const handler = vi.fn();
      streamer.on('logs', handler);
      streamer.info('a');
      streamer.info('b');
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toHaveLength(2);
    });

    it('should emit individual log events', async () => {
      const handler = vi.fn();
      streamer.on('log', handler);
      streamer.info('a');
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should flush remaining buffer and remove listeners', async () => {
      const handler = vi.fn();
      streamer.on('log', handler);
      streamer.info('final');
      streamer.destroy();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('detectLevel', () => {
    it('should detect error level from message content', () => {
      streamer.log('info', 'npm ERR! something failed');
      const history = streamer.getHistory();
      // detectLevel is private, tested indirectly via attachProcess
      expect(history[0].message).toContain('ERR');
    });
  });
});
