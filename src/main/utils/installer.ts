import { spawn } from 'child_process';
import { platform } from 'os';

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

/**
 * Result of executing a command with elevated privileges
 */
export interface ElevatedCommandResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Standard output from the command */
  stdout: string;
  /** Standard error from the command */
  stderr: string;
  /** Exit code of the command */
  exitCode: number | null;
  /** Error message if execution failed */
  error?: string;
  /** Whether the user cancelled the authentication prompt */
  cancelled: boolean;
}

/**
 * Executes a command with elevated privileges on macOS/Linux
 * Uses AppleScript sudo prompt on macOS, pkexec on Linux with PolicyKit
 *
 * @param command - The command to execute (e.g., 'npm')
 * @param args - Arguments for the command (e.g., ['install', '-g', 'openclaw'])
 * @param options - Optional settings
 * @returns Promise resolving to ElevatedCommandResult
 */
export function executeWithPrivileges(
  command: string,
  args: string[] = [],
  options: { message?: string } = {}
): Promise<ElevatedCommandResult> {
  return new Promise((resolve) => {
    const os = platform();

    // Only support macOS and Linux
    if (os !== 'darwin' && os !== 'linux') {
      resolve({
        success: false,
        stdout: '',
        stderr: '',
        exitCode: null,
        error: `Unsupported platform: ${os}. This function only supports macOS and Linux.`,
        cancelled: false,
      });
      return;
    }

    let elevatedCommand: string;
    let elevatedArgs: string[];

    if (os === 'darwin') {
      // macOS: Use osascript to trigger AppleScript sudo prompt
      const message = options.message || 'OpenClack needs administrator privileges to continue.';
      const scriptCommand = `do shell script "${command} ${args.map(arg => arg.replace(/"/g, '\\"')).join(' ')}" with administrator privileges with prompt "${message}"`;

      elevatedCommand = 'osascript';
      elevatedArgs = ['-e', scriptCommand];
    } else {
      // Linux: Use pkexec for PolicyKit authentication
      elevatedCommand = 'pkexec';
      elevatedArgs = [command, ...args];
    }

    try {
      const child = spawn(elevatedCommand, elevatedArgs);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Exit code 126 or 127 typically indicates authentication failure/cancellation
        // Exit code -128 on macOS indicates user cancelled AppleScript dialog
        const cancelled = code === 126 || code === 127 || code === -128 ||
                         stderr.includes('User cancelled') ||
                         stderr.includes('Authentication failed') ||
                         stderr.includes('Request dismissed');

        if (code !== 0) {
          resolve({
            success: false,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code,
            error: cancelled ? 'User cancelled authentication' : `Command failed with exit code ${code}`,
            cancelled,
          });
          return;
        }

        resolve({
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          cancelled: false,
        });
      });

      child.on('error', (err) => {
        // Check if error indicates missing pkexec or osascript
        const isMissingTool = err.message.includes('ENOENT');
        const toolName = os === 'darwin' ? 'osascript' : 'pkexec';

        resolve({
          success: false,
          stdout: '',
          stderr: '',
          exitCode: null,
          error: isMissingTool
            ? `${toolName} not found. Cannot request elevated privileges.`
            : err.message,
          cancelled: false,
        });
      });
    } catch (err) {
      resolve({
        success: false,
        stdout: '',
        stderr: '',
        exitCode: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        cancelled: false,
      });
    }
  });
}
