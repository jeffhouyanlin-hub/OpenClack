/**
 * feat-075: Efficient log streaming test
 * Verifies batching, buffer limits, and virtualized-list-ready output
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogStreamer } from './log-streamer';

describe('LogStreamer - Efficient Streaming (feat-075)', () => {
  let streamer: LogStreamer;

  beforeEach(() => {
    streamer = new LogStreamer({ batchIntervalMs: 10, maxHistorySize: 100 });
  });

  describe('batching behavior', () => {
    it('should batch multiple rapid logs into a single emit', async () => {
      const batchHandler = vi.fn();
      streamer.on('logs', batchHandler);

      // Add several logs rapidly
      streamer.info('msg 1');
      streamer.info('msg 2');
      streamer.info('msg 3');
      streamer.info('msg 4');
      streamer.info('msg 5');

      // Wait for batch flush
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should have been batched into one emission
      expect(batchHandler).toHaveBeenCalledTimes(1);
      expect(batchHandler.mock.calls[0][0]).toHaveLength(5);
    });

    it('should flush separate batches for logs added after interval', async () => {
      const batchHandler = vi.fn();
      streamer.on('logs', batchHandler);

      streamer.info('batch 1');
      await new Promise(resolve => setTimeout(resolve, 50));

      streamer.info('batch 2');
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(batchHandler).toHaveBeenCalledTimes(2);
      expect(batchHandler.mock.calls[0][0]).toHaveLength(1);
      expect(batchHandler.mock.calls[1][0]).toHaveLength(1);
    });

    it('should not emit when no logs are added', async () => {
      const batchHandler = vi.fn();
      streamer.on('logs', batchHandler);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(batchHandler).not.toHaveBeenCalled();
    });
  });

  describe('buffer limits', () => {
    it('should enforce max history size', () => {
      const small = new LogStreamer({ maxHistorySize: 10, batchIntervalMs: 10 });

      for (let i = 0; i < 25; i++) {
        small.info(`message ${i}`);
      }

      expect(small.getHistorySize()).toBe(10);
    });

    it('should drop oldest entries when buffer overflows', () => {
      const small = new LogStreamer({ maxHistorySize: 5, batchIntervalMs: 10 });

      for (let i = 0; i < 10; i++) {
        small.info(`message ${i}`);
      }

      const history = small.getHistory();
      expect(history[0].message).toBe('message 5');
      expect(history[4].message).toBe('message 9');
    });

    it('should handle large burst of logs efficiently', () => {
      const large = new LogStreamer({ maxHistorySize: 10000, batchIntervalMs: 10 });

      const start = Date.now();
      for (let i = 0; i < 5000; i++) {
        large.info(`bulk log ${i}`);
      }
      const elapsed = Date.now() - start;

      expect(large.getHistorySize()).toBe(5000);
      // Should process 5000 logs in under 1 second
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe('virtualized-list-ready output', () => {
    it('should return history as array suitable for virtual list rendering', () => {
      streamer.info('line 1');
      streamer.warning('line 2');
      streamer.error('line 3');

      const history = streamer.getHistory();

      // Each entry should have all fields needed for rendering
      for (const entry of history) {
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('level');
        expect(entry).toHaveProperty('message');
        expect(typeof entry.timestamp).toBe('number');
        expect(['info', 'warning', 'error', 'debug']).toContain(entry.level);
        expect(typeof entry.message).toBe('string');
      }
    });

    it('should return history that can be sliced for windowed rendering', () => {
      for (let i = 0; i < 50; i++) {
        streamer.info(`log ${i}`);
      }

      const history = streamer.getHistory();
      // Simulate virtual list: render only items 10-20
      const window = history.slice(10, 20);
      expect(window).toHaveLength(10);
      expect(window[0].message).toBe('log 10');
      expect(window[9].message).toBe('log 19');
    });

    it('should return a copy of history to prevent external mutation', () => {
      streamer.info('original');
      const history = streamer.getHistory();
      history.push({ timestamp: 0, level: 'info', message: 'injected' });

      expect(streamer.getHistorySize()).toBe(1);
    });

    it('should support filtering by level for level-filtered views', () => {
      streamer.info('info 1');
      streamer.error('error 1');
      streamer.warning('warn 1');
      streamer.info('info 2');
      streamer.error('error 2');

      const errors = streamer.getHistoryByLevel('error');
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('error 1');
      expect(errors[1].message).toBe('error 2');
    });
  });

  describe('full log export format', () => {
    it('should produce formatted log string', () => {
      streamer.info('test line');
      const fullLog = streamer.getFullLog();

      expect(fullLog).toContain('INFO');
      expect(fullLog).toContain('test line');
      // Should contain ISO timestamp
      expect(fullLog).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('should include source tags when present', () => {
      streamer.log('info', 'installing', undefined, 'npm');
      const fullLog = streamer.getFullLog();
      expect(fullLog).toContain('[npm]');
    });
  });

  describe('cleanup', () => {
    it('should flush and clean up on destroy', () => {
      const handler = vi.fn();
      streamer.on('logs', handler);

      streamer.info('final message');
      streamer.destroy();

      // Should have flushed the remaining buffer
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should clear all history on clear()', () => {
      streamer.info('a');
      streamer.info('b');
      streamer.clear();

      expect(streamer.getHistorySize()).toBe(0);
      expect(streamer.getHistory()).toEqual([]);
    });
  });
});
