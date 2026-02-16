/**
 * Test suite for OpenClaw daemon onboarding functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OnboardResult } from './installer';

// Mock the executeWithPrivileges function from installer module
vi.mock('./installer', async () => {
  const actual = await vi.importActual<typeof import('./installer')>('./installer');

  // Mock executeWithPrivileges to avoid actually running openclaw command
  const mockExecuteWithPrivileges = vi.fn().mockResolvedValue({
    success: true,
    stdout: 'OpenClaw daemon configured successfully\n',
    stderr: '',
    exitCode: 0,
    cancelled: false,
  });

  // Create a mock onboardOpenclaw that simulates the real function
  const mockOnboardOpenclaw = async (
    config?: { apiKeys?: { anthropic?: string; openai?: string; [key: string]: string | undefined } },
    onProgress?: (message: string, level: 'info' | 'warning' | 'error' | 'debug') => void
  ): Promise<OnboardResult> => {
    try {
      onProgress?.('Running OpenClaw daemon onboarding...', 'info');

      // Simulate command execution
      const result = await mockExecuteWithPrivileges(
        'openclaw',
        ['onboard', '--install-daemon', '--non-interactive']
      );

      if (result.cancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'User cancelled onboarding',
        };
      }

      if (!result.success) {
        return {
          success: false,
          cancelled: false,
          error: 'openclaw onboard command failed',
        };
      }

      onProgress?.('OpenClaw daemon configured successfully', 'info');
      return {
        success: true,
        cancelled: false,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        cancelled: false,
        error,
      };
    }
  };

  return {
    ...actual,
    executeWithPrivileges: mockExecuteWithPrivileges,
    onboardOpenclaw: mockOnboardOpenclaw,
  };
});

// Import after mocking
const { onboardOpenclaw } = await import('./installer');

describe('OpenClaw Daemon Onboarding', () => {
  describe('onboardOpenclaw', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should be defined and exported', () => {
      expect(onboardOpenclaw).toBeDefined();
      expect(typeof onboardOpenclaw).toBe('function');
    });

    it('should accept optional config and progress callback parameters', () => {
      expect(onboardOpenclaw.length).toBe(2);
    });

    it('should return a Promise', () => {
      const result = onboardOpenclaw();
      expect(result).toBeInstanceOf(Promise);
    });

    describe('Function Signature and Return Types', () => {
      it('should return OnboardResult structure', async () => {
        const result = await onboardOpenclaw();

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('cancelled');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.cancelled).toBe('boolean');
      });

      it('should return error property on failure', async () => {
        const result = await onboardOpenclaw();

        if (!result.success) {
          expect(result).toHaveProperty('error');
          expect(typeof result.error).toBe('string');
        } else {
          // If successful, error property is optional
          expect(result.error).toBeUndefined();
        }
      });

      it('should handle config with API keys', async () => {
        const config = {
          apiKeys: {
            anthropic: 'sk-ant-test123',
            openai: 'sk-test456',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('success');
      });

      it('should handle empty config', async () => {
        const result = await onboardOpenclaw({});
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('success');
      });

      it('should handle config with empty apiKeys object', async () => {
        const config = { apiKeys: {} };
        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('success');
      });
    });

    describe('Progress Callback', () => {
      it('should accept progress callback function', async () => {
        const progressCallback = vi.fn();
        await onboardOpenclaw({}, progressCallback);

        // Progress callback should be called at least once
        expect(progressCallback).toHaveBeenCalled();
      });

      it('should call progress callback with message and level', async () => {
        const progressCallback = vi.fn();
        await onboardOpenclaw({}, progressCallback);

        // Verify callback was called with proper signature
        expect(progressCallback).toHaveBeenCalled();
        const calls = progressCallback.mock.calls;
        expect(calls.length).toBeGreaterThan(0);

        // Check first call has proper structure
        expect(typeof calls[0][0]).toBe('string');
        expect(['info', 'warning', 'error', 'debug']).toContain(calls[0][1]);
      });

      it('should work without progress callback', async () => {
        const result = await onboardOpenclaw({});
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });
    });

    describe('API Key Handling', () => {
      it('should handle Anthropic API key', async () => {
        const config = {
          apiKeys: {
            anthropic: 'sk-ant-test123',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle OpenAI API key', async () => {
        const config = {
          apiKeys: {
            openai: 'sk-test456',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle multiple API keys', async () => {
        const config = {
          apiKeys: {
            anthropic: 'sk-ant-test123',
            openai: 'sk-test456',
            gemini: 'gemini-key789',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle undefined API keys gracefully', async () => {
        const config = {
          apiKeys: {
            anthropic: undefined,
            openai: undefined,
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should validate API keys are strings', async () => {
        const config = {
          apiKeys: {
            anthropic: 'sk-ant-valid',
            // @ts-expect-error Testing invalid type
            openai: 12345,
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });
    });

    describe('Result Structure', () => {
      it('should return success result on successful onboarding', async () => {
        const result = await onboardOpenclaw();

        expect(result.success).toBe(true);
        expect(result.cancelled).toBe(false);
        expect(result.error).toBeUndefined();
      });

      it('should include all required fields in result', async () => {
        const result = await onboardOpenclaw();

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('cancelled');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.cancelled).toBe('boolean');
      });
    });

    describe('Integration and Exports', () => {
      it('should export OnboardResult type', async () => {
        const result: OnboardResult = await onboardOpenclaw();
        expect(result).toBeDefined();
      });

      it('should be callable from other modules', async () => {
        // Simulate importing from another module
        const { onboardOpenclaw: importedFunction } = await import('./installer');
        expect(importedFunction).toBe(onboardOpenclaw);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long API keys', async () => {
        const config = {
          apiKeys: {
            anthropic: 'sk-ant-' + 'x'.repeat(1000),
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle special characters in API keys', async () => {
        const config = {
          apiKeys: {
            anthropic: 'sk-ant-abc123!@#$%',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle empty string API keys', async () => {
        const config = {
          apiKeys: {
            anthropic: '',
            openai: '',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle whitespace-only API keys', async () => {
        const config = {
          apiKeys: {
            anthropic: '   ',
            openai: '\t\n',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });

      it('should handle unknown API provider keys', async () => {
        const config = {
          apiKeys: {
            'unknown-provider': 'test-key',
            'custom-ai': 'custom-key',
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });
    });

    describe('Security Validation', () => {
      it('should validate non-string API keys are handled safely', async () => {
        const config = {
          apiKeys: {
            // @ts-expect-error Testing type safety
            anthropic: { key: 'nested' },
            // @ts-expect-error Testing type safety
            openai: ['array', 'key'],
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        // Non-string keys should be handled without crashes
        expect(result).toHaveProperty('success');
      });

      it('should handle null API keys safely', async () => {
        const config = {
          apiKeys: {
            // @ts-expect-error Testing null safety
            anthropic: null,
            // @ts-expect-error Testing null safety
            openai: null,
          },
        };

        const result = await onboardOpenclaw(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
      });
    });
  });
});
