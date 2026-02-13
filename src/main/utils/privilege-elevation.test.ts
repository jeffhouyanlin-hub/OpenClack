import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as os from 'os';
import { executeWithPrivileges } from './installer';

// Mock child_process
vi.mock('child_process');

// Mock os
vi.mock('os');

describe('executeWithPrivileges', () => {
  let mockChild: EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock child process
    mockChild = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });

    // Mock spawn to return our mock child
    vi.mocked(spawn).mockReturnValue(mockChild as any);
  });

  afterEach(() => {
    // Clean up event listeners
    mockChild.removeAllListeners();
    mockChild.stdout.removeAllListeners();
    mockChild.stderr.removeAllListeners();
  });

  describe('macOS (darwin)', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('darwin');
    });

    it('should execute command successfully with AppleScript sudo prompt', async () => {
      const promise = executeWithPrivileges('npm', ['install', '-g', 'openclaw']);

      // Simulate successful execution
      mockChild.stdout.emit('data', Buffer.from('Successfully installed\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Successfully installed');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(result.cancelled).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should use osascript with correct AppleScript command', async () => {
      const promise = executeWithPrivileges('npm', ['install', '-g', 'openclaw']);

      mockChild.emit('close', 0);
      await promise;

      expect(spawn).toHaveBeenCalledWith('osascript', [
        '-e',
        expect.stringContaining('do shell script'),
      ]);

      const scriptArg = vi.mocked(spawn).mock.calls[0][1][1];
      expect(scriptArg).toContain('npm install -g openclaw');
      expect(scriptArg).toContain('with administrator privileges');
    });

    it('should use custom message in AppleScript prompt', async () => {
      const customMessage = 'Custom permission message';
      const promise = executeWithPrivileges('npm', ['install'], {
        message: customMessage,
      });

      mockChild.emit('close', 0);
      await promise;

      const scriptArg = vi.mocked(spawn).mock.calls[0][1][1];
      expect(scriptArg).toContain(`with prompt "${customMessage}"`);
    });

    it('should escape quotes in command arguments', async () => {
      const promise = executeWithPrivileges('echo', ['Hello "World"']);

      mockChild.emit('close', 0);
      await promise;

      const scriptArg = vi.mocked(spawn).mock.calls[0][1][1];
      expect(scriptArg).toContain('Hello \\"World\\"');
    });

    it('should handle user cancellation (exit code -128)', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stderr.emit('data', Buffer.from('User cancelled\n'));
      mockChild.emit('close', -128);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.error).toBe('User cancelled authentication');
      expect(result.exitCode).toBe(-128);
    });

    it('should handle authentication failure', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stderr.emit('data', Buffer.from('Authentication failed\n'));
      mockChild.emit('close', 126);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.stderr).toContain('Authentication failed');
    });

    it('should handle command execution errors', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stderr.emit('data', Buffer.from('Command not found\n'));
      mockChild.emit('close', 1);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Command not found');
    });

    it('should handle osascript not found error', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      const error = new Error('spawn osascript ENOENT');
      error.message = 'spawn osascript ENOENT';
      mockChild.emit('error', error);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('osascript not found');
    });

    it('should collect multiple stdout chunks', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stdout.emit('data', Buffer.from('Line 1\n'));
      mockChild.stdout.emit('data', Buffer.from('Line 2\n'));
      mockChild.stdout.emit('data', Buffer.from('Line 3\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Linux', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('linux');
    });

    it('should execute command successfully with pkexec', async () => {
      const promise = executeWithPrivileges('npm', ['install', '-g', 'openclaw']);

      mockChild.stdout.emit('data', Buffer.from('Successfully installed\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Successfully installed');
      expect(result.exitCode).toBe(0);
      expect(result.cancelled).toBe(false);
    });

    it('should use pkexec with correct arguments', async () => {
      const promise = executeWithPrivileges('npm', ['install', '-g', 'openclaw']);

      mockChild.emit('close', 0);
      await promise;

      expect(spawn).toHaveBeenCalledWith('pkexec', ['npm', 'install', '-g', 'openclaw']);
    });

    it('should handle user cancellation with "Request dismissed"', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stderr.emit('data', Buffer.from('Request dismissed\n'));
      mockChild.emit('close', 126);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.error).toBe('User cancelled authentication');
    });

    it('should handle pkexec not found error', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      const error = new Error('spawn pkexec ENOENT');
      error.message = 'spawn pkexec ENOENT';
      mockChild.emit('error', error);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('pkexec not found');
    });

    it('should handle exit code 127 as cancellation', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.emit('close', 127);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
    });

    it('should handle command execution failure', async () => {
      const promise = executeWithPrivileges('invalid-command', ['--test']);

      mockChild.stderr.emit('data', Buffer.from('Error: command failed\n'));
      mockChild.emit('close', 2);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(2);
      expect(result.cancelled).toBe(false);
    });
  });

  describe('Unsupported platforms', () => {
    it('should return error for Windows platform', async () => {
      vi.mocked(os.platform).mockReturnValue('win32');

      const result = await executeWithPrivileges('npm', ['install']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported platform: win32');
      expect(result.error).toContain('only supports macOS and Linux');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should return error for unknown platform', async () => {
      vi.mocked(os.platform).mockReturnValue('freebsd' as any);

      const result = await executeWithPrivileges('npm', ['install']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('darwin');
    });

    it('should handle empty arguments array', async () => {
      const promise = executeWithPrivileges('ls', []);

      mockChild.emit('close', 0);
      await promise;

      expect(spawn).toHaveBeenCalledWith('osascript', expect.any(Array));
    });

    it('should handle command with no output', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.emit('close', 0);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
    });

    it('should handle mixed stdout and stderr output', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stdout.emit('data', Buffer.from('Installing...\n'));
      mockChild.stderr.emit('data', Buffer.from('Warning: deprecated\n'));
      mockChild.stdout.emit('data', Buffer.from('Done!\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Installing...\nDone!');
      expect(result.stderr).toBe('Warning: deprecated');
    });

    it('should handle spawn exception in try-catch', async () => {
      vi.mocked(spawn).mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const result = await executeWithPrivileges('npm', ['install']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Spawn failed');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(spawn).mockImplementation(() => {
        throw 'String error';
      });

      const result = await executeWithPrivileges('npm', ['install']);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should trim whitespace from stdout and stderr', async () => {
      const promise = executeWithPrivileges('npm', ['install']);

      mockChild.stdout.emit('data', Buffer.from('  Output with spaces  \n'));
      mockChild.stderr.emit('data', Buffer.from('\n  Error with spaces  \n\n'));
      mockChild.emit('close', 0);

      const result = await promise;

      expect(result.stdout).toBe('Output with spaces');
      expect(result.stderr).toBe('Error with spaces');
    });
  });
});
