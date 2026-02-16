/**
 * feat-049: Config operations tests
 *
 * Tests readOrCreateConfig, mergeAPIKeys, writeConfigWithPermissions,
 * including reading existing configs, creating new ones, merging keys,
 * and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';
import { mkdtemp, rm, writeFile, readFile, stat } from 'fs/promises';
import { tmpdir } from 'os';
import {
  locateOpenClawConfig,
  readOrCreateConfig,
  mergeAPIKeys,
  writeConfigWithPermissions,
  configureAPIKeys,
} from './installer';

describe('Config Operations (feat-049)', () => {
  describe('readOrCreateConfig', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-config-ops-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    describe('Reading existing config', () => {
      it('should read a valid JSON config file', async () => {
        const config = { apiKeys: { anthropic: 'sk-ant-test' }, version: 1 };
        const configPath = join(tempDir, 'config.json');
        await writeFile(configPath, JSON.stringify(config));

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual(config);
      });

      it('should read a config with nested objects', async () => {
        const config = {
          apiKeys: { anthropic: 'key1', openai: 'key2' },
          settings: { theme: 'dark', verbose: true },
          metadata: { created: '2024-01-01' },
        };
        const configPath = join(tempDir, 'config.json');
        await writeFile(configPath, JSON.stringify(config));

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual(config);
      });

      it('should read a config with empty apiKeys object', async () => {
        const config = { apiKeys: {} };
        const configPath = join(tempDir, 'config.json');
        await writeFile(configPath, JSON.stringify(config));

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual(config);
      });

      it('should read a minimal empty object config', async () => {
        const configPath = join(tempDir, 'config.json');
        await writeFile(configPath, '{}');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should read config with whitespace formatting', async () => {
        const config = { key: 'value' };
        const configPath = join(tempDir, 'config.json');
        await writeFile(configPath, JSON.stringify(config, null, 2));

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual(config);
      });
    });

    describe('Creating new config (file does not exist)', () => {
      it('should return empty object when file does not exist', async () => {
        const configPath = join(tempDir, 'nonexistent', 'config.json');
        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for a path in a non-existent directory', async () => {
        const configPath = join(tempDir, 'deep', 'nested', 'dir', 'config.json');
        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });
    });

    describe('Error handling', () => {
      it('should return empty object for invalid JSON', async () => {
        const configPath = join(tempDir, 'invalid.json');
        await writeFile(configPath, '{ invalid json content }');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for a JSON array', async () => {
        const configPath = join(tempDir, 'array.json');
        await writeFile(configPath, '[1, 2, 3]');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for JSON null', async () => {
        const configPath = join(tempDir, 'null.json');
        await writeFile(configPath, 'null');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for JSON string', async () => {
        const configPath = join(tempDir, 'string.json');
        await writeFile(configPath, '"just a string"');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for JSON number', async () => {
        const configPath = join(tempDir, 'number.json');
        await writeFile(configPath, '42');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for JSON boolean', async () => {
        const configPath = join(tempDir, 'bool.json');
        await writeFile(configPath, 'true');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for empty file', async () => {
        const configPath = join(tempDir, 'empty.json');
        await writeFile(configPath, '');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });

      it('should return empty object for truncated JSON', async () => {
        const configPath = join(tempDir, 'truncated.json');
        await writeFile(configPath, '{"apiKeys": {"anthropic":');

        const result = await readOrCreateConfig(configPath);
        expect(result).toEqual({});
      });
    });
  });

  describe('mergeAPIKeys', () => {
    describe('Basic merging', () => {
      it('should add apiKeys section to empty config', () => {
        const result = mergeAPIKeys({}, { anthropic: 'key1' });
        expect(result.apiKeys).toBeDefined();
        expect(result.apiKeys.anthropic).toBe('key1');
      });

      it('should merge multiple keys at once', () => {
        const result = mergeAPIKeys({}, { anthropic: 'key1', openai: 'key2', gemini: 'key3' });
        expect(result.apiKeys.anthropic).toBe('key1');
        expect(result.apiKeys.openai).toBe('key2');
        expect(result.apiKeys.gemini).toBe('key3');
      });

      it('should preserve existing non-apiKeys config properties', () => {
        const config = { theme: 'dark', version: 2, nested: { a: 1 } };
        const result = mergeAPIKeys(config, { anthropic: 'key1' });

        expect(result.theme).toBe('dark');
        expect(result.version).toBe(2);
        expect(result.nested).toEqual({ a: 1 });
        expect(result.apiKeys.anthropic).toBe('key1');
      });
    });

    describe('Updating existing keys', () => {
      it('should update existing API key value', () => {
        const config = { apiKeys: { anthropic: 'old-key' } };
        const result = mergeAPIKeys(config, { anthropic: 'new-key' });
        expect(result.apiKeys.anthropic).toBe('new-key');
      });

      it('should add new key while preserving existing keys', () => {
        const config = { apiKeys: { anthropic: 'key1' } };
        const result = mergeAPIKeys(config, { openai: 'key2' });
        expect(result.apiKeys.anthropic).toBe('key1');
        expect(result.apiKeys.openai).toBe('key2');
      });

      it('should not modify original config object', () => {
        const config = { apiKeys: { anthropic: 'original' } };
        const result = mergeAPIKeys(config, { anthropic: 'updated' });

        expect(config.apiKeys.anthropic).toBe('original');
        expect(result.apiKeys.anthropic).toBe('updated');
      });
    });

    describe('Filtering invalid keys', () => {
      it('should skip empty string keys', () => {
        const result = mergeAPIKeys({}, { anthropic: '', openai: 'valid-key' });
        expect(result.apiKeys.anthropic).toBeUndefined();
        expect(result.apiKeys.openai).toBe('valid-key');
      });

      it('should skip undefined keys', () => {
        const result = mergeAPIKeys({}, { anthropic: undefined, openai: 'valid-key' });
        expect(result.apiKeys.anthropic).toBeUndefined();
        expect(result.apiKeys.openai).toBe('valid-key');
      });

      it('should skip whitespace-only keys', () => {
        const result = mergeAPIKeys({}, { anthropic: '   ', openai: 'valid-key' });
        expect(result.apiKeys.anthropic).toBeUndefined();
        expect(result.apiKeys.openai).toBe('valid-key');
      });

      it('should trim whitespace from key values', () => {
        const result = mergeAPIKeys({}, { anthropic: '  sk-ant-test  ' });
        expect(result.apiKeys.anthropic).toBe('sk-ant-test');
      });
    });

    describe('Edge cases', () => {
      it('should return config unchanged when apiKeys is undefined', () => {
        const config = { setting: 'value' };
        const result = mergeAPIKeys(config, undefined);
        expect(result).toEqual(config);
      });

      it('should return config unchanged when apiKeys is empty object', () => {
        const config = { setting: 'value' };
        const result = mergeAPIKeys(config, {});
        expect(result).toEqual(config);
      });

      it('should handle config with non-object apiKeys field', () => {
        const config = { apiKeys: 'not-an-object' as any };
        const result = mergeAPIKeys(config, { anthropic: 'key1' });
        expect(result.apiKeys).toEqual({ anthropic: 'key1' });
      });

      it('should handle custom provider names', () => {
        const result = mergeAPIKeys({}, { 'my-custom-provider': 'custom-key-value' });
        expect(result.apiKeys['my-custom-provider']).toBe('custom-key-value');
      });

      it('should handle config with deeply nested existing structure', () => {
        const config = {
          apiKeys: { anthropic: 'existing' },
          deep: { nested: { structure: { value: 42 } } },
        };
        const result = mergeAPIKeys(config, { openai: 'new-key' });

        expect(result.deep).toEqual({ nested: { structure: { value: 42 } } });
        expect(result.apiKeys.anthropic).toBe('existing');
        expect(result.apiKeys.openai).toBe('new-key');
      });
    });
  });

  describe('writeConfigWithPermissions', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-write-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    describe('Successful writes', () => {
      it('should write config to file and return success', async () => {
        const config = { apiKeys: { anthropic: 'sk-ant-test' } };
        const configPath = join(tempDir, 'config.json');

        const result = await writeConfigWithPermissions(configPath, config);

        expect(result.success).toBe(true);
        expect(result.configPath).toBe(configPath);
      });

      it('should write valid JSON content', async () => {
        const config = { apiKeys: { anthropic: 'sk-ant-test' } };
        const configPath = join(tempDir, 'config.json');

        await writeConfigWithPermissions(configPath, config);

        const content = await readFile(configPath, 'utf-8');
        expect(JSON.parse(content)).toEqual(config);
      });

      it('should write with 2-space indentation', async () => {
        const config = { key: 'value' };
        const configPath = join(tempDir, 'config.json');

        await writeConfigWithPermissions(configPath, config);

        const content = await readFile(configPath, 'utf-8');
        expect(content).toBe(JSON.stringify(config, null, 2));
      });

      it('should create parent directories if they do not exist', async () => {
        const config = { apiKeys: { openai: 'sk-test' } };
        const configPath = join(tempDir, 'new-subdir', 'config.json');

        const result = await writeConfigWithPermissions(configPath, config);

        expect(result.success).toBe(true);
        const content = await readFile(configPath, 'utf-8');
        expect(JSON.parse(content)).toEqual(config);
      });

      it('should overwrite existing file', async () => {
        const configPath = join(tempDir, 'config.json');
        await writeFile(configPath, JSON.stringify({ old: 'data' }));

        const newConfig = { apiKeys: { anthropic: 'new-key' } };
        await writeConfigWithPermissions(configPath, newConfig);

        const content = await readFile(configPath, 'utf-8');
        expect(JSON.parse(content)).toEqual(newConfig);
      });
    });

    describe('Progress callback', () => {
      it('should call progress callback with info messages', async () => {
        const progressFn = vi.fn();
        const configPath = join(tempDir, 'config.json');

        await writeConfigWithPermissions(configPath, { key: 'val' }, progressFn);

        expect(progressFn).toHaveBeenCalled();
        // Should have been called with 'info' level at least once
        const infoCalls = progressFn.mock.calls.filter(
          (call: [string, string]) => call[1] === 'info'
        );
        expect(infoCalls.length).toBeGreaterThan(0);
      });

      it('should include config path in progress message', async () => {
        const progressFn = vi.fn();
        const configPath = join(tempDir, 'config.json');

        await writeConfigWithPermissions(configPath, { key: 'val' }, progressFn);

        const messages = progressFn.mock.calls.map((call: [string, string]) => call[0]);
        expect(messages.some((m: string) => m.includes(configPath))).toBe(true);
      });

      it('should work without progress callback', async () => {
        const configPath = join(tempDir, 'config.json');
        const result = await writeConfigWithPermissions(configPath, { key: 'val' });
        expect(result.success).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should return error result on write failure', async () => {
        // Try to write to a path that would fail (readonly directory etc.)
        // We can simulate this by writing to an invalid path
        const configPath = '/dev/null/impossible/path/config.json';

        const result = await writeConfigWithPermissions(configPath, { key: 'val' });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should call progress callback with error on failure', async () => {
        const progressFn = vi.fn();
        const configPath = '/dev/null/impossible/path/config.json';

        await writeConfigWithPermissions(configPath, { key: 'val' }, progressFn);

        const errorCalls = progressFn.mock.calls.filter(
          (call: [string, string]) => call[1] === 'error'
        );
        expect(errorCalls.length).toBeGreaterThan(0);
      });
    });

    describe('File permissions', () => {
      it('should set restrictive permissions on config file', async () => {
        const configPath = join(tempDir, 'config.json');
        await writeConfigWithPermissions(configPath, { secret: 'key' });

        const fileStats = await stat(configPath);
        // File should be 0600 (owner read/write only)
        const mode = fileStats.mode & 0o777;
        expect(mode).toBe(0o600);
      });
    });
  });

  describe('Integration: Read -> Merge -> Write -> Read', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'openclaw-integration-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should complete full cycle with new config', async () => {
      const configPath = join(tempDir, 'config.json');

      // Read (creates empty)
      let config = await readOrCreateConfig(configPath);
      expect(config).toEqual({});

      // Merge
      config = mergeAPIKeys(config, { anthropic: 'sk-ant-key1', openai: 'sk-key2' });

      // Write
      const writeResult = await writeConfigWithPermissions(configPath, config);
      expect(writeResult.success).toBe(true);

      // Read back
      const readBack = await readOrCreateConfig(configPath);
      expect(readBack.apiKeys.anthropic).toBe('sk-ant-key1');
      expect(readBack.apiKeys.openai).toBe('sk-key2');
    });

    it('should preserve existing settings across merge cycles', async () => {
      const configPath = join(tempDir, 'config.json');

      // Initial config
      const initial = { theme: 'dark', apiKeys: { anthropic: 'key1' } };
      await writeFile(configPath, JSON.stringify(initial));

      // Read
      let config = await readOrCreateConfig(configPath);
      expect(config.theme).toBe('dark');

      // Merge new key
      config = mergeAPIKeys(config, { openai: 'key2' });

      // Write
      await writeConfigWithPermissions(configPath, config);

      // Read back and verify
      const readBack = await readOrCreateConfig(configPath);
      expect(readBack.theme).toBe('dark');
      expect(readBack.apiKeys.anthropic).toBe('key1');
      expect(readBack.apiKeys.openai).toBe('key2');
    });

    it('should handle multiple sequential merges', async () => {
      const configPath = join(tempDir, 'config.json');

      // First merge
      let config = await readOrCreateConfig(configPath);
      config = mergeAPIKeys(config, { anthropic: 'key1' });
      await writeConfigWithPermissions(configPath, config);

      // Second merge
      config = await readOrCreateConfig(configPath);
      config = mergeAPIKeys(config, { openai: 'key2' });
      await writeConfigWithPermissions(configPath, config);

      // Third merge
      config = await readOrCreateConfig(configPath);
      config = mergeAPIKeys(config, { gemini: 'key3' });
      await writeConfigWithPermissions(configPath, config);

      // Verify all keys present
      const final = await readOrCreateConfig(configPath);
      expect(final.apiKeys.anthropic).toBe('key1');
      expect(final.apiKeys.openai).toBe('key2');
      expect(final.apiKeys.gemini).toBe('key3');
    });

    it('should handle key updates correctly', async () => {
      const configPath = join(tempDir, 'config.json');

      // Initial key
      let config = await readOrCreateConfig(configPath);
      config = mergeAPIKeys(config, { anthropic: 'old-key' });
      await writeConfigWithPermissions(configPath, config);

      // Update key
      config = await readOrCreateConfig(configPath);
      config = mergeAPIKeys(config, { anthropic: 'new-key' });
      await writeConfigWithPermissions(configPath, config);

      // Verify updated
      const final = await readOrCreateConfig(configPath);
      expect(final.apiKeys.anthropic).toBe('new-key');
    });
  });

  describe('locateOpenClawConfig', () => {
    it('should return a path containing .openclaw directory', () => {
      const path = locateOpenClawConfig();
      expect(path).toContain('.openclaw');
    });

    it('should return a path ending with config.json', () => {
      const path = locateOpenClawConfig();
      expect(path.endsWith('config.json')).toBe(true);
    });

    it('should return a path based on homedir', () => {
      const path = locateOpenClawConfig();
      expect(path).toBe(join(homedir(), '.openclaw', 'config.json'));
    });

    it('should return the same path on repeated calls', () => {
      expect(locateOpenClawConfig()).toBe(locateOpenClawConfig());
    });
  });
});
