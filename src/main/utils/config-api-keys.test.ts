/**
 * Test suite for API key configuration functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';
import { promises as fs } from 'fs';
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import {
  locateOpenClawConfig,
  readOrCreateConfig,
  mergeAPIKeys,
  writeConfigWithPermissions,
  configureAPIKeys,
} from './installer';

describe('API Key Configuration', () => {
  describe('locateOpenClawConfig', () => {
    it('should return config path in home directory', () => {
      const configPath = locateOpenClawConfig();
      expect(configPath).toContain('.openclaw');
      expect(configPath).toContain('config.json');
      expect(configPath).toBe(join(homedir(), '.openclaw', 'config.json'));
    });

    it('should return consistent path across multiple calls', () => {
      const path1 = locateOpenClawConfig();
      const path2 = locateOpenClawConfig();
      expect(path1).toBe(path2);
    });

    it('should include .openclaw directory in path', () => {
      const configPath = locateOpenClawConfig();
      expect(configPath).toContain('.openclaw');
    });

    it('should include config.json filename', () => {
      const configPath = locateOpenClawConfig();
      expect(configPath).toContain('config.json');
    });
  });

  describe('readOrCreateConfig', () => {
    let tempDir: string;

    beforeEach(async () => {
      // Create a temporary directory for testing
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-test-'));
    });

    afterEach(async () => {
      // Clean up temporary directory
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should read existing config file', async () => {
      const mockConfig = { apiKeys: { anthropic: 'sk-ant-test' } };
      const configPath = join(tempDir, 'config.json');
      await writeFile(configPath, JSON.stringify(mockConfig));

      const config = await readOrCreateConfig(configPath);

      expect(config).toEqual(mockConfig);
    });

    it('should return empty config if file does not exist', async () => {
      const configPath = join(tempDir, 'nonexistent.json');
      const config = await readOrCreateConfig(configPath);

      expect(config).toEqual({});
    });

    it('should return empty config if JSON is invalid', async () => {
      const configPath = join(tempDir, 'invalid.json');
      await writeFile(configPath, 'invalid json {');

      const config = await readOrCreateConfig(configPath);

      expect(config).toEqual({});
    });

    it('should return empty config if parsed result is not an object', async () => {
      const configPath = join(tempDir, 'array.json');
      await writeFile(configPath, '["array", "not", "object"]');

      const config = await readOrCreateConfig(configPath);

      expect(config).toEqual({});
    });

    it('should return empty config if parsed result is null', async () => {
      const configPath = join(tempDir, 'null.json');
      await writeFile(configPath, 'null');

      const config = await readOrCreateConfig(configPath);

      expect(config).toEqual({});
    });

    it('should handle existing config with multiple keys', async () => {
      const mockConfig = {
        apiKeys: { anthropic: 'key1', openai: 'key2' },
        otherSetting: 'value',
      };
      const configPath = join(tempDir, 'config.json');
      await writeFile(configPath, JSON.stringify(mockConfig));

      const config = await readOrCreateConfig(configPath);

      expect(config).toEqual(mockConfig);
    });
  });

  describe('mergeAPIKeys', () => {
    it('should merge API keys into empty config', () => {
      const config = {};
      const apiKeys = { anthropic: 'sk-ant-test', openai: 'sk-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys).toEqual(apiKeys);
    });

    it('should merge API keys into existing config', () => {
      const config = { someOtherSetting: 'value' };
      const apiKeys = { anthropic: 'sk-ant-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys).toEqual(apiKeys);
      expect(result.someOtherSetting).toBe('value');
    });

    it('should preserve existing config values', () => {
      const config = { setting1: 'a', setting2: 'b' };
      const apiKeys = { anthropic: 'sk-ant-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.setting1).toBe('a');
      expect(result.setting2).toBe('b');
      expect(result.apiKeys).toEqual(apiKeys);
    });

    it('should update existing API keys', () => {
      const config = { apiKeys: { anthropic: 'old-key' } };
      const apiKeys = { anthropic: 'new-key', openai: 'sk-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys.anthropic).toBe('new-key');
      expect(result.apiKeys.openai).toBe('sk-test');
    });

    it('should skip empty string API keys', () => {
      const config = {};
      const apiKeys = { anthropic: '', openai: 'sk-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys).toEqual({ openai: 'sk-test' });
      expect(result.apiKeys.anthropic).toBeUndefined();
    });

    it('should skip undefined API keys', () => {
      const config = {};
      const apiKeys = { anthropic: undefined, openai: 'sk-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys).toEqual({ openai: 'sk-test' });
    });

    it('should trim whitespace from API keys', () => {
      const config = {};
      const apiKeys = { anthropic: '  sk-ant-test  ', openai: 'sk-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys.anthropic).toBe('sk-ant-test');
      expect(result.apiKeys.openai).toBe('sk-test');
    });

    it('should skip whitespace-only API keys', () => {
      const config = {};
      const apiKeys = { anthropic: '   ', openai: 'sk-test' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys).toEqual({ openai: 'sk-test' });
      expect(result.apiKeys.anthropic).toBeUndefined();
    });

    it('should return unchanged config if no API keys provided', () => {
      const config = { existingSetting: 'value' };

      const result = mergeAPIKeys(config, undefined);

      expect(result).toEqual(config);
    });

    it('should return unchanged config if API keys object is empty', () => {
      const config = { existingSetting: 'value' };

      const result = mergeAPIKeys(config, {});

      expect(result).toEqual(config);
    });

    it('should handle custom API provider keys', () => {
      const config = {};
      const apiKeys = { anthropic: 'key1', 'custom-provider': 'custom-key' };

      const result = mergeAPIKeys(config, apiKeys);

      expect(result.apiKeys).toEqual(apiKeys);
    });
  });

  describe('writeConfigWithPermissions', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should write config to file', async () => {
      const config = { apiKeys: { anthropic: 'sk-ant-test' } };
      const configPath = join(tempDir, 'config.json');

      const result = await writeConfigWithPermissions(configPath, config);

      expect(result.success).toBe(true);
      expect(result.configPath).toBe(configPath);

      const written = await readFile(configPath, 'utf-8');
      expect(JSON.parse(written)).toEqual(config);
    });

    it('should create config directory if it does not exist', async () => {
      const config = { apiKeys: { anthropic: 'sk-ant-test' } };
      const configPath = join(tempDir, 'subdir', 'config.json');

      const result = await writeConfigWithPermissions(configPath, config);

      expect(result.success).toBe(true);
      const written = await readFile(configPath, 'utf-8');
      expect(JSON.parse(written)).toEqual(config);
    });

    it('should write config with proper JSON formatting', async () => {
      const config = { apiKeys: { anthropic: 'sk-ant-test' } };
      const configPath = join(tempDir, 'config.json');

      await writeConfigWithPermissions(configPath, config);

      const written = await readFile(configPath, 'utf-8');
      const expectedJson = JSON.stringify(config, null, 2);
      expect(written).toBe(expectedJson);
    });

    it('should call progress callback during write', async () => {
      const progressCallback = vi.fn();
      const config = { apiKeys: { anthropic: 'sk-ant-test' } };
      const configPath = join(tempDir, 'config.json');

      await writeConfigWithPermissions(configPath, config, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.stringContaining('Writing'),
        'info'
      );
    });
  });

  describe('configureAPIKeys', () => {
    let tempDir: string;
    let originalLocate: typeof locateOpenClawConfig;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-test-'));
      // Mock locateOpenClawConfig to use temp directory
      originalLocate = locateOpenClawConfig;
      vi.spyOn(await import('./installer'), 'locateOpenClawConfig').mockReturnValue(
        join(tempDir, '.openclaw', 'config.json')
      );
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it('should configure API keys successfully', async () => {
      const apiKeys = { anthropic: 'sk-ant-test', openai: 'sk-test' };
      const result = await configureAPIKeys(apiKeys);

      expect(result.success).toBe(true);
      expect(result.configPath).toBeDefined();
    });

    it('should skip configuration if no API keys provided', async () => {
      const result = await configureAPIKeys(undefined);

      expect(result.success).toBe(true);
    });

    it('should skip configuration if API keys object is empty', async () => {
      const result = await configureAPIKeys({});

      expect(result.success).toBe(true);
    });

    it('should call progress callback during configuration', async () => {
      const progressCallback = vi.fn();
      const apiKeys = { anthropic: 'sk-ant-test' };

      await configureAPIKeys(apiKeys, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.stringContaining('Configuring'),
        'info'
      );
    });

    it('should handle multiple API keys', async () => {
      const apiKeys = {
        anthropic: 'sk-ant-test',
        openai: 'sk-test',
        gemini: 'gemini-key',
      };

      const result = await configureAPIKeys(apiKeys);

      expect(result.success).toBe(true);
    });

    it('should return ConfigWriteResult structure', async () => {
      const apiKeys = { anthropic: 'sk-ant-test' };
      const result = await configureAPIKeys(apiKeys);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Integration Tests', () => {
    let tempDir: string;
    let configPath: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-test-'));
      configPath = join(tempDir, 'config.json');
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should complete full flow: read, merge, write', async () => {
      // Start with empty config
      let config = await readOrCreateConfig(configPath);
      expect(config).toEqual({});

      // Merge API keys
      const apiKeys = { anthropic: 'sk-ant-test', openai: 'sk-test' };
      config = mergeAPIKeys(config, apiKeys);
      expect(config.apiKeys).toEqual(apiKeys);

      // Write config
      const result = await writeConfigWithPermissions(configPath, config);
      expect(result.success).toBe(true);

      // Verify written content
      const written = await readFile(configPath, 'utf-8');
      const parsed = JSON.parse(written);
      expect(parsed.apiKeys).toEqual(apiKeys);
    });

    it('should preserve existing settings when merging new API keys', async () => {
      // Write initial config
      const initial = {
        apiKeys: { anthropic: 'old-key' },
        otherSetting: 'preserve-me',
        nested: { value: 123 },
      };
      await writeFile(configPath, JSON.stringify(initial));

      // Read existing config
      let config = await readOrCreateConfig(configPath);
      expect(config).toEqual(initial);

      // Merge new API key
      const newKeys = { openai: 'sk-test' };
      config = mergeAPIKeys(config, newKeys);

      // Write updated config
      await writeConfigWithPermissions(configPath, config);

      // Verify all settings preserved
      const written = await readFile(configPath, 'utf-8');
      const parsed = JSON.parse(written);
      expect(parsed.otherSetting).toBe('preserve-me');
      expect(parsed.nested).toEqual({ value: 123 });
      expect(parsed.apiKeys.anthropic).toBe('old-key');
      expect(parsed.apiKeys.openai).toBe('sk-test');
    });
  });
});
