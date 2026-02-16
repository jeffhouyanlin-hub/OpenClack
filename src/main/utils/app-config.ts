/**
 * App Configuration - feat-079-080: Configuration management
 * Manages user preferences and application configuration
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoUpdate: boolean;
  telemetryOptIn: boolean;
  installPath?: string;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
}

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  language: 'en',
  autoUpdate: true,
  telemetryOptIn: false,
  logLevel: 'info',
};

const CONFIG_DIR = join(homedir(), '.openclaw');
const CONFIG_FILE = 'preferences.json';

/**
 * Gets default preferences
 */
export function getDefaultPreferences(): AppPreferences {
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Loads user preferences from disk, falling back to defaults
 */
export async function loadPreferences(
  configDir: string = CONFIG_DIR
): Promise<AppPreferences> {
  const filePath = join(configDir, CONFIG_FILE);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Saves user preferences to disk
 */
export async function savePreferences(
  prefs: Partial<AppPreferences>,
  configDir: string = CONFIG_DIR
): Promise<void> {
  const filePath = join(configDir, CONFIG_FILE);
  const current = await loadPreferences(configDir);
  const merged = { ...current, ...prefs };
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8');
}

/**
 * Validates a preferences object
 */
export function validatePreferences(prefs: Partial<AppPreferences>): string[] {
  const errors: string[] = [];

  if (prefs.theme && !['light', 'dark', 'system'].includes(prefs.theme)) {
    errors.push(`Invalid theme: ${prefs.theme}`);
  }

  if (prefs.logLevel && !['debug', 'info', 'warning', 'error'].includes(prefs.logLevel)) {
    errors.push(`Invalid log level: ${prefs.logLevel}`);
  }

  if (prefs.language && typeof prefs.language !== 'string') {
    errors.push('Language must be a string');
  }

  return errors;
}
