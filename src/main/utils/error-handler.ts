import { platform, arch, release } from 'os';

export type ErrorCategory = 'network' | 'permission' | 'disk' | 'command' | 'validation' | 'platform' | 'unknown';

export interface InstallErrorInfo {
  code: string;
  message: string;
  category: ErrorCategory;
  recoverable: boolean;
  actionableMessage: string;
  retryable: boolean;
}

export function categorizeError(error: Error | string, _phase?: string): InstallErrorInfo {
  const msg = typeof error === 'string' ? error : error.message;
  const lower = msg.toLowerCase();

  // Network errors
  if (lower.includes('enotfound') || lower.includes('enetunreach') || lower.includes('econnrefused') ||
      lower.includes('etimedout') || lower.includes('fetch') || lower.includes('network') ||
      lower.includes('dns') || lower.includes('download')) {
    return {
      code: 'NETWORK_ERROR',
      message: msg,
      category: 'network',
      recoverable: true,
      actionableMessage: 'Network error. Please check your internet connection and try again.',
      retryable: true,
    };
  }

  // Permission errors
  if (lower.includes('eacces') || lower.includes('permission') || lower.includes('denied') ||
      lower.includes('cancelled') || lower.includes('elevation') || lower.includes('uac') ||
      lower.includes('sudo') || lower.includes('authenticate')) {
    const cancelled = lower.includes('cancelled') || lower.includes('denied');
    return {
      code: cancelled ? 'AUTH_CANCELLED' : 'PERMISSION_ERROR',
      message: msg,
      category: 'permission',
      recoverable: true,
      actionableMessage: cancelled
        ? 'Authentication was cancelled. Please approve the permission prompt to continue.'
        : 'Permission denied. Please ensure you have administrator access.',
      retryable: true,
    };
  }

  // Disk errors
  if (lower.includes('enospc') || lower.includes('disk') || lower.includes('space') ||
      lower.includes('quota')) {
    return {
      code: 'DISK_SPACE_ERROR',
      message: msg,
      category: 'disk',
      recoverable: false,
      actionableMessage: 'Not enough disk space. Please free up space and try again.',
      retryable: true,
    };
  }

  // Command errors
  if (lower.includes('enoent') || lower.includes('not found') || lower.includes('command failed')) {
    return {
      code: 'COMMAND_ERROR',
      message: msg,
      category: 'command',
      recoverable: true,
      actionableMessage: `A required command was not found. Please ensure system dependencies are installed.`,
      retryable: true,
    };
  }

  // Validation errors
  if (lower.includes('invalid') || lower.includes('validation') || lower.includes('format')) {
    return {
      code: 'VALIDATION_ERROR',
      message: msg,
      category: 'validation',
      recoverable: true,
      actionableMessage: 'Invalid input detected. Please check your configuration and try again.',
      retryable: false,
    };
  }

  // Platform errors
  if (lower.includes('unsupported platform') || lower.includes('unsupported os')) {
    return {
      code: 'PLATFORM_ERROR',
      message: msg,
      category: 'platform',
      recoverable: false,
      actionableMessage: 'This platform is not supported. Please visit openclaw.ai for manual installation.',
      retryable: false,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: msg,
    category: 'unknown',
    recoverable: true,
    actionableMessage: `An unexpected error occurred: ${msg}`,
    retryable: true,
  };
}

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < opts.maxRetries) {
        const delay = Math.min(opts.baseDelayMs * Math.pow(2, attempt), opts.maxDelayMs);
        onRetry?.(attempt + 1, lastError, delay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export interface SupportedPlatformInfo {
  supported: boolean;
  platform: string;
  arch: string;
  osVersion: string;
  message?: string;
  manualInstallUrl?: string;
}

export function checkPlatformSupport(): SupportedPlatformInfo {
  const os = platform();
  const cpuArch = arch();
  const osVersion = release();

  const supportedPlatforms = ['darwin', 'win32', 'linux'];
  const supportedArchitectures = ['x64', 'arm64'];

  if (!supportedPlatforms.includes(os)) {
    return {
      supported: false,
      platform: os,
      arch: cpuArch,
      osVersion,
      message: `Unsupported operating system: ${os}. OpenClack supports macOS, Windows, and Linux.`,
      manualInstallUrl: 'https://openclaw.ai/install',
    };
  }

  if (!supportedArchitectures.includes(cpuArch)) {
    return {
      supported: false,
      platform: os,
      arch: cpuArch,
      osVersion,
      message: `Unsupported architecture: ${cpuArch}. OpenClack supports x64 and arm64.`,
      manualInstallUrl: 'https://openclaw.ai/install',
    };
  }

  return {
    supported: true,
    platform: os,
    arch: cpuArch,
    osVersion,
  };
}
