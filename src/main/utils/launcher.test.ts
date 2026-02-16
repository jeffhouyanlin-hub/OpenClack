import { describe, it, expect } from 'vitest';
import { detectOpenClawPath, launchOpenClaw, LaunchResult } from './launcher';

describe('Launcher', () => {
  describe('detectOpenClawPath', () => {
    it('should be a function', () => {
      expect(typeof detectOpenClawPath).toBe('function');
    });

    it('should return a string or null', async () => {
      const path = await detectOpenClawPath();
      expect(path === null || typeof path === 'string').toBe(true);
    });
  });

  describe('launchOpenClaw', () => {
    it('should be a function', () => {
      expect(typeof launchOpenClaw).toBe('function');
    });

    it('should return a LaunchResult object', async () => {
      const result = await launchOpenClaw();
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should include error message on failure', async () => {
      const result = await launchOpenClaw();
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
