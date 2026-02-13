import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import {
  parseNodeVersion,
  compareVersions,
  detectNodeVersion,
  MIN_NODE_VERSION,
} from './installer';

// Mock child_process
vi.mock('child_process');

describe('Node.js Version Detection', () => {
  describe('parseNodeVersion', () => {
    it('should parse version with v prefix', () => {
      const result = parseNodeVersion('v22.12.0');
      expect(result).toEqual({ major: 22, minor: 12, patch: 0 });
    });

    it('should parse version without v prefix', () => {
      const result = parseNodeVersion('22.12.0');
      expect(result).toEqual({ major: 22, minor: 12, patch: 0 });
    });

    it('should parse version with leading/trailing whitespace', () => {
      const result = parseNodeVersion('  v22.12.0  \n');
      expect(result).toEqual({ major: 22, minor: 12, patch: 0 });
    });

    it('should parse higher version numbers', () => {
      const result = parseNodeVersion('v24.1.15');
      expect(result).toEqual({ major: 24, minor: 1, patch: 15 });
    });

    it('should return null for invalid version format', () => {
      expect(parseNodeVersion('invalid')).toBeNull();
      expect(parseNodeVersion('v22')).toBeNull();
      expect(parseNodeVersion('22.12')).toBeNull();
      expect(parseNodeVersion('abc.def.ghi')).toBeNull();
    });

    it('should handle version with extra metadata', () => {
      const result = parseNodeVersion('v22.12.0-rc1');
      expect(result).toEqual({ major: 22, minor: 12, patch: 0 });
    });
  });

  describe('compareVersions', () => {
    it('should return true when versions are equal', () => {
      expect(compareVersions('v22.12.0', '22.12.0')).toBe(true);
    });

    it('should return true when major version is higher', () => {
      expect(compareVersions('v23.0.0', '22.12.0')).toBe(true);
    });

    it('should return false when major version is lower', () => {
      expect(compareVersions('v21.0.0', '22.12.0')).toBe(false);
    });

    it('should return true when major equal and minor higher', () => {
      expect(compareVersions('v22.13.0', '22.12.0')).toBe(true);
    });

    it('should return false when major equal and minor lower', () => {
      expect(compareVersions('v22.11.0', '22.12.0')).toBe(false);
    });

    it('should return true when major and minor equal and patch higher', () => {
      expect(compareVersions('v22.12.1', '22.12.0')).toBe(true);
    });

    it('should return false when major and minor equal and patch lower', () => {
      expect(compareVersions('v22.12.0', '22.12.1')).toBe(false);
    });

    it('should return false for invalid version formats', () => {
      expect(compareVersions('invalid', '22.12.0')).toBe(false);
      expect(compareVersions('v22.12.0', 'invalid')).toBe(false);
    });

    it('should handle versions with v prefix', () => {
      expect(compareVersions('v22.12.0', 'v22.12.0')).toBe(true);
    });
  });

  describe('detectNodeVersion', () => {
    let mockChild: EventEmitter;

    beforeEach(() => {
      mockChild = new EventEmitter();
      // @ts-expect-error - Mock stdout/stderr
      mockChild.stdout = new EventEmitter();
      // @ts-expect-error - Mock stdout/stderr
      mockChild.stderr = new EventEmitter();
      vi.mocked(spawn).mockReturnValue(mockChild as any);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should detect Node.js when installed and meets requirement', async () => {
      const promise = detectNodeVersion();

      // Simulate successful node --version output
      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v22.12.0\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      expect(spawn).toHaveBeenCalledWith('node', ['--version']);
    });

    it('should detect Node.js when installed but does not meet requirement', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v18.0.0\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v18.0.0',
        meetsRequirement: false,
      });
    });

    it('should detect when Node.js is not installed', async () => {
      const promise = detectNodeVersion();

      // Simulate command not found error
      mockChild.emit('error', new Error('spawn node ENOENT'));

      const result = await promise;

      expect(result).toEqual({
        installed: false,
        version: null,
        meetsRequirement: false,
        error: 'spawn node ENOENT',
      });
    });

    it('should handle node --version exit with non-zero code', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stderr
      mockChild.stderr.emit('data', Buffer.from('Command failed\n'));
      mockChild.emit('close', 1);

      const result = await promise;

      expect(result).toEqual({
        installed: false,
        version: null,
        meetsRequirement: false,
        error: 'Command failed',
      });
    });

    it('should handle invalid version format from node', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('invalid-version\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'invalid-version',
        meetsRequirement: false,
        error: 'Invalid version format: invalid-version',
      });
    });

    it('should handle multiple data chunks from stdout', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v22.'));
      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('12.0\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });
    });

    it('should verify minimum Node.js version constant', () => {
      expect(MIN_NODE_VERSION).toBe('22.12.0');
    });

    it('should detect higher Node.js versions as meeting requirement', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v24.1.0\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v24.1.0',
        meetsRequirement: true,
      });
    });

    it('should detect exact minimum version as meeting requirement', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v22.12.0\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });
    });

    it('should handle versions with patch higher than minimum', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v22.12.1\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v22.12.1',
        meetsRequirement: true,
      });
    });

    it('should handle versions with minor higher than minimum', async () => {
      const promise = detectNodeVersion();

      // @ts-expect-error - Mock stdout
      mockChild.stdout.emit('data', Buffer.from('v22.13.0\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result).toEqual({
        installed: true,
        version: 'v22.13.0',
        meetsRequirement: true,
      });
    });
  });
});
