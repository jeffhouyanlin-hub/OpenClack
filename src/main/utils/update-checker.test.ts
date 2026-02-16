/**
 * feat-083-084: Auto-update tests
 */
import { describe, it, expect } from 'vitest';
import {
  getCurrentVersion,
  checkForUpdates,
  compareVersions,
  shouldAutoUpdate,
  UpdateInfo,
} from './update-checker';

describe('update-checker', () => {
  describe('getCurrentVersion', () => {
    it('should return a version string', () => {
      const version = getCurrentVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('checkForUpdates', () => {
    it('should return an UpdateInfo object', async () => {
      const result = await checkForUpdates();
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('currentVersion');
    });

    it('should include the current version', async () => {
      const result = await checkForUpdates('1.0.0');
      expect(result.currentVersion).toBe('1.0.0');
    });

    it('should return not available in stub mode', async () => {
      const result = await checkForUpdates();
      expect(result.available).toBe(false);
    });

    it('should use provided version', async () => {
      const result = await checkForUpdates('2.5.0');
      expect(result.currentVersion).toBe('2.5.0');
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should return -1 when a < b (major)', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should return 1 when a > b (major)', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    });

    it('should compare minor versions', () => {
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
      expect(compareVersions('1.3.0', '1.2.0')).toBe(1);
    });

    it('should compare patch versions', () => {
      expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
      expect(compareVersions('1.0.3', '1.0.2')).toBe(1);
    });

    it('should handle different length versions', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    });
  });

  describe('shouldAutoUpdate', () => {
    it('should return true when update available and auto-update enabled', () => {
      const info: UpdateInfo = {
        available: true,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
      };
      expect(shouldAutoUpdate(info, true)).toBe(true);
    });

    it('should return false when auto-update disabled', () => {
      const info: UpdateInfo = {
        available: true,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
      };
      expect(shouldAutoUpdate(info, false)).toBe(false);
    });

    it('should return false when no update available', () => {
      const info: UpdateInfo = {
        available: false,
        currentVersion: '1.0.0',
      };
      expect(shouldAutoUpdate(info, true)).toBe(false);
    });
  });
});
