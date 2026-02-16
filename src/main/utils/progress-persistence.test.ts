/**
 * feat-063: Progress persistence tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  saveProgress,
  loadProgress,
  clearProgress,
  hasRecentProgress,
  PersistedProgress,
} from './progress-persistence';

describe('progress-persistence', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `openclack-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // cleanup
    }
  });

  const sampleProgress: PersistedProgress = {
    currentStep: 'Installing Node.js',
    percentage: 45,
    timestamp: Date.now(),
    completedSteps: ['detecting', 'downloading'],
  };

  describe('saveProgress', () => {
    it('should save progress to a JSON file', async () => {
      await saveProgress(sampleProgress, testDir);

      const filePath = join(testDir, 'install-progress.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);

      expect(parsed.currentStep).toBe('Installing Node.js');
      expect(parsed.percentage).toBe(45);
      expect(parsed.completedSteps).toEqual(['detecting', 'downloading']);
    });

    it('should create directory if it does not exist', async () => {
      const nestedDir = join(testDir, 'nested', 'dir');
      await saveProgress(sampleProgress, nestedDir);

      const filePath = join(nestedDir, 'install-progress.json');
      const data = await fs.readFile(filePath, 'utf-8');
      expect(JSON.parse(data).percentage).toBe(45);
    });

    it('should overwrite existing progress', async () => {
      await saveProgress(sampleProgress, testDir);
      await saveProgress({ ...sampleProgress, percentage: 80 }, testDir);

      const loaded = await loadProgress(testDir);
      expect(loaded?.percentage).toBe(80);
    });
  });

  describe('loadProgress', () => {
    it('should load saved progress', async () => {
      await saveProgress(sampleProgress, testDir);
      const loaded = await loadProgress(testDir);

      expect(loaded).not.toBeNull();
      expect(loaded?.currentStep).toBe('Installing Node.js');
      expect(loaded?.percentage).toBe(45);
    });

    it('should return null when no progress file exists', async () => {
      const loaded = await loadProgress(testDir);
      expect(loaded).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const filePath = join(testDir, 'install-progress.json');
      await fs.writeFile(filePath, 'invalid json{{{', 'utf-8');

      const loaded = await loadProgress(testDir);
      expect(loaded).toBeNull();
    });
  });

  describe('clearProgress', () => {
    it('should remove the progress file', async () => {
      await saveProgress(sampleProgress, testDir);
      await clearProgress(testDir);

      const loaded = await loadProgress(testDir);
      expect(loaded).toBeNull();
    });

    it('should not throw when no progress file exists', async () => {
      await expect(clearProgress(testDir)).resolves.not.toThrow();
    });
  });

  describe('hasRecentProgress', () => {
    it('should return true for recent progress', async () => {
      await saveProgress({ ...sampleProgress, timestamp: Date.now() }, testDir);
      const recent = await hasRecentProgress(3600000, testDir);
      expect(recent).toBe(true);
    });

    it('should return false for old progress', async () => {
      const oldTimestamp = Date.now() - 7200000; // 2 hours ago
      await saveProgress({ ...sampleProgress, timestamp: oldTimestamp }, testDir);
      const recent = await hasRecentProgress(3600000, testDir);
      expect(recent).toBe(false);
    });

    it('should return false when no progress exists', async () => {
      const recent = await hasRecentProgress(3600000, testDir);
      expect(recent).toBe(false);
    });
  });
});
