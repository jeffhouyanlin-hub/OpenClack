/**
 * Progress Persistence - feat-063: Progress persistence
 * Saves and loads installation progress to disk for recovery after crashes
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface PersistedProgress {
  currentStep: string;
  percentage: number;
  timestamp: number;
  completedSteps: string[];
}

const DEFAULT_PERSIST_DIR = join(homedir(), '.openclaw');
const PROGRESS_FILE = 'install-progress.json';

/**
 * Saves installation progress to disk
 */
export async function saveProgress(
  progress: PersistedProgress,
  persistDir: string = DEFAULT_PERSIST_DIR
): Promise<void> {
  const filePath = join(persistDir, PROGRESS_FILE);
  await fs.mkdir(persistDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(progress, null, 2), 'utf-8');
}

/**
 * Loads installation progress from disk
 * Returns null if no progress file exists
 */
export async function loadProgress(
  persistDir: string = DEFAULT_PERSIST_DIR
): Promise<PersistedProgress | null> {
  const filePath = join(persistDir, PROGRESS_FILE);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as PersistedProgress;
  } catch {
    return null;
  }
}

/**
 * Clears saved progress from disk
 */
export async function clearProgress(
  persistDir: string = DEFAULT_PERSIST_DIR
): Promise<void> {
  const filePath = join(persistDir, PROGRESS_FILE);
  try {
    await fs.unlink(filePath);
  } catch {
    // File might not exist, that's fine
  }
}

/**
 * Checks if saved progress exists and is recent (within maxAgeMs)
 */
export async function hasRecentProgress(
  maxAgeMs: number = 3600000, // 1 hour default
  persistDir: string = DEFAULT_PERSIST_DIR
): Promise<boolean> {
  const progress = await loadProgress(persistDir);
  if (!progress) return false;
  return (Date.now() - progress.timestamp) < maxAgeMs;
}
