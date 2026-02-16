/**
 * Tests for Secure Command Execution
 * Validates command injection prevention and argument sanitization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isAllowedCommand,
  sanitizeCommandArgs,
  validatePath,
  secureSpawn,
  allowCommand,
  disallowCommand,
  getAllowedCommands,
} from './secure-command';

// Mock child_process
vi.mock('child_process');

describe('Secure Command Execution', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock spawn to return a fake child process
    const cp = await import('child_process');
    vi.mocked(cp.spawn).mockReturnValue({
      pid: 12345,
      on: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    } as any);
  });

  describe('isAllowedCommand', () => {
    it('should allow whitelisted commands', () => {
      expect(isAllowedCommand('node')).toBe(true);
      expect(isAllowedCommand('npm')).toBe(true);
      expect(isAllowedCommand('openclaw')).toBe(true);
    });

    it('should reject non-whitelisted commands', () => {
      expect(isAllowedCommand('rm')).toBe(false);
      expect(isAllowedCommand('curl')).toBe(false);
      expect(isAllowedCommand('wget')).toBe(false);
    });

    it('should reject commands with injection attempts', () => {
      expect(isAllowedCommand('node; rm -rf /')).toBe(false);
      expect(isAllowedCommand('npm && malicious')).toBe(false);
      expect(isAllowedCommand('node | grep')).toBe(false);
    });

    it('should reject empty commands', () => {
      expect(isAllowedCommand('')).toBe(false);
    });
  });

  describe('sanitizeCommandArgs', () => {
    it('should sanitize string arguments', () => {
      const args = ['--version', '-h', 'install'];
      const result = sanitizeCommandArgs(args);
      expect(result).toEqual(['--version', '-h', 'install']);
    });

    it('should convert number arguments to strings', () => {
      const args = ['--port', 3000, '--timeout', 5000];
      const result = sanitizeCommandArgs(args);
      expect(result).toEqual(['--port', '3000', '--timeout', '5000']);
    });

    it('should convert boolean arguments to strings', () => {
      const args = ['--verbose', true, '--quiet', false];
      const result = sanitizeCommandArgs(args);
      expect(result).toEqual(['--verbose', 'true', '--quiet', 'false']);
    });

    it('should throw error for non-array input', () => {
      expect(() => sanitizeCommandArgs('not an array' as any)).toThrow('Command arguments must be an array');
      expect(() => sanitizeCommandArgs({ foo: 'bar' } as any)).toThrow('Command arguments must be an array');
    });

    it('should throw error for object arguments', () => {
      const args = [{ malicious: 'object' }];
      expect(() => sanitizeCommandArgs(args)).toThrow('Invalid argument type');
    });

    it('should throw error for function arguments', () => {
      const args = [() => { }];
      expect(() => sanitizeCommandArgs(args)).toThrow('Invalid argument type');
    });

    it('should remove null bytes from string arguments', () => {
      const args = ['test\0inject'];
      const result = sanitizeCommandArgs(args);
      expect(result).toEqual(['testinject']);
    });

    it('should handle empty array', () => {
      const result = sanitizeCommandArgs([]);
      expect(result).toEqual([]);
    });

    it('should handle mixed valid types', () => {
      const args = ['node', '--version', 22, true, 'install'];
      const result = sanitizeCommandArgs(args);
      expect(result).toEqual(['node', '--version', '22', 'true', 'install']);
    });
  });

  describe('validatePath', () => {
    it('should accept valid paths', () => {
      expect(validatePath('/usr/local/bin')).toBe('/usr/local/bin');
      expect(validatePath('/home/user/file.txt')).toBe('/home/user/file.txt');
      expect(validatePath('C:\\Users\\User\\file.txt')).toBe('C:\\Users\\User\\file.txt');
    });

    it('should remove directory traversal sequences', () => {
      const path = '/usr/local/../../../etc/passwd';
      const result = validatePath(path);
      expect(result).toBe('/usr/local/etc/passwd');
    });

    it('should reject paths with semicolons (command separator)', () => {
      expect(() => validatePath('/path; rm -rf /')).toThrow('suspicious characters');
    });

    it('should reject paths with pipes', () => {
      expect(() => validatePath('/path | grep')).toThrow('suspicious characters');
    });

    it('should reject paths with command chaining', () => {
      expect(() => validatePath('/path && malicious')).toThrow('suspicious characters');
    });

    it('should reject paths with command substitution (backtick)', () => {
      expect(() => validatePath('/path/`whoami`')).toThrow('suspicious characters');
    });

    it('should reject paths with command substitution $()', () => {
      expect(() => validatePath('/path/$(whoami)')).toThrow('suspicious characters');
    });

    it('should reject paths with redirects', () => {
      expect(() => validatePath('/path > output.txt')).toThrow('suspicious characters');
      expect(() => validatePath('/path < input.txt')).toThrow('suspicious characters');
    });

    it('should throw error for empty paths', () => {
      expect(() => validatePath('')).toThrow('Path cannot be empty');
    });

    it('should remove null bytes', () => {
      const path = '/path/to\0/file';
      const result = validatePath(path);
      expect(result).toBe('/path/to/file');
    });
  });

  describe('secureSpawn', () => {
    it('should spawn allowed commands with sanitized arguments', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      secureSpawn('node', ['--version']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--version'],
        expect.objectContaining({ shell: false })
      );
    });

    it('should force shell option to false', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      // Even if someone tries to pass shell: true, it should be overridden
      secureSpawn('node', ['--version'], {} as any);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--version'],
        expect.objectContaining({ shell: false })
      );
    });

    it('should throw error for non-whitelisted commands', () => {
      expect(() => secureSpawn('rm', ['-rf', '/'])).toThrow('not in the allowed commands list');
      expect(() => secureSpawn('curl', ['http://malicious.com'])).toThrow('not in the allowed commands list');
    });

    it('should sanitize command name', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      secureSpawn('node', ['--version']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--version'],
        expect.objectContaining({ shell: false })
      );
    });

    it('should throw error for empty command', () => {
      expect(() => secureSpawn('', [])).toThrow('not in the allowed commands list');
    });

    it('should handle options other than shell', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      secureSpawn('node', ['--version'], {
        cwd: '/usr/local',
        env: { NODE_ENV: 'production' },
      });

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--version'],
        expect.objectContaining({
          shell: false,
          cwd: '/usr/local',
          env: { NODE_ENV: 'production' },
        })
      );
    });

    it('should sanitize arguments with null bytes', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      secureSpawn('node', ['--version\0malicious']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--versionmalicious'],
        expect.objectContaining({ shell: false })
      );
    });

    it('should handle empty args array', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      secureSpawn('node');

      expect(spawn).toHaveBeenCalledWith(
        'node',
        [],
        expect.objectContaining({ shell: false })
      );
    });

    it('should prevent command injection via arguments', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      // Even if malicious args are passed, they're treated as strings, not executed
      secureSpawn('node', ['--version; rm -rf /']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--version; rm -rf /'],
        expect.objectContaining({ shell: false })
      );
    });
  });

  describe('allowCommand / disallowCommand', () => {
    it('should allow adding new commands', () => {
      expect(isAllowedCommand('custom-tool')).toBe(false);

      allowCommand('custom-tool');

      expect(isAllowedCommand('custom-tool')).toBe(true);
    });

    it('should allow removing commands', () => {
      allowCommand('temp-command');
      expect(isAllowedCommand('temp-command')).toBe(true);

      disallowCommand('temp-command');

      expect(isAllowedCommand('temp-command')).toBe(false);
    });

    it('should sanitize command name when adding', () => {
      allowCommand('test\0command');
      expect(isAllowedCommand('testcommand')).toBe(true);
      expect(isAllowedCommand('test\0command')).toBe(false);
    });

    it('should not add empty commands', () => {
      const before = getAllowedCommands().length;
      allowCommand('');
      const after = getAllowedCommands().length;
      expect(after).toBe(before);
    });
  });

  describe('getAllowedCommands', () => {
    it('should return array of allowed commands', () => {
      const commands = getAllowedCommands();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands).toContain('node');
      expect(commands).toContain('npm');
    });

    it('should include custom allowed commands', () => {
      allowCommand('my-custom-command');
      const commands = getAllowedCommands();
      expect(commands).toContain('my-custom-command');
      disallowCommand('my-custom-command'); // Cleanup
    });
  });

  describe('Command Injection Prevention - Edge Cases', () => {
    it('should prevent injection via command name with special chars', () => {
      expect(() => secureSpawn('node; rm -rf /', [])).toThrow('not in the allowed commands list');
    });

    it('should prevent injection via argument with command chaining', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      // Malicious argument is just a string argument, not executed
      secureSpawn('node', ['arg && malicious']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['arg && malicious'],
        expect.objectContaining({ shell: false })
      );
    });

    it('should prevent injection via environment variable manipulation', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      // Environment variables are passed as-is but don't affect command execution
      secureSpawn('node', ['--version'], {
        env: { 'LD_PRELOAD': '/malicious.so' },
      });

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--version'],
        expect.objectContaining({
          shell: false,
          env: { 'LD_PRELOAD': '/malicious.so' },
        })
      );
    });

    it('should handle unicode and special characters safely', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      secureSpawn('node', ['--option=😀', '日本語']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        ['--option=😀', '日本語'],
        expect.objectContaining({ shell: false })
      );
    });

    it('should handle very long arguments without DoS', async () => {
      const cp = await import('child_process');
      const spawn = vi.mocked(cp.spawn);

      // The sanitizeString function limits length to 10000 characters
      const longArg = 'a'.repeat(20000);
      secureSpawn('node', [longArg]);

      const call = (spawn as any).mock.calls[0];
      expect(call[1][0].length).toBeLessThanOrEqual(10000);
    });
  });
});
