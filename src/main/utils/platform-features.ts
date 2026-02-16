/**
 * Platform Features - feat-076-078: Platform-specific features
 * OS detection and platform-specific behavior
 */
import { platform, arch, release } from 'os';

export type SupportedPlatform = 'darwin' | 'win32' | 'linux';

export interface PlatformInfo {
  platform: SupportedPlatform;
  arch: string;
  release: string;
  isSupported: boolean;
  displayName: string;
}

/**
 * Detects the current platform and returns structured info
 */
export function detectPlatform(): PlatformInfo {
  const currentPlatform = platform() as SupportedPlatform;
  const currentArch = arch();
  const currentRelease = release();

  const displayNames: Record<string, string> = {
    darwin: 'macOS',
    win32: 'Windows',
    linux: 'Linux',
  };

  const supportedPlatforms: string[] = ['darwin', 'win32', 'linux'];

  return {
    platform: currentPlatform,
    arch: currentArch,
    release: currentRelease,
    isSupported: supportedPlatforms.includes(currentPlatform),
    displayName: displayNames[currentPlatform] || 'Unknown',
  };
}

/**
 * Returns platform-specific default install path
 */
export function getDefaultInstallPath(): string {
  const p = platform();
  switch (p) {
    case 'darwin':
      return '/usr/local/bin';
    case 'win32':
      return 'C:\\Program Files\\OpenClaw';
    case 'linux':
      return '/usr/local/bin';
    default:
      return '/usr/local/bin';
  }
}

/**
 * Returns platform-specific config directory
 */
export function getConfigDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const p = platform();
  switch (p) {
    case 'darwin':
      return `${home}/Library/Application Support/OpenClaw`;
    case 'win32':
      return `${process.env.APPDATA || home}\\OpenClaw`;
    case 'linux':
      return `${home}/.config/openclaw`;
    default:
      return `${home}/.openclaw`;
  }
}

/**
 * Checks if the current platform requires elevation for installation
 */
export function requiresElevation(): boolean {
  const p = platform();
  // On macOS and Linux, installing to system paths may need sudo
  // On Windows, we typically need admin for Program Files
  return p === 'darwin' || p === 'win32' || p === 'linux';
}

/**
 * Returns the platform-specific shell command to use
 */
export function getShellCommand(): string {
  const p = platform();
  if (p === 'win32') {
    return 'powershell.exe';
  }
  return '/bin/bash';
}
