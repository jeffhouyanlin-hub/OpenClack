/**
 * Data Sanitization Utilities
 * Sanitizes all data passed through IPC to prevent injection attacks and ensure data integrity
 */

import {
  InstallConfig,
  InstallProgress,
  LogEntry,
  InstallError,
  InstallResult,
  SystemInfo,
} from '../../types/ipc';

/**
 * Sanitize a string to prevent command injection and XSS
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes which can be used for command injection
  let sanitized = input.replace(/\0/g, '');

  // Limit length to prevent DoS attacks
  const MAX_STRING_LENGTH = 10000;
  if (sanitized.length > MAX_STRING_LENGTH) {
    sanitized = sanitized.substring(0, MAX_STRING_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize a path to prevent directory traversal attacks
 */
export function sanitizePath(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = sanitizeString(input);

  // Remove potential directory traversal sequences
  // Note: We keep single dots and slashes as they're needed for valid paths
  // But we remove the dangerous combinations
  sanitized = sanitized.replace(/\.\.\//g, ''); // Remove ../
  sanitized = sanitized.replace(/\.\.\\/g, ''); // Remove ..\

  // Remove null bytes specifically for paths
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitize API key to ensure it's a valid format
 */
export function sanitizeAPIKey(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  // API keys should only contain alphanumeric characters, hyphens, and underscores
  // This prevents shell injection through API keys
  const sanitized = input.replace(/[^a-zA-Z0-9\-_]/g, '');

  // Enforce reasonable length limits
  const MAX_API_KEY_LENGTH = 500;
  if (sanitized.length > MAX_API_KEY_LENGTH) {
    return sanitized.substring(0, MAX_API_KEY_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize a number to ensure it's within reasonable bounds
 */
export function sanitizeNumber(input: unknown, min = -Infinity, max = Infinity): number {
  if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
    return 0;
  }

  return Math.max(min, Math.min(max, input));
}

/**
 * Sanitize a boolean value
 */
export function sanitizeBoolean(input: unknown): boolean {
  return Boolean(input);
}

/**
 * Sanitize InstallConfig from renderer
 * Note: This only sanitizes strings and numbers for injection attacks.
 * The caller should still validate the overall structure with isValidInstallConfig.
 */
export function sanitizeInstallConfig(config: unknown): InstallConfig {
  if (!config || typeof config !== 'object') {
    return {};
  }

  const cfg = config as Partial<InstallConfig>;
  const sanitized: InstallConfig = {};

  // Sanitize API keys - only if it's an object
  if (cfg.apiKeys !== undefined) {
    if (typeof cfg.apiKeys === 'object' && cfg.apiKeys !== null) {
      sanitized.apiKeys = {};

      const apiKeys = cfg.apiKeys as Record<string, unknown>;
      for (const [key, value] of Object.entries(apiKeys)) {
        const sanitizedKey = sanitizeString(key);
        if (sanitizedKey && value !== undefined && typeof value === 'string') {
          sanitized.apiKeys[sanitizedKey] = sanitizeAPIKey(value);
        }
      }
    } else {
      // Preserve the invalid value so validation can catch it
      sanitized.apiKeys = cfg.apiKeys as any;
    }
  }

  // Sanitize skipNodeInstall - only if it's a boolean
  if (cfg.skipNodeInstall !== undefined) {
    if (typeof cfg.skipNodeInstall === 'boolean') {
      sanitized.skipNodeInstall = cfg.skipNodeInstall;
    } else {
      // Preserve the invalid value so validation can catch it
      sanitized.skipNodeInstall = cfg.skipNodeInstall as any;
    }
  }

  // Sanitize installPath - only if it's a string
  if (cfg.installPath !== undefined) {
    if (typeof cfg.installPath === 'string') {
      sanitized.installPath = sanitizePath(cfg.installPath);
    } else {
      // Preserve the invalid value so validation can catch it
      sanitized.installPath = cfg.installPath as any;
    }
  }

  return sanitized;
}

/**
 * Sanitize InstallProgress before sending to renderer
 */
export function sanitizeInstallProgress(progress: InstallProgress): InstallProgress {
  const validPhases = ['detecting', 'installing-node', 'installing-openclaw', 'onboarding', 'configuring', 'complete'] as const;
  const phase = validPhases.includes(progress.phase as any)
    ? progress.phase
    : 'detecting';

  return {
    phase,
    percentage: sanitizeNumber(progress.percentage, 0, 100),
    currentStep: sanitizeString(progress.currentStep),
    message: progress.message ? sanitizeString(progress.message) : undefined,
  };
}

/**
 * Sanitize LogEntry before sending to renderer
 */
export function sanitizeLogEntry(log: LogEntry): LogEntry {
  const validLevels = ['info', 'warning', 'error', 'debug'] as const;
  const level = validLevels.includes(log.level as any)
    ? log.level
    : 'info';

  return {
    timestamp: sanitizeNumber(log.timestamp, 0, Date.now() + 86400000), // Max 1 day in future
    level,
    message: sanitizeString(log.message),
    details: log.details ? sanitizeString(log.details) : undefined,
  };
}

/**
 * Sanitize InstallError before sending to renderer
 */
export function sanitizeInstallError(error: InstallError): InstallError {
  const validPhases = ['detecting', 'installing-node', 'installing-openclaw', 'onboarding', 'configuring', 'complete'] as const;
  const phase = validPhases.includes(error.phase as any)
    ? error.phase
    : 'detecting';

  return {
    code: sanitizeString(error.code),
    message: sanitizeString(error.message),
    phase,
    stack: error.stack ? sanitizeString(error.stack) : undefined,
    recoverable: sanitizeBoolean(error.recoverable),
  };
}

/**
 * Sanitize InstallResult before sending to renderer
 */
export function sanitizeInstallResult(result: InstallResult): InstallResult {
  const sanitized: InstallResult = {
    success: sanitizeBoolean(result.success),
  };

  if (result.nodeVersion !== undefined) {
    sanitized.nodeVersion = sanitizeString(result.nodeVersion);
  }

  if (result.openclawVersion !== undefined) {
    sanitized.openclawVersion = sanitizeString(result.openclawVersion);
  }

  if (result.error !== undefined) {
    sanitized.error = sanitizeInstallError(result.error);
  }

  return sanitized;
}

/**
 * Sanitize SystemInfo before sending to renderer
 */
export function sanitizeSystemInfo(info: SystemInfo): SystemInfo {
  const validPlatforms = ['darwin', 'win32', 'linux'] as const;
  const platform = validPlatforms.includes(info.platform as any)
    ? info.platform
    : 'linux';

  return {
    platform,
    arch: sanitizeString(info.arch),
    nodeVersion: info.nodeVersion ? sanitizeString(info.nodeVersion) : undefined,
    openclawInstalled: sanitizeBoolean(info.openclawInstalled),
  };
}
