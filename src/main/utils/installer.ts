import { spawn } from 'child_process';

/**
 * Minimum required Node.js version
 */
export const MIN_NODE_VERSION = '22.12.0';

/**
 * Result of Node.js version detection
 */
export interface NodeVersionResult {
  /** Whether Node.js is installed */
  installed: boolean;
  /** Current Node.js version (e.g., "22.12.0") or null if not installed */
  version: string | null;
  /** Whether the installed version meets the minimum requirement */
  meetsRequirement: boolean;
  /** Error message if detection failed */
  error?: string;
}

/**
 * Parses a Node.js version string (e.g., "v22.12.0") into numeric components
 * @param versionString - The version string from `node --version`
 * @returns Object with major, minor, patch numbers, or null if invalid
 */
export function parseNodeVersion(versionString: string): { major: number; minor: number; patch: number } | null {
  // Remove 'v' prefix if present
  const cleaned = versionString.trim().replace(/^v/, '');

  // Parse version components
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compares two Node.js versions
 * @param version - The version to check
 * @param minVersion - The minimum required version
 * @returns True if version >= minVersion
 */
export function compareVersions(version: string, minVersion: string): boolean {
  const current = parseNodeVersion(version);
  const minimum = parseNodeVersion(minVersion);

  if (!current || !minimum) {
    return false;
  }

  // Compare major version
  if (current.major > minimum.major) return true;
  if (current.major < minimum.major) return false;

  // Major versions equal, compare minor
  if (current.minor > minimum.minor) return true;
  if (current.minor < minimum.minor) return false;

  // Major and minor equal, compare patch
  return current.patch >= minimum.patch;
}

/**
 * Detects the currently installed Node.js version
 * @returns Promise resolving to NodeVersionResult
 */
export function detectNodeVersion(): Promise<NodeVersionResult> {
  return new Promise((resolve) => {
    try {
      const child = spawn('node', ['--version']);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          // node command failed
          resolve({
            installed: false,
            version: null,
            meetsRequirement: false,
            error: stderr.trim() || 'Failed to execute node --version',
          });
          return;
        }

        const version = stdout.trim();
        const parsed = parseNodeVersion(version);

        if (!parsed) {
          resolve({
            installed: true,
            version,
            meetsRequirement: false,
            error: `Invalid version format: ${version}`,
          });
          return;
        }

        const meetsRequirement = compareVersions(version, MIN_NODE_VERSION);

        resolve({
          installed: true,
          version,
          meetsRequirement,
        });
      });

      child.on('error', (err) => {
        // Command not found or execution error
        resolve({
          installed: false,
          version: null,
          meetsRequirement: false,
          error: err.message,
        });
      });
    } catch (err) {
      resolve({
        installed: false,
        version: null,
        meetsRequirement: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
}
