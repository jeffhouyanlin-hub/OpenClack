/**
 * feat-085-086: Analytics / telemetry tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryCollector } from './telemetry';

describe('TelemetryCollector', () => {
  let collector: TelemetryCollector;

  describe('when disabled (default)', () => {
    beforeEach(() => {
      collector = new TelemetryCollector();
    });

    it('should default to disabled', () => {
      expect(collector.isEnabled()).toBe(false);
    });

    it('should not collect events when disabled', () => {
      collector.track('test-event');
      expect(collector.getEvents()).toHaveLength(0);
    });

    it('should return empty array on flush when disabled', async () => {
      collector.track('test-event');
      const flushed = await collector.flush();
      expect(flushed).toHaveLength(0);
    });
  });

  describe('when enabled (opt-in)', () => {
    beforeEach(() => {
      collector = new TelemetryCollector({ enabled: true });
    });

    it('should report as enabled', () => {
      expect(collector.isEnabled()).toBe(true);
    });

    it('should collect events when enabled', () => {
      collector.track('install-started');
      expect(collector.getEvents()).toHaveLength(1);
      expect(collector.getEvents()[0].name).toBe('install-started');
    });

    it('should include timestamp on events', () => {
      const before = Date.now();
      collector.track('test');
      const after = Date.now();

      const event = collector.getEvents()[0];
      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });

    it('should include properties when provided', () => {
      collector.track('install-complete', {
        duration: 5000,
        success: true,
        platform: 'darwin',
      });

      const event = collector.getEvents()[0];
      expect(event.properties).toEqual({
        duration: 5000,
        success: true,
        platform: 'darwin',
      });
    });

    it('should collect multiple events', () => {
      collector.track('event-1');
      collector.track('event-2');
      collector.track('event-3');
      expect(collector.getEvents()).toHaveLength(3);
    });
  });

  describe('setEnabled', () => {
    it('should enable telemetry', () => {
      collector = new TelemetryCollector({ enabled: false });
      collector.setEnabled(true);
      expect(collector.isEnabled()).toBe(true);
    });

    it('should disable telemetry and clear events', () => {
      collector = new TelemetryCollector({ enabled: true });
      collector.track('test');
      collector.setEnabled(false);

      expect(collector.isEnabled()).toBe(false);
      expect(collector.getEvents()).toHaveLength(0);
    });
  });

  describe('getSessionId', () => {
    it('should return a session ID', () => {
      collector = new TelemetryCollector({ enabled: true });
      const sessionId = collector.getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId!.length).toBeGreaterThan(0);
    });

    it('should use provided session ID', () => {
      collector = new TelemetryCollector({ enabled: true, sessionId: 'custom-session' });
      expect(collector.getSessionId()).toBe('custom-session');
    });
  });

  describe('clear', () => {
    it('should clear all events', () => {
      collector = new TelemetryCollector({ enabled: true });
      collector.track('a');
      collector.track('b');
      collector.clear();
      expect(collector.getEvents()).toHaveLength(0);
    });
  });

  describe('flush', () => {
    it('should return and clear events', async () => {
      collector = new TelemetryCollector({ enabled: true });
      collector.track('event-1');
      collector.track('event-2');

      const flushed = await collector.flush();
      expect(flushed).toHaveLength(2);
      expect(collector.getEvents()).toHaveLength(0);
    });
  });

  describe('getEvents', () => {
    it('should return a copy of events array', () => {
      collector = new TelemetryCollector({ enabled: true });
      collector.track('test');
      const events = collector.getEvents();
      events.push({ name: 'fake', timestamp: 0 });
      expect(collector.getEvents()).toHaveLength(1);
    });
  });
});
