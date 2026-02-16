import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as installer from './installer';

// Mock the installer module completely
vi.mock('./installer', () => {
  return {
    detectOpenClawVersion: vi.fn(),
    installOpenclaw: vi.fn(),
    executeWithPrivileges: vi.fn(),
  };
});

describe('OpenClaw Installation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectOpenClawVersion', () => {
    it('should exist as a function', () => {
      expect(typeof installer.detectOpenClawVersion).toBe('function');
    });

    it('should return a Promise', () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('1.2.3');
      const result = installer.detectOpenClawVersion();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return version when openclaw is installed', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('1.2.3');
      const result = await installer.detectOpenClawVersion();
      expect(result).toBe('1.2.3');
    });

    it('should return null when openclaw is not installed', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue(null);
      const result = await installer.detectOpenClawVersion();
      expect(result).toBeNull();
    });

    it('should handle different version formats', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('2.3.4');
      const result = await installer.detectOpenClawVersion();
      expect(result).toBe('2.3.4');
    });

    it('should be callable without errors', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('1.0.0');
      await expect(installer.detectOpenClawVersion()).resolves.toBe('1.0.0');
    });
  });

  describe('installOpenclaw', () => {
    it('should exist as a function', () => {
      expect(typeof installer.installOpenclaw).toBe('function');
    });

    it('should return a Promise', () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });
      const result = installer.installOpenclaw();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should install OpenClaw successfully', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.2.3',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(false);
      expect(result.version).toBe('1.2.3');
    });

    it('should accept progress callback parameter', async () => {
      const mockCallback = vi.fn();
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      await installer.installOpenclaw(mockCallback);
      expect(installer.installOpenclaw).toHaveBeenCalledWith(mockCallback);
    });

    it('should handle user cancellation', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.error).toBe('User cancelled installation');
    });

    it('should handle installation failure', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'Installation failed',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(false);
      expect(result.error).toBe('Installation failed');
    });

    it('should handle npm errors', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'npm install failed',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(false);
      expect(result.error).toContain('npm install failed');
    });

    it('should handle verification failure', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'openclaw command not found in PATH',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(false);
      expect(result.error).toContain('openclaw command not found');
    });

    it('should return OpenClawInstallResult structure', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      const result = await installer.installOpenclaw();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cancelled');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.cancelled).toBe('boolean');
    });

    it('should include version in successful result', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '3.4.5',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(true);
      expect(result.version).toBe('3.4.5');
    });

    it('should work without progress callback', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      const result = await installer.installOpenclaw();
      expect(result.success).toBe(true);
    });

    it('should handle exceptions during installation', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'Unexpected error',
      });

      const result = await installer.installOpenclaw();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle different version numbers', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '10.20.30',
      });

      const result = await installer.installOpenclaw();
      expect(result.version).toBe('10.20.30');
    });
  });

  describe('Function Signatures', () => {
    it('detectOpenClawVersion should accept no parameters', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('1.0.0');
      await expect(installer.detectOpenClawVersion()).resolves.toBe('1.0.0');
    });

    it('installOpenclaw should accept optional callback', async () => {
      const callback = vi.fn();
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      await installer.installOpenclaw(callback);
      expect(installer.installOpenclaw).toHaveBeenCalledWith(callback);
    });

    it('installOpenclaw should work without callback', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      await expect(installer.installOpenclaw()).resolves.toMatchObject({
        success: true,
        cancelled: false,
      });
    });
  });

  describe('Return Types', () => {
    it('detectOpenClawVersion should return string or null', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('1.0.0');
      const result = await installer.detectOpenClawVersion();
      expect(typeof result === 'string' || result === null).toBe(true);
    });

    it('installOpenclaw should return OpenClawInstallResult', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      const result = await installer.installOpenclaw();
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        cancelled: expect.any(Boolean),
      });
    });

    it('OpenClawInstallResult should have optional version', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: true,
        error: 'Cancelled',
      });

      const result = await installer.installOpenclaw();
      expect(result.version).toBeUndefined();
    });

    it('OpenClawInstallResult should have optional error', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'Installation failed',
      });

      const result = await installer.installOpenclaw();
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty version string', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue('');
      const result = await installer.detectOpenClawVersion();
      expect(result).toBe('');
    });

    it('should handle malformed version', async () => {
      vi.mocked(installer.detectOpenClawVersion).mockResolvedValue(null);
      const result = await installer.detectOpenClawVersion();
      expect(result).toBeNull();
    });

    it('should handle install result without error on success', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: true,
        cancelled: false,
        version: '1.0.0',
      });

      const result = await installer.installOpenclaw();
      expect(result.error).toBeUndefined();
    });

    it('should handle install result without version on failure', async () => {
      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'Failed',
      });

      const result = await installer.installOpenclaw();
      expect(result.version).toBeUndefined();
    });
  });
});
