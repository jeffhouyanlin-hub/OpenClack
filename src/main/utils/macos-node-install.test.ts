import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import {
  detectHomebrew,
  installNodeViaBrew,
  installNodeDirectMacOS,
  installNodeMacOS,
} from './installer';

// Mock child_process
vi.mock('child_process');

// Helper to create mock ChildProcess
function createMockChild(): ChildProcess {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new EventEmitter() as any;
  child.stderr = new EventEmitter() as any;
  return child;
}

describe('macOS Node.js Installation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectHomebrew', () => {
    it('should return true when Homebrew is installed', async () => {
      const mockChild = createMockChild();
      (spawn as Mock).mockReturnValue(mockChild);

      const promise = detectHomebrew();

      // Simulate brew found
      mockChild.stdout?.emit('data', Buffer.from('/opt/homebrew/bin/brew\n'));
      mockChild.emit('close', 0);

      const result = await promise;
      expect(result).toBe(true);
      expect(spawn).toHaveBeenCalledWith('which', ['brew']);
    });

    it('should return false when Homebrew is not installed', async () => {
      const mockChild = createMockChild();
      (spawn as Mock).mockReturnValue(mockChild);

      const promise = detectHomebrew();

      // Simulate brew not found
      mockChild.emit('close', 1);

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should return false when which command fails', async () => {
      const mockChild = createMockChild();
      (spawn as Mock).mockReturnValue(mockChild);

      const promise = detectHomebrew();

      // Simulate error
      mockChild.emit('error', new Error('Command not found'));

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should return false when stdout is empty', async () => {
      const mockChild = createMockChild();
      (spawn as Mock).mockReturnValue(mockChild);

      const promise = detectHomebrew();

      // Simulate empty output
      mockChild.stdout?.emit('data', Buffer.from(''));
      mockChild.emit('close', 0);

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      (spawn as Mock).mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const result = await detectHomebrew();
      expect(result).toBe(false);
    });
  });

  describe('installNodeViaBrew', () => {
    it('should be defined as a function', () => {
      expect(installNodeViaBrew).toBeDefined();
      expect(typeof installNodeViaBrew).toBe('function');
    });

    it('should return a promise', () => {
      const result = installNodeViaBrew();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept optional progress callback', () => {
      const onProgress = vi.fn();
      const result = installNodeViaBrew(onProgress);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('installNodeDirectMacOS', () => {
    it('should be defined as a function', () => {
      expect(installNodeDirectMacOS).toBeDefined();
      expect(typeof installNodeDirectMacOS).toBe('function');
    });

    it('should return a promise', () => {
      const result = installNodeDirectMacOS();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept optional progress callback', () => {
      const onProgress = vi.fn();
      const result = installNodeDirectMacOS(onProgress);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('installNodeMacOS', () => {
    it('should be defined as a function', () => {
      expect(installNodeMacOS).toBeDefined();
      expect(typeof installNodeMacOS).toBe('function');
    });

    it('should return a promise', () => {
      const result = installNodeMacOS();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should accept optional progress callback', () => {
      const onProgress = vi.fn();
      const result = installNodeMacOS(onProgress);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return error on non-macOS platforms', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true, configurable: true });

      const result = await installNodeMacOS();

      expect(result.success).toBe(false);
      expect(result.error).toContain('only supported on macOS');

      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
    });
  });

  describe('Integration', () => {
    it('should export all required functions', () => {
      expect(detectHomebrew).toBeDefined();
      expect(installNodeViaBrew).toBeDefined();
      expect(installNodeDirectMacOS).toBeDefined();
      expect(installNodeMacOS).toBeDefined();
    });

    it('should have correct function signatures', () => {
      expect(typeof detectHomebrew).toBe('function');
      expect(typeof installNodeViaBrew).toBe('function');
      expect(typeof installNodeDirectMacOS).toBe('function');
      expect(typeof installNodeMacOS).toBe('function');
    });

    it('should all return promises', () => {
      expect(detectHomebrew()).toBeInstanceOf(Promise);
      expect(installNodeViaBrew()).toBeInstanceOf(Promise);
      expect(installNodeDirectMacOS()).toBeInstanceOf(Promise);
      expect(installNodeMacOS()).toBeInstanceOf(Promise);
    });
  });
});
