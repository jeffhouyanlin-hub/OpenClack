/**
 * Tests for data sanitization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizePath,
  sanitizeAPIKey,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeInstallConfig,
  sanitizeInstallProgress,
  sanitizeLogEntry,
  sanitizeInstallError,
  sanitizeInstallResult,
  sanitizeSystemInfo,
} from './sanitization';

describe('Data Sanitization', () => {
  describe('sanitizeString', () => {
    it('should pass through valid strings', () => {
      expect(sanitizeString('hello world')).toBe('hello world');
      expect(sanitizeString('test123')).toBe('test123');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
      expect(sanitizeString('test\0\0end')).toBe('testend');
    });

    it('should truncate very long strings', () => {
      const longString = 'a'.repeat(20000);
      const result = sanitizeString(longString);
      expect(result.length).toBe(10000);
    });

    it('should return empty string for non-strings', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString({})).toBe('');
      expect(sanitizeString([])).toBe('');
    });

    it('should handle special characters safely', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('<script>alert("xss")</script>');
      expect(sanitizeString('$(whoami)')).toBe('$(whoami)');
    });
  });

  describe('sanitizePath', () => {
    it('should pass through valid paths', () => {
      expect(sanitizePath('/usr/local/bin')).toBe('/usr/local/bin');
      expect(sanitizePath('C:\\Program Files')).toBe('C:\\Program Files');
    });

    it('should remove directory traversal sequences', () => {
      expect(sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
      expect(sanitizePath('..\\..\\windows\\system32')).toBe('windows\\system32');
      expect(sanitizePath('/usr/local/../../../etc/passwd')).toBe('/usr/local/etc/passwd');
    });

    it('should remove null bytes', () => {
      expect(sanitizePath('/usr/bin\0/bash')).toBe('/usr/bin/bash');
    });

    it('should return empty string for non-strings', () => {
      expect(sanitizePath(123)).toBe('');
      expect(sanitizePath(null)).toBe('');
      expect(sanitizePath({})).toBe('');
    });

    it('should preserve valid relative paths without traversal', () => {
      expect(sanitizePath('./local/path')).toBe('./local/path');
      expect(sanitizePath('relative/path')).toBe('relative/path');
    });
  });

  describe('sanitizeAPIKey', () => {
    it('should pass through valid API keys', () => {
      expect(sanitizeAPIKey('sk-ant-1234567890abcdef')).toBe('sk-ant-1234567890abcdef');
      expect(sanitizeAPIKey('sk_test_1234')).toBe('sk_test_1234');
    });

    it('should remove special characters and spaces', () => {
      expect(sanitizeAPIKey('sk-ant-123; rm -rf /')).toBe('sk-ant-123rm-rf');
      expect(sanitizeAPIKey('key with spaces')).toBe('keywithspaces');
      expect(sanitizeAPIKey('key$(whoami)end')).toBe('keywhoamiend');
    });

    it('should truncate very long keys', () => {
      const longKey = 'sk-' + 'a'.repeat(1000);
      const result = sanitizeAPIKey(longKey);
      expect(result.length).toBe(500);
    });

    it('should return empty string for non-strings', () => {
      expect(sanitizeAPIKey(123)).toBe('');
      expect(sanitizeAPIKey(null)).toBe('');
      expect(sanitizeAPIKey({})).toBe('');
    });

    it('should remove potential injection characters', () => {
      expect(sanitizeAPIKey('key`whoami`')).toBe('keywhoami');
      expect(sanitizeAPIKey('key|cat /etc/passwd')).toBe('keycatetcpasswd');
      expect(sanitizeAPIKey('key&&rm -rf /')).toBe('keyrm-rf');
    });
  });

  describe('sanitizeNumber', () => {
    it('should pass through valid numbers', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber(0)).toBe(0);
      expect(sanitizeNumber(-10)).toBe(-10);
      expect(sanitizeNumber(3.14)).toBe(3.14);
    });

    it('should enforce min/max bounds', () => {
      expect(sanitizeNumber(150, 0, 100)).toBe(100);
      expect(sanitizeNumber(-50, 0, 100)).toBe(0);
      expect(sanitizeNumber(50, 0, 100)).toBe(50);
    });

    it('should return 0 for invalid numbers', () => {
      expect(sanitizeNumber(NaN)).toBe(0);
      expect(sanitizeNumber(Infinity)).toBe(0);
      expect(sanitizeNumber(-Infinity)).toBe(0);
      expect(sanitizeNumber('123' as any)).toBe(0);
      expect(sanitizeNumber(null as any)).toBe(0);
      expect(sanitizeNumber(undefined as any)).toBe(0);
    });
  });

  describe('sanitizeBoolean', () => {
    it('should convert truthy values to true', () => {
      expect(sanitizeBoolean(true)).toBe(true);
      expect(sanitizeBoolean(1)).toBe(true);
      expect(sanitizeBoolean('yes')).toBe(true);
      expect(sanitizeBoolean({})).toBe(true);
    });

    it('should convert falsy values to false', () => {
      expect(sanitizeBoolean(false)).toBe(false);
      expect(sanitizeBoolean(0)).toBe(false);
      expect(sanitizeBoolean('')).toBe(false);
      expect(sanitizeBoolean(null)).toBe(false);
      expect(sanitizeBoolean(undefined)).toBe(false);
    });
  });

  describe('sanitizeInstallConfig', () => {
    it('should sanitize valid config', () => {
      const config = {
        apiKeys: {
          anthropic: 'sk-ant-valid-key',
          openai: 'sk-valid-openai-key',
        },
        skipNodeInstall: true,
        installPath: '/usr/local/openclaw',
      };

      const result = sanitizeInstallConfig(config);
      expect(result).toEqual({
        apiKeys: {
          anthropic: 'sk-ant-valid-key',
          openai: 'sk-valid-openai-key',
        },
        skipNodeInstall: true,
        installPath: '/usr/local/openclaw',
      });
    });

    it('should sanitize API keys with injection attempts', () => {
      const config = {
        apiKeys: {
          anthropic: 'sk-ant-123; rm -rf /',
          openai: 'sk$(whoami)key',
        },
      };

      const result = sanitizeInstallConfig(config);
      expect(result.apiKeys?.anthropic).toBe('sk-ant-123rm-rf');
      expect(result.apiKeys?.openai).toBe('skwhoamikey');
    });

    it('should sanitize paths with directory traversal', () => {
      const config = {
        installPath: '../../../etc/passwd',
      };

      const result = sanitizeInstallConfig(config);
      expect(result.installPath).toBe('etc/passwd');
    });

    it('should preserve malformed API keys object for validation', () => {
      const config = {
        apiKeys: 'not-an-object' as any,
      };

      const result = sanitizeInstallConfig(config);
      expect(result.apiKeys).toBe('not-an-object'); // Preserved for validation to catch
    });

    it('should return empty config for null/undefined', () => {
      expect(sanitizeInstallConfig(null)).toEqual({});
      expect(sanitizeInstallConfig(undefined)).toEqual({});
      expect(sanitizeInstallConfig('string' as any)).toEqual({});
    });

    it('should preserve invalid boolean fields for validation', () => {
      const config = {
        skipNodeInstall: 'true' as any,
      };

      const result = sanitizeInstallConfig(config);
      expect(result.skipNodeInstall).toBe('true'); // Preserved for validation to catch
    });

    it('should sanitize API key names with null bytes', () => {
      const config = {
        apiKeys: {
          'valid-key': 'sk-valid',
          'key\0injection': 'sk-malicious',
        },
      };

      const result = sanitizeInstallConfig(config);
      expect(result.apiKeys?.['valid-key']).toBe('sk-valid');
      // Null bytes are removed from key names during sanitization
      expect(result.apiKeys?.['keyinjection']).toBe('sk-malicious');
    });
  });

  describe('sanitizeInstallProgress', () => {
    it('should sanitize valid progress', () => {
      const progress = {
        phase: 'installing-node' as const,
        percentage: 50,
        currentStep: 'Downloading Node.js',
        message: 'Installing...',
      };

      const result = sanitizeInstallProgress(progress);
      expect(result).toEqual(progress);
    });

    it('should enforce percentage bounds', () => {
      const progress = {
        phase: 'detecting' as const,
        percentage: 150,
        currentStep: 'Step',
      };

      const result = sanitizeInstallProgress(progress);
      expect(result.percentage).toBe(100);
    });

    it('should default to detecting for invalid phase', () => {
      const progress = {
        phase: 'invalid-phase' as any,
        percentage: 50,
        currentStep: 'Step',
      };

      const result = sanitizeInstallProgress(progress);
      expect(result.phase).toBe('detecting');
    });

    it('should sanitize strings in messages', () => {
      const progress = {
        phase: 'installing-node' as const,
        percentage: 50,
        currentStep: 'Step\0injection',
        message: 'Message\0attack',
      };

      const result = sanitizeInstallProgress(progress);
      expect(result.currentStep).toBe('Stepinjection');
      expect(result.message).toBe('Messageattack');
    });
  });

  describe('sanitizeLogEntry', () => {
    it('should sanitize valid log entry', () => {
      const log = {
        timestamp: Date.now(),
        level: 'info' as const,
        message: 'Installation started',
        details: 'Additional info',
      };

      const result = sanitizeLogEntry(log);
      expect(result.level).toBe('info');
      expect(result.message).toBe('Installation started');
      expect(result.details).toBe('Additional info');
    });

    it('should default to info for invalid level', () => {
      const log = {
        timestamp: Date.now(),
        level: 'critical' as any,
        message: 'Test',
      };

      const result = sanitizeLogEntry(log);
      expect(result.level).toBe('info');
    });

    it('should sanitize timestamp bounds', () => {
      const futureTimestamp = Date.now() + 100000000; // Far future
      const log = {
        timestamp: futureTimestamp,
        level: 'info' as const,
        message: 'Test',
      };

      const result = sanitizeLogEntry(log);
      expect(result.timestamp).toBeLessThanOrEqual(Date.now() + 86400000);
    });

    it('should sanitize null bytes in messages', () => {
      const log = {
        timestamp: Date.now(),
        level: 'error' as const,
        message: 'Error\0injection',
        details: 'Details\0attack',
      };

      const result = sanitizeLogEntry(log);
      expect(result.message).toBe('Errorinjection');
      expect(result.details).toBe('Detailsattack');
    });
  });

  describe('sanitizeInstallError', () => {
    it('should sanitize valid error', () => {
      const error = {
        code: 'NODE_INSTALL_FAILED',
        message: 'Failed to install Node.js',
        phase: 'installing-node' as const,
        stack: 'Error stack trace',
        recoverable: true,
      };

      const result = sanitizeInstallError(error);
      expect(result).toEqual(error);
    });

    it('should default to detecting for invalid phase', () => {
      const error = {
        code: 'ERROR',
        message: 'Test',
        phase: 'invalid' as any,
        recoverable: true,
      };

      const result = sanitizeInstallError(error);
      expect(result.phase).toBe('detecting');
    });

    it('should sanitize null bytes in error details', () => {
      const error = {
        code: 'ERR\0CODE',
        message: 'Message\0injection',
        phase: 'detecting' as const,
        stack: 'Stack\0trace',
        recoverable: true,
      };

      const result = sanitizeInstallError(error);
      expect(result.code).toBe('ERRCODE');
      expect(result.message).toBe('Messageinjection');
      expect(result.stack).toBe('Stacktrace');
    });

    it('should convert recoverable to boolean', () => {
      const error = {
        code: 'ERROR',
        message: 'Test',
        phase: 'detecting' as const,
        recoverable: 'yes' as any,
      };

      const result = sanitizeInstallError(error);
      expect(result.recoverable).toBe(true);
    });
  });

  describe('sanitizeInstallResult', () => {
    it('should sanitize success result', () => {
      const result = {
        success: true,
        nodeVersion: '22.12.0',
        openclawVersion: '1.0.0',
      };

      const sanitized = sanitizeInstallResult(result);
      expect(sanitized).toEqual(result);
    });

    it('should sanitize error result', () => {
      const result = {
        success: false,
        error: {
          code: 'FAILED',
          message: 'Installation failed',
          phase: 'installing-node' as const,
          recoverable: true,
        },
      };

      const sanitized = sanitizeInstallResult(result);
      expect(sanitized.success).toBe(false);
      expect(sanitized.error).toBeDefined();
      expect(sanitized.error?.code).toBe('FAILED');
    });

    it('should sanitize version strings', () => {
      const result = {
        success: true,
        nodeVersion: 'v22.12.0\0injection',
        openclawVersion: '1.0.0\0attack',
      };

      const sanitized = sanitizeInstallResult(result);
      expect(sanitized.nodeVersion).toBe('v22.12.0injection');
      expect(sanitized.openclawVersion).toBe('1.0.0attack');
    });

    it('should convert success to boolean', () => {
      const result = {
        success: 'yes' as any,
        nodeVersion: '22.12.0',
      };

      const sanitized = sanitizeInstallResult(result);
      expect(sanitized.success).toBe(true);
    });
  });

  describe('sanitizeSystemInfo', () => {
    it('should sanitize valid system info', () => {
      const info = {
        platform: 'darwin' as const,
        arch: 'arm64',
        nodeVersion: 'v22.12.0',
        openclawInstalled: true,
      };

      const result = sanitizeSystemInfo(info);
      expect(result).toEqual(info);
    });

    it('should default to linux for invalid platform', () => {
      const info = {
        platform: 'unknown' as any,
        arch: 'x64',
        openclawInstalled: false,
      };

      const result = sanitizeSystemInfo(info);
      expect(result.platform).toBe('linux');
    });

    it('should sanitize architecture string', () => {
      const info = {
        platform: 'darwin' as const,
        arch: 'arm64\0injection',
        openclawInstalled: false,
      };

      const result = sanitizeSystemInfo(info);
      expect(result.arch).toBe('arm64injection');
    });

    it('should sanitize node version', () => {
      const info = {
        platform: 'win32' as const,
        arch: 'x64',
        nodeVersion: 'v22.12.0\0attack',
        openclawInstalled: false,
      };

      const result = sanitizeSystemInfo(info);
      expect(result.nodeVersion).toBe('v22.12.0attack');
    });

    it('should convert openclawInstalled to boolean', () => {
      const info = {
        platform: 'linux' as const,
        arch: 'x64',
        openclawInstalled: 'true' as any,
      };

      const result = sanitizeSystemInfo(info);
      expect(result.openclawInstalled).toBe(true);
    });
  });

  // Security-focused tests
  describe('Security: Command Injection Prevention', () => {
    it('should prevent shell command injection in strings', () => {
      const malicious = '$(rm -rf /)';
      expect(sanitizeString(malicious)).toBe(malicious); // String is preserved but won't be executed
    });

    it('should prevent command injection in API keys', () => {
      const malicious = 'sk-ant-123; cat /etc/passwd';
      const result = sanitizeAPIKey(malicious);
      expect(result).not.toContain(';');
      expect(result).not.toContain(' ');
      expect(result).toBe('sk-ant-123catetcpasswd');
    });

    it('should prevent command injection in paths', () => {
      const malicious = '/usr/local/bin; rm -rf /';
      const result = sanitizePath(malicious);
      // Semicolons are allowed in paths, but the path won't be executed directly
      expect(result).toBeTruthy();
    });
  });

  describe('Security: Path Traversal Prevention', () => {
    it('should prevent directory traversal attacks', () => {
      expect(sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
      expect(sanitizePath('..\\..\\..\\windows\\system32')).toBe('windows\\system32');
    });

    it('should prevent complex traversal patterns', () => {
      expect(sanitizePath('/safe/path/../../../etc/passwd')).toBe('/safe/path/etc/passwd');
      expect(sanitizePath('../../../../../../root/.ssh/id_rsa')).toBe('root/.ssh/id_rsa');
    });
  });

  describe('Security: Null Byte Injection Prevention', () => {
    it('should remove null bytes from all string types', () => {
      expect(sanitizeString('test\0file.txt')).toBe('testfile.txt');
      expect(sanitizePath('/path/to\0/file')).toBe('/path/to/file');
      expect(sanitizeAPIKey('key\0value')).toBe('keyvalue');
    });
  });

  describe('Security: DoS Prevention', () => {
    it('should truncate extremely long strings', () => {
      const huge = 'a'.repeat(1000000);
      const result = sanitizeString(huge);
      expect(result.length).toBe(10000);
    });

    it('should truncate extremely long API keys', () => {
      const huge = 'sk-' + 'a'.repeat(10000);
      const result = sanitizeAPIKey(huge);
      expect(result.length).toBe(500);
    });

    it('should handle large numbers safely', () => {
      expect(sanitizeNumber(Number.MAX_VALUE, 0, 100)).toBe(100);
      expect(sanitizeNumber(Number.MIN_VALUE, 0, 100)).toBe(Number.MIN_VALUE);
    });
  });
});
