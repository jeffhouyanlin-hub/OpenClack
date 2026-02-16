import { describe, it, expect, vi } from 'vitest';
import { categorizeError, withRetry, checkPlatformSupport } from './error-handler';

describe('Error Handler', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const err = categorizeError('ENOTFOUND: getaddrinfo ENOTFOUND nodejs.org');
      expect(err.category).toBe('network');
      expect(err.retryable).toBe(true);
      expect(err.code).toBe('NETWORK_ERROR');
    });

    it('should categorize download errors', () => {
      const err = categorizeError('Download failed with status code 404');
      expect(err.category).toBe('network');
    });

    it('should categorize connection timeout', () => {
      const err = categorizeError('ETIMEDOUT: connection timed out');
      expect(err.category).toBe('network');
    });

    it('should categorize permission errors', () => {
      const err = categorizeError('EACCES: permission denied');
      expect(err.category).toBe('permission');
      expect(err.retryable).toBe(true);
    });

    it('should categorize authentication cancelled', () => {
      const err = categorizeError('User cancelled authentication');
      expect(err.category).toBe('permission');
      expect(err.code).toBe('AUTH_CANCELLED');
    });

    it('should categorize disk space errors', () => {
      const err = categorizeError('ENOSPC: no space left on device');
      expect(err.category).toBe('disk');
      expect(err.retryable).toBe(true);
    });

    it('should categorize command not found errors', () => {
      const err = categorizeError('ENOENT: spawn node ENOENT');
      expect(err.category).toBe('command');
    });

    it('should categorize validation errors', () => {
      const err = categorizeError('Invalid API key format');
      expect(err.category).toBe('validation');
      expect(err.retryable).toBe(false);
    });

    it('should categorize platform errors', () => {
      const err = categorizeError('Unsupported platform: freebsd');
      expect(err.category).toBe('platform');
      expect(err.recoverable).toBe(false);
    });

    it('should handle unknown errors', () => {
      const err = categorizeError('something completely unexpected');
      expect(err.category).toBe('unknown');
      expect(err.retryable).toBe(true);
    });

    it('should accept Error objects', () => {
      const err = categorizeError(new Error('ENOTFOUND'));
      expect(err.category).toBe('network');
    });

    it('should provide actionable messages', () => {
      const err = categorizeError('ENOTFOUND');
      expect(err.actionableMessage).toBeTruthy();
      expect(err.actionableMessage.length).toBeGreaterThan(10);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValue('success');
      const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));
      await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 }))
        .rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();
      await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 }, onRetry);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry.mock.calls[0][0]).toBe(1);
    });

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();
      await withRetry(fn, { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 5000 }, onRetry);
      expect(onRetry.mock.calls[0][2]).toBe(100);  // 100 * 2^0
      expect(onRetry.mock.calls[1][2]).toBe(200);  // 100 * 2^1
    });

    it('should cap delay at maxDelayMs', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();
      await withRetry(fn, { maxRetries: 3, baseDelayMs: 50000, maxDelayMs: 100 }, onRetry);
      expect(onRetry.mock.calls[0][2]).toBe(100);
    });
  });

  describe('checkPlatformSupport', () => {
    it('should return platform info', () => {
      const info = checkPlatformSupport();
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('osVersion');
    });

    it('should mark current platform as supported', () => {
      const info = checkPlatformSupport();
      // Running on macOS in test, so it should be supported
      expect(info.supported).toBe(true);
    });

    it('should include platform and arch', () => {
      const info = checkPlatformSupport();
      expect(typeof info.platform).toBe('string');
      expect(typeof info.arch).toBe('string');
    });
  });
});
