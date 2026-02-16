/**
 * feat-076-078: Platform-specific features tests
 */
import { describe, it, expect } from 'vitest';
import {
  detectPlatform,
  getDefaultInstallPath,
  getConfigDir,
  requiresElevation,
  getShellCommand,
} from './platform-features';

describe('platform-features', () => {
  describe('detectPlatform', () => {
    it('should return platform info object', () => {
      const info = detectPlatform();
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('release');
      expect(info).toHaveProperty('isSupported');
      expect(info).toHaveProperty('displayName');
    });

    it('should detect a valid platform', () => {
      const info = detectPlatform();
      expect(['darwin', 'win32', 'linux']).toContain(info.platform);
    });

    it('should report as supported for known platforms', () => {
      const info = detectPlatform();
      expect(info.isSupported).toBe(true);
    });

    it('should have a display name', () => {
      const info = detectPlatform();
      expect(['macOS', 'Windows', 'Linux']).toContain(info.displayName);
    });

    it('should detect a valid architecture', () => {
      const info = detectPlatform();
      expect(typeof info.arch).toBe('string');
      expect(info.arch.length).toBeGreaterThan(0);
    });

    it('should have a release string', () => {
      const info = detectPlatform();
      expect(typeof info.release).toBe('string');
      expect(info.release.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultInstallPath', () => {
    it('should return a non-empty string', () => {
      const path = getDefaultInstallPath();
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });

    it('should return a path appropriate for the current platform', () => {
      const path = getDefaultInstallPath();
      const p = process.platform;
      if (p === 'win32') {
        expect(path).toContain('Program Files');
      } else {
        expect(path).toContain('/usr/local');
      }
    });
  });

  describe('getConfigDir', () => {
    it('should return a non-empty string', () => {
      const dir = getConfigDir();
      expect(typeof dir).toBe('string');
      expect(dir.length).toBeGreaterThan(0);
    });

    it('should contain openclaw reference', () => {
      const dir = getConfigDir().toLowerCase();
      expect(dir).toMatch(/openclaw/i);
    });
  });

  describe('requiresElevation', () => {
    it('should return a boolean', () => {
      const result = requiresElevation();
      expect(typeof result).toBe('boolean');
    });

    it('should require elevation on all supported platforms', () => {
      // All supported platforms require elevation for system-level install
      expect(requiresElevation()).toBe(true);
    });
  });

  describe('getShellCommand', () => {
    it('should return a non-empty string', () => {
      const shell = getShellCommand();
      expect(typeof shell).toBe('string');
      expect(shell.length).toBeGreaterThan(0);
    });

    it('should return appropriate shell for platform', () => {
      const shell = getShellCommand();
      const p = process.platform;
      if (p === 'win32') {
        expect(shell).toContain('powershell');
      } else {
        expect(shell).toContain('bash');
      }
    });
  });
});
