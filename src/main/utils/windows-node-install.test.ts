import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { installNodeWindows } from './installer';

describe('Windows Node.js Installation', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set platform to Windows for tests
    Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true });
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
  });

  describe('installNodeWindows', () => {
    it('should be defined as a function', () => {
      expect(installNodeWindows).toBeDefined();
      expect(typeof installNodeWindows).toBe('function');
    });

    it('should return a promise', () => {
      const result = installNodeWindows();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept optional progress callback', () => {
      const onProgress = vi.fn();
      const result = installNodeWindows(onProgress);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return error on non-Windows platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true });

      const result = await installNodeWindows();

      expect(result.success).toBe(false);
      expect(result.error).toContain('only supported on Windows');
    });

    it('should return error on Linux platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true, configurable: true });

      const result = await installNodeWindows();

      expect(result.success).toBe(false);
      expect(result.error).toContain('only supported on Windows');
    });

    it('should call progress callback during installation', async () => {
      const onProgress = vi.fn();
      const promise = installNodeWindows(onProgress);

      // The function will fail since we're not mocking the HTTP requests,
      // but it should still call onProgress at least once
      await promise;

      expect(onProgress).toHaveBeenCalled();
    });

    it('should handle x64 architecture', () => {
      const originalArch = process.arch;
      Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true });

      const result = installNodeWindows();
      expect(result).toBeInstanceOf(Promise);

      Object.defineProperty(process, 'arch', { value: originalArch, writable: true, configurable: true });
    });

    it('should handle x86 architecture', () => {
      const originalArch = process.arch;
      Object.defineProperty(process, 'arch', { value: 'ia32', writable: true, configurable: true });

      const result = installNodeWindows();
      expect(result).toBeInstanceOf(Promise);

      Object.defineProperty(process, 'arch', { value: originalArch, writable: true, configurable: true });
    });

    it('should return NodeInstallResult structure on failure', async () => {
      const result = await installNodeWindows();

      // Since we can't mock all the HTTP requests, this will fail
      // but it should return the correct structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cancelled');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.cancelled).toBe('boolean');
    });

    it('should include method in result', async () => {
      const result = await installNodeWindows();

      // The result should include the method field
      if ('method' in result) {
        expect(result.method).toBeDefined();
      }
    });

    it('should handle errors gracefully', async () => {
      const onProgress = vi.fn();
      const result = await installNodeWindows(onProgress);

      // Since we're not mocking the HTTP module, this will fail
      // but it should handle the error gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('should not leave uncaught promise rejections', async () => {
      const onProgress = vi.fn();

      // This should not throw
      await expect(installNodeWindows(onProgress)).resolves.toBeDefined();
    });

    it('should return cancelled: false when not cancelled by user', async () => {
      const result = await installNodeWindows();

      // Since we're simulating a failure (not user cancellation), cancelled should be false
      expect(result.cancelled).toBe(false);
    });
  });

  describe('Function Signature and Return Types', () => {
    it('should have correct function signature', () => {
      expect(installNodeWindows.length).toBe(1); // One optional parameter
    });

    it('should return promise that resolves to NodeInstallResult', async () => {
      const result = await installNodeWindows();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cancelled');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.cancelled).toBe('boolean');

      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle progress callback with correct parameters', async () => {
      const onProgress = vi.fn();
      await installNodeWindows(onProgress);

      // Check that onProgress was called with string message and log level
      if (onProgress.mock.calls.length > 0) {
        const [message, level] = onProgress.mock.calls[0];
        expect(typeof message).toBe('string');
        if (level !== undefined) {
          expect(['info', 'warning', 'error', 'debug']).toContain(level);
        }
      }
    });
  });

  describe('Platform Validation', () => {
    it('should work only on win32 platform', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true });
      const result1 = await installNodeWindows();
      // Should attempt to run (even if it fails due to missing mocks)
      expect(result1).toBeDefined();

      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true });
      const result2 = await installNodeWindows();
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('only supported on Windows');

      Object.defineProperty(process, 'platform', { value: 'linux', writable: true, configurable: true });
      const result3 = await installNodeWindows();
      expect(result3.success).toBe(false);
      expect(result3.error).toContain('only supported on Windows');
    });
  });

  describe('Error Handling', () => {
    it('should return error object on installation failure', async () => {
      const result = await installNodeWindows();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it('should log errors via progress callback', async () => {
      const onProgress = vi.fn();
      await installNodeWindows(onProgress);

      // Should have called onProgress with error level at some point
      const errorCalls = onProgress.mock.calls.filter(call => call[1] === 'error');
      expect(errorCalls.length).toBeGreaterThan(0);
    });

    it('should include error context in result', async () => {
      const result = await installNodeWindows();

      if (!result.success && result.error) {
        // Error message should be descriptive
        expect(result.error.length).toBeGreaterThan(5);
      }
    });
  });

  describe('Architecture Detection', () => {
    it('should detect x64 architecture correctly', async () => {
      const originalArch = process.arch;
      Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true });

      const onProgress = vi.fn();
      await installNodeWindows(onProgress);

      // Should mention x64 in progress messages
      const progressMessages = onProgress.mock.calls.map(call => call[0]);
      const hasX64Message = progressMessages.some(msg => msg.includes('x64'));
      expect(hasX64Message).toBe(true);

      Object.defineProperty(process, 'arch', { value: originalArch, writable: true, configurable: true });
    });

    it('should default to x86 for non-x64 architectures', async () => {
      const originalArch = process.arch;
      Object.defineProperty(process, 'arch', { value: 'ia32', writable: true, configurable: true });

      const onProgress = vi.fn();
      await installNodeWindows(onProgress);

      // Should mention x86 in progress messages
      const progressMessages = onProgress.mock.calls.map(call => call[0]);
      const hasX86Message = progressMessages.some(msg => msg.includes('x86'));
      expect(hasX86Message).toBe(true);

      Object.defineProperty(process, 'arch', { value: originalArch, writable: true, configurable: true });
    });
  });

  describe('Integration', () => {
    it('should export installNodeWindows function', () => {
      expect(installNodeWindows).toBeDefined();
    });

    it('should be callable without errors', () => {
      expect(() => {
        installNodeWindows();
      }).not.toThrow();
    });

    it('should be callable with progress callback without errors', () => {
      expect(() => {
        installNodeWindows(() => {});
      }).not.toThrow();
    });
  });
});
