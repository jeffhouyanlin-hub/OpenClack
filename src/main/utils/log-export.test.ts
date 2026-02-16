import { describe, it, expect } from 'vitest';
import { exportLogs, getSystemInfoBlock } from './log-export';

describe('log-export', () => {
  describe('getSystemInfoBlock', () => {
    it('should return system info as a string', () => {
      const info = getSystemInfoBlock();
      expect(info).toContain('=== OpenClack System Information ===');
      expect(info).toContain('Platform:');
      expect(info).toContain('Architecture:');
      expect(info).toContain('OS Release:');
      expect(info).toContain('Total Memory:');
      expect(info).toContain('Free Memory:');
      expect(info).toContain('Node.js:');
      expect(info).toContain('=== End System Information ===');
    });

    it('should include app version when provided', () => {
      const info = getSystemInfoBlock('1.2.3');
      expect(info).toContain('App Version: 1.2.3');
    });

    it('should not include app version when not provided', () => {
      const info = getSystemInfoBlock();
      expect(info).not.toContain('App Version:');
    });

    it('should include a date in ISO format', () => {
      const info = getSystemInfoBlock();
      // Match ISO date pattern
      expect(info).toMatch(/Date: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('exportLogs', () => {
    it('should package logs with system info', () => {
      const result = exportLogs({
        logs: ['[INFO] Starting install', '[INFO] Complete'],
      });

      expect(result.content).toContain('=== OpenClack System Information ===');
      expect(result.content).toContain('=== Installation Logs ===');
      expect(result.content).toContain('[INFO] Starting install');
      expect(result.content).toContain('[INFO] Complete');
      expect(result.content).toContain('=== End of Log Export ===');
    });

    it('should generate a filename with timestamp', () => {
      const result = exportLogs({ logs: [] });
      expect(result.filename).toMatch(/^openclack-logs-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.txt$/);
    });

    it('should return a timestamp', () => {
      const before = Date.now();
      const result = exportLogs({ logs: [] });
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle empty logs', () => {
      const result = exportLogs({ logs: [] });
      expect(result.content).toContain('(No logs recorded)');
    });

    it('should include app version in system info when provided', () => {
      const result = exportLogs({
        logs: ['test'],
        appVersion: '2.0.0',
      });
      expect(result.content).toContain('App Version: 2.0.0');
    });

    it('should skip system info when includeSystemInfo is false', () => {
      const result = exportLogs({
        logs: ['test log'],
        includeSystemInfo: false,
      });
      expect(result.content).not.toContain('=== OpenClack System Information ===');
      expect(result.content).toContain('=== Installation Logs ===');
      expect(result.content).toContain('test log');
    });

    it('should include all provided log entries', () => {
      const logs = Array.from({ length: 50 }, (_, i) => `Log entry ${i}`);
      const result = exportLogs({ logs });

      for (const log of logs) {
        expect(result.content).toContain(log);
      }
    });
  });
});
