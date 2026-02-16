import { describe, it, expect, vi } from 'vitest';
import {
  validateAnthropicKey,
  validateOpenAIKey,
  validateAPIKey,
  verifyNodeInstallation,
  verifyOpenClawInstallation,
  checkExistingInstallation,
} from './validation';

describe('Validation', () => {
  describe('validateAnthropicKey', () => {
    it('should accept valid Anthropic key', () => {
      const result = validateAnthropicKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('anthropic');
    });

    it('should reject empty key', () => {
      const result = validateAnthropicKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject key without sk-ant- prefix', () => {
      const result = validateAnthropicKey('sk-wrong-prefix-abcdefgh');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sk-ant-');
    });

    it('should reject short key', () => {
      const result = validateAnthropicKey('sk-ant-abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('short');
    });

    it('should reject key with invalid characters', () => {
      const result = validateAnthropicKey('sk-ant-abc$def@ghijklmnop');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  describe('validateOpenAIKey', () => {
    it('should accept valid OpenAI key', () => {
      const result = validateOpenAIKey('sk-proj-abcdefghijklmnopqrstuvwxyz');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('openai');
    });

    it('should reject empty key', () => {
      const result = validateOpenAIKey('');
      expect(result.valid).toBe(false);
    });

    it('should reject key without sk- prefix', () => {
      const result = validateOpenAIKey('wrong-prefix-abcdefghij');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sk-');
    });

    it('should reject short key', () => {
      const result = validateOpenAIKey('sk-abc');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAPIKey', () => {
    it('should route to anthropic validator', () => {
      const result = validateAPIKey('anthropic', 'sk-ant-api03-valid-key-here-12345');
      expect(result.valid).toBe(true);
    });

    it('should route to openai validator', () => {
      const result = validateAPIKey('openai', 'sk-proj-valid-key-here-12345678');
      expect(result.valid).toBe(true);
    });

    it('should handle generic provider', () => {
      const result = validateAPIKey('gemini', 'AIzaSyB-valid-key-here-1234567890');
      expect(result.valid).toBe(true);
    });

    it('should reject empty key for any provider', () => {
      const result = validateAPIKey('anthropic', '');
      expect(result.valid).toBe(false);
    });

    it('should reject short generic key', () => {
      const result = validateAPIKey('other', 'abc');
      expect(result.valid).toBe(false);
    });
  });

  describe('verifyNodeInstallation', () => {
    it('should return verification result', async () => {
      const result = await verifyNodeInstallation();
      expect(result).toHaveProperty('installed');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('meetsRequirement');
      expect(result).toHaveProperty('npmAvailable');
    });

    it('should detect node as installed', async () => {
      const result = await verifyNodeInstallation();
      expect(result.installed).toBe(true);
    });
  });

  describe('verifyOpenClawInstallation', () => {
    it('should return verification result', async () => {
      const result = await verifyOpenClawInstallation();
      expect(result).toHaveProperty('installed');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('commandInPath');
    });
  });

  describe('checkExistingInstallation', () => {
    it('should return installation status', async () => {
      const result = await checkExistingInstallation();
      expect(result).toHaveProperty('nodeInstalled');
      expect(result).toHaveProperty('nodeVersion');
      expect(result).toHaveProperty('openclawInstalled');
      expect(result).toHaveProperty('needsNodeInstall');
      expect(result).toHaveProperty('needsOpenclawInstall');
    });

    it('should detect if node needs install', async () => {
      const result = await checkExistingInstallation();
      expect(typeof result.needsNodeInstall).toBe('boolean');
      expect(typeof result.needsOpenclawInstall).toBe('boolean');
    });
  });
});
