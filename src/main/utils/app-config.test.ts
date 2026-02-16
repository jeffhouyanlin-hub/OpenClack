/**
 * feat-079-080: Configuration management tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getDefaultPreferences,
  loadPreferences,
  savePreferences,
  validatePreferences,
} from './app-config';

describe('app-config', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `openclack-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // cleanup
    }
  });

  describe('getDefaultPreferences', () => {
    it('should return default preferences', () => {
      const prefs = getDefaultPreferences();
      expect(prefs.theme).toBe('system');
      expect(prefs.language).toBe('en');
      expect(prefs.autoUpdate).toBe(true);
      expect(prefs.telemetryOptIn).toBe(false);
      expect(prefs.logLevel).toBe('info');
    });

    it('should return a new object each time', () => {
      const prefs1 = getDefaultPreferences();
      const prefs2 = getDefaultPreferences();
      expect(prefs1).not.toBe(prefs2);
      expect(prefs1).toEqual(prefs2);
    });
  });

  describe('loadPreferences', () => {
    it('should return defaults when no file exists', async () => {
      const prefs = await loadPreferences(testDir);
      expect(prefs.theme).toBe('system');
      expect(prefs.language).toBe('en');
    });

    it('should load saved preferences', async () => {
      const saved = { theme: 'dark', language: 'fr' };
      await fs.writeFile(
        join(testDir, 'preferences.json'),
        JSON.stringify(saved),
        'utf-8'
      );

      const prefs = await loadPreferences(testDir);
      expect(prefs.theme).toBe('dark');
      expect(prefs.language).toBe('fr');
      // Should still have defaults for unsaved fields
      expect(prefs.autoUpdate).toBe(true);
    });

    it('should return defaults for invalid JSON', async () => {
      await fs.writeFile(
        join(testDir, 'preferences.json'),
        'invalid{{{',
        'utf-8'
      );

      const prefs = await loadPreferences(testDir);
      expect(prefs).toEqual(getDefaultPreferences());
    });
  });

  describe('savePreferences', () => {
    it('should save preferences to disk', async () => {
      await savePreferences({ theme: 'dark' }, testDir);

      const data = await fs.readFile(join(testDir, 'preferences.json'), 'utf-8');
      const parsed = JSON.parse(data);
      expect(parsed.theme).toBe('dark');
    });

    it('should merge with existing preferences', async () => {
      await savePreferences({ theme: 'dark' }, testDir);
      await savePreferences({ language: 'de' }, testDir);

      const prefs = await loadPreferences(testDir);
      expect(prefs.theme).toBe('dark');
      expect(prefs.language).toBe('de');
    });

    it('should create directory if it does not exist', async () => {
      const nestedDir = join(testDir, 'nested', 'config');
      await savePreferences({ theme: 'light' }, nestedDir);

      const prefs = await loadPreferences(nestedDir);
      expect(prefs.theme).toBe('light');
    });
  });

  describe('validatePreferences', () => {
    it('should return no errors for valid preferences', () => {
      const errors = validatePreferences({
        theme: 'dark',
        logLevel: 'debug',
        language: 'en',
      });
      expect(errors).toHaveLength(0);
    });

    it('should report invalid theme', () => {
      const errors = validatePreferences({ theme: 'neon' as any });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid theme');
    });

    it('should report invalid log level', () => {
      const errors = validatePreferences({ logLevel: 'verbose' as any });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid log level');
    });

    it('should return empty array for empty preferences', () => {
      const errors = validatePreferences({});
      expect(errors).toHaveLength(0);
    });
  });
});
