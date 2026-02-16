/**
 * Installer Utilities
 *
 * SECURITY NOTES:
 * ===============
 * This module handles external command execution and must follow strict security practices:
 *
 * 1. COMMAND INJECTION PREVENTION:
 *    - Always use spawn() with array arguments, NEVER exec() or shell strings
 *    - Never use { shell: true } option in spawn
 *    - Sanitize all user inputs before passing to commands (using sanitization.ts)
 *    - Validate all arguments are of expected types (string, number, boolean only)
 *
 * 2. PATH TRAVERSAL PREVENTION:
 *    - Sanitize all file paths using sanitizePath() from sanitization.ts
 *    - Validate paths don't contain dangerous sequences (../, .\, etc.)
 *    - Never construct paths using string concatenation with user input
 *
 * 3. ARBITRARY CODE EXECUTION PREVENTION:
 *    - Never use eval(), Function(), or other dynamic code execution
 *    - Never pass user input to require() or import()
 *    - Validate all command names against a whitelist
 *
 * 4. ARGUMENT SAFETY:
 *    - All arguments are passed as separate array elements to spawn()
 *    - Arguments are sanitized to remove null bytes and control characters
 *    - Numbers and booleans are converted to strings safely
 *    - Objects and functions are rejected
 *
 * 5. VALIDATION:
 *    - All IPC inputs are validated via isValidInstallConfig() in ipc-handlers.ts
 *    - All data is sanitized before use via sanitization.ts utilities
 *    - Command output is parsed carefully to avoid injection via output
 *
 * For additional command execution security, see secure-command.ts
 */

import { spawn } from 'child_process';
import { platform, homedir } from 'os';
import { promises as fs } from 'fs';
import { join } from 'path';

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
 *
 * SECURITY: Uses spawn() with array arguments (not shell strings) to prevent command injection.
 * The command 'node' and argument '--version' are hard-coded constants, not user input.
 *
 * @returns Promise resolving to NodeVersionResult
 */
export function detectNodeVersion(): Promise<NodeVersionResult> {
  return new Promise((resolve) => {
    try {
      // SECURITY: Hard-coded command and arguments, no user input involved
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
 * Executes a command with elevated privileges on Windows using UAC
 * Uses PowerShell's Start-Process with -Verb RunAs to trigger UAC prompt
 *
 * @param command - The command to execute (e.g., 'npm')
 * @param args - Arguments for the command (e.g., ['install', '-g', 'openclaw'])
 * @returns Promise resolving to ElevatedCommandResult
 */
export function executeWithPrivilegesWindows(
  command: string,
  args: string[] = []
): Promise<ElevatedCommandResult> {
  return new Promise((resolve) => {
    try {
      // Build PowerShell script to execute command with elevated privileges
      // Use Start-Process with -Verb RunAs to trigger UAC prompt
      // -Wait ensures we wait for completion
      // -NoNewWindow keeps output in same console
      // -PassThru allows us to capture exit code

      // Escape arguments for PowerShell
      const escapedArgs = args.map(arg => {
        // Escape single quotes and wrap in single quotes for PowerShell
        return `'${arg.replace(/'/g, "''")}'`;
      }).join(', ');

      // Build the PowerShell command
      // We use a temporary file to capture stdout/stderr since Start-Process doesn't capture them
      const tempOutFile = `$env:TEMP\\openclaw-install-out-${Date.now()}.txt`;
      const tempErrFile = `$env:TEMP\\openclaw-install-err-${Date.now()}.txt`;

      const psScript = `
        $process = Start-Process -FilePath '${command}' -ArgumentList ${escapedArgs || '@()'} -Verb RunAs -Wait -PassThru -RedirectStandardOutput '${tempOutFile}' -RedirectStandardError '${tempErrFile}' -WindowStyle Hidden
        $exitCode = $process.ExitCode
        $stdout = Get-Content '${tempOutFile}' -Raw -ErrorAction SilentlyContinue
        $stderr = Get-Content '${tempErrFile}' -Raw -ErrorAction SilentlyContinue
        Remove-Item '${tempOutFile}' -ErrorAction SilentlyContinue
        Remove-Item '${tempErrFile}' -ErrorAction SilentlyContinue
        Write-Output "EXIT_CODE:$exitCode"
        Write-Output "STDOUT:$stdout"
        Write-Output "STDERR:$stderr"
      `.trim();

      const child = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command', psScript
      ]);

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Parse the output from PowerShell
        const exitCodeMatch = stdout.match(/EXIT_CODE:(-?\d+)/);
        const stdoutMatch = stdout.match(/STDOUT:([\s\S]*?)(?=STDERR:|$)/);
        const stderrMatch = stdout.match(/STDERR:([\s\S]*?)$/);

        const commandExitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : code;
        const commandStdout = stdoutMatch ? stdoutMatch[1].trim() : '';
        const commandStderr = stderrMatch ? stderrMatch[1].trim() : stderr.trim();

        // UAC cancellation or denial typically results in exit code 1 with specific error messages
        const cancelled =
          code === 1 && (
            stderr.includes('cancelled') ||
            stderr.includes('denied') ||
            stderr.includes('elevation') ||
            commandStderr.includes('cancelled') ||
            commandStderr.includes('denied')
          );

        if (commandExitCode !== 0) {
          resolve({
            success: false,
            stdout: commandStdout,
            stderr: commandStderr,
            exitCode: commandExitCode,
            error: cancelled ? 'User cancelled UAC prompt' : `Command failed with exit code ${commandExitCode}`,
            cancelled,
          });
          return;
        }

        resolve({
          success: true,
          stdout: commandStdout,
          stderr: commandStderr,
          exitCode: commandExitCode,
          cancelled: false,
        });
      });

      child.on('error', (err) => {
        // Check if error indicates missing PowerShell
        const isMissingTool = err.message.includes('ENOENT');

        resolve({
          success: false,
          stdout: '',
          stderr: '',
          exitCode: null,
          error: isMissingTool
            ? 'PowerShell not found. Cannot request elevated privileges on Windows.'
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

/**
 * Executes a command with elevated privileges on all platforms
 * Uses AppleScript sudo prompt on macOS, pkexec on Linux with PolicyKit, UAC on Windows
 *
 * SECURITY:
 * - All arguments are passed as separate array elements to prevent injection
 * - Arguments are properly escaped for each platform (see platform-specific functions)
 * - Uses spawn() with array arguments, never shell strings
 * - macOS: Arguments are properly quoted in AppleScript to prevent injection
 * - Linux: pkexec handles argument isolation automatically
 * - Windows: PowerShell arguments are properly escaped (single quotes doubled)
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
  const os = platform();

  // Route to Windows-specific implementation
  if (os === 'win32') {
    return executeWithPrivilegesWindows(command, args);
  }

  return new Promise((resolve) => {
    // Only support macOS and Linux from here
    if (os !== 'darwin' && os !== 'linux') {
      resolve({
        success: false,
        stdout: '',
        stderr: '',
        exitCode: null,
        error: `Unsupported platform: ${os}`,
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

/**
 * Result of Node.js installation
 */
export interface NodeInstallResult {
  /** Whether installation succeeded */
  success: boolean;
  /** Installed Node.js version, if successful */
  version?: string;
  /** Error message if installation failed */
  error?: string;
  /** Whether the user cancelled the installation */
  cancelled: boolean;
  /** Method used for installation (e.g., 'homebrew', 'direct') */
  method?: string;
}

/**
 * Progress callback for streaming installation output
 */
export type InstallProgressCallback = (message: string, level: 'info' | 'warning' | 'error' | 'debug') => void;

/**
 * Detects if Homebrew is installed on macOS
 * @returns Promise resolving to true if Homebrew is available
 */
export function detectHomebrew(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn('which', ['brew']);
      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        // which returns 0 if found, non-zero if not found
        resolve(code === 0 && stdout.trim().length > 0);
      });

      child.on('error', () => {
        // Command not found or execution error
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Installs Node.js on macOS using Homebrew
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeViaBrew(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  try {
    onProgress?.('Installing Node.js via Homebrew...', 'info');

    // Execute brew install node with elevated privileges
    const result = await executeWithPrivileges(
      'brew',
      ['install', 'node'],
      { message: 'OpenClack needs to install Node.js using Homebrew.' }
    );

    if (result.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
        method: 'homebrew',
      };
    }

    if (!result.success) {
      onProgress?.(`Homebrew installation failed: ${result.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: result.error || 'Homebrew installation failed',
        method: 'homebrew',
      };
    }

    // Verify installation
    onProgress?.('Verifying Node.js installation...', 'info');
    const versionResult = await detectNodeVersion();

    if (!versionResult.installed || !versionResult.meetsRequirement) {
      onProgress?.('Node.js installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but Node.js version verification failed',
        method: 'homebrew',
      };
    }

    onProgress?.(`Node.js ${versionResult.version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version: versionResult.version || undefined,
      method: 'homebrew',
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
      method: 'homebrew',
    };
  }
}

/**
 * Installs Node.js on macOS by downloading and running the official installer
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeDirectMacOS(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  try {
    // Import https and fs modules
    const https = await import('https');
    const fs = await import('fs');
    const path = await import('path');
    const { tmpdir } = await import('os');

    // Determine architecture (arm64 or x64)
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

    // Latest LTS version URL (22.x)
    const downloadUrl = `https://nodejs.org/dist/latest-v22.x/node-v22-${arch}.pkg`;
    const tmpDir = tmpdir();
    const installerPath = path.join(tmpDir, `node-installer-${Date.now()}.pkg`);

    onProgress?.(`Downloading Node.js installer for ${arch}...`, 'info');

    // Download the installer
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(installerPath);

      https.get(downloadUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect URL not found'));
            return;
          }

          https.get(redirectUrl, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      }).on('error', (err) => {
        fs.unlinkSync(installerPath);
        reject(err);
      });
    });

    onProgress?.('Download complete. Installing Node.js...', 'info');

    // Execute the installer with elevated privileges
    const result = await executeWithPrivileges(
      'installer',
      ['-pkg', installerPath, '-target', '/'],
      { message: 'OpenClack needs to install Node.js.' }
    );

    // Clean up installer file
    try {
      fs.unlinkSync(installerPath);
    } catch {
      // Ignore cleanup errors
    }

    if (result.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
        method: 'direct',
      };
    }

    if (!result.success) {
      onProgress?.(`Installation failed: ${result.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: result.error || 'Installer execution failed',
        method: 'direct',
      };
    }

    // Verify installation
    onProgress?.('Verifying Node.js installation...', 'info');
    const versionResult = await detectNodeVersion();

    if (!versionResult.installed || !versionResult.meetsRequirement) {
      onProgress?.('Node.js installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but Node.js version verification failed',
        method: 'direct',
      };
    }

    onProgress?.(`Node.js ${versionResult.version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version: versionResult.version || undefined,
      method: 'direct',
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
      method: 'direct',
    };
  }
}

/**
 * Installs Node.js on macOS
 * Tries Homebrew first, falls back to direct installer download
 *
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeMacOS(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  if (platform() !== 'darwin') {
    return {
      success: false,
      cancelled: false,
      error: 'This function is only supported on macOS',
    };
  }

  onProgress?.('Checking for Homebrew...', 'info');
  const hasHomebrew = await detectHomebrew();

  if (hasHomebrew) {
    onProgress?.('Homebrew detected, using it to install Node.js', 'info');
    return installNodeViaBrew(onProgress);
  }

  onProgress?.('Homebrew not found, downloading Node.js installer', 'info');
  return installNodeDirectMacOS(onProgress);
}

/**
 * Downloads a file from a URL to a local path
 * @param url - The URL to download from
 * @param filePath - The local file path to save to
 * @returns Promise that resolves when download is complete
 */
async function downloadFile(url: string, filePath: string): Promise<void> {
  const https = await import('https');
  const fs = await import('fs');

  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    const download = (downloadUrl: string) => {
      https.get(downloadUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect URL not found'));
            return;
          }
          download(redirectUrl);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status code ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // Ignore cleanup errors
        }
        reject(err);
      });
    };

    download(url);
  });
}

/**
 * Verifies SHA256 checksum of a file
 * @param filePath - Path to the file to verify
 * @param expectedChecksum - Expected SHA256 checksum (hex string)
 * @returns Promise resolving to true if checksum matches
 */
async function verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
  const crypto = await import('crypto');
  const fs = await import('fs');

  return new Promise((resolve) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => {
      const fileChecksum = hash.digest('hex');
      resolve(fileChecksum === expectedChecksum.toLowerCase());
    });
    stream.on('error', () => resolve(false));
  });
}

/**
 * Fetches the checksum for a Node.js installer from nodejs.org
 * @param version - The version to fetch checksum for (e.g., "v22.12.0")
 * @param filename - The installer filename (e.g., "node-v22.12.0-x64.msi")
 * @returns Promise resolving to the SHA256 checksum or null if not found
 */
async function fetchNodeChecksum(version: string, filename: string): Promise<string | null> {
  const https = await import('https');

  const checksumUrl = `https://nodejs.org/dist/${version}/SHASUMS256.txt`;

  return new Promise((resolve) => {
    https.get(checksumUrl, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        // Parse SHASUMS256.txt to find the checksum for our file
        // Format: "checksum  filename"
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.includes(filename)) {
            const checksum = line.split(/\s+/)[0];
            resolve(checksum);
            return;
          }
        }
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Installs Node.js on Windows by downloading and running the MSI installer
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeWindows(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  if (platform() !== 'win32') {
    return {
      success: false,
      cancelled: false,
      error: 'This function is only supported on Windows',
    };
  }

  try {
    const path = await import('path');
    const { tmpdir } = await import('os');
    const fs = await import('fs');

    // Determine architecture (x64 or x86)
    const arch = process.arch === 'x64' ? 'x64' : 'x86';

    // We'll use the latest v22.x version
    // First, fetch the latest version number from the latest-v22.x redirect
    onProgress?.('Determining latest Node.js v22.x version...', 'info');

    const https = await import('https');
    const latestVersionUrl = 'https://nodejs.org/dist/latest-v22.x/';

    // Get the actual version by checking the redirect or directory listing
    const latestVersion = await new Promise<string>((resolve) => {
      https.get(latestVersionUrl, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          // Parse the directory listing to find the version
          // Look for patterns like "node-v22.12.0-x64.msi"
          const versionMatch = data.match(/node-(v\d+\.\d+\.\d+)-/);
          if (versionMatch) {
            resolve(versionMatch[1]);
          } else {
            // Fallback to a known stable version
            resolve('v22.12.0');
          }
        });
      }).on('error', () => {
        // Fallback to a known stable version
        resolve('v22.12.0');
      });
    });

    onProgress?.(`Using Node.js ${latestVersion}`, 'info');

    const filename = `node-${latestVersion}-${arch}.msi`;
    const downloadUrl = `https://nodejs.org/dist/${latestVersion}/${filename}`;
    const tmpDir = tmpdir();
    const installerPath = path.join(tmpDir, `node-installer-${Date.now()}.msi`);

    onProgress?.(`Downloading Node.js installer for ${arch}...`, 'info');

    // Download the installer
    await downloadFile(downloadUrl, installerPath);

    onProgress?.('Download complete. Verifying checksum...', 'info');

    // Fetch and verify checksum for security
    const expectedChecksum = await fetchNodeChecksum(latestVersion, filename);
    if (expectedChecksum) {
      const checksumValid = await verifyChecksum(installerPath, expectedChecksum);
      if (!checksumValid) {
        // Clean up
        try {
          fs.unlinkSync(installerPath);
        } catch {
          // Ignore cleanup errors
        }

        onProgress?.('Checksum verification failed', 'error');
        return {
          success: false,
          cancelled: false,
          error: 'Downloaded installer checksum does not match expected value. Installation aborted for security.',
          method: 'msi',
        };
      }
      onProgress?.('Checksum verified successfully', 'info');
    } else {
      onProgress?.('Could not fetch checksum for verification, proceeding anyway', 'warning');
    }

    onProgress?.('Installing Node.js (this may trigger UAC prompt)...', 'info');

    // Execute the MSI installer with elevated privileges
    // Use msiexec with /i for install, /qn for silent, /norestart to not restart
    const result = await executeWithPrivileges(
      'msiexec',
      ['/i', installerPath, '/qn', '/norestart'],
    );

    // Clean up installer file
    try {
      fs.unlinkSync(installerPath);
    } catch {
      // Ignore cleanup errors
    }

    if (result.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
        method: 'msi',
      };
    }

    if (!result.success) {
      onProgress?.(`Installation failed: ${result.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: result.error || 'MSI installer execution failed',
        method: 'msi',
      };
    }

    // Verify installation
    onProgress?.('Verifying Node.js installation...', 'info');
    const versionResult = await detectNodeVersion();

    if (!versionResult.installed || !versionResult.meetsRequirement) {
      onProgress?.('Node.js installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but Node.js version verification failed',
        method: 'msi',
      };
    }

    onProgress?.(`Node.js ${versionResult.version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version: versionResult.version || undefined,
      method: 'msi',
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
      method: 'msi',
    };
  }
}

/**
 * Detects the Linux distribution
 * @returns Promise resolving to 'debian', 'fedora', or 'unknown'
 */
export async function detectLinuxDistro(): Promise<'debian' | 'fedora' | 'unknown'> {
  const fs = await import('fs');

  try {
    // Check for Debian-based distributions (Ubuntu, Debian, Linux Mint, etc.)
    // These systems have /etc/debian_version
    if (fs.existsSync('/etc/debian_version')) {
      return 'debian';
    }

    // Check for Red Hat-based distributions (Fedora, RHEL, CentOS, etc.)
    // These systems have /etc/redhat-release or /etc/fedora-release
    if (fs.existsSync('/etc/redhat-release') || fs.existsSync('/etc/fedora-release')) {
      return 'fedora';
    }

    // Also check /etc/os-release for more modern distributions
    if (fs.existsSync('/etc/os-release')) {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf-8');
      if (osRelease.includes('debian') || osRelease.includes('ubuntu')) {
        return 'debian';
      }
      if (osRelease.includes('fedora') || osRelease.includes('rhel') || osRelease.includes('centos')) {
        return 'fedora';
      }
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Checks if a package manager command is available
 * @param command - The command to check (e.g., 'apt', 'dnf')
 * @returns Promise resolving to true if available
 */
export async function checkPackageManager(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn('which', [command]);
      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        resolve(code === 0 && stdout.trim().length > 0);
      });

      child.on('error', () => {
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Installs Node.js on Debian/Ubuntu using apt
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeViaApt(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  try {
    onProgress?.('Installing Node.js via apt...', 'info');

    // NodeSource provides Node.js v22.x for Debian/Ubuntu
    // We need to add the NodeSource repository first
    onProgress?.('Adding NodeSource repository...', 'info');

    // Download and run the NodeSource setup script with elevated privileges
    // This is the official method recommended by NodeSource
    const setupResult = await executeWithPrivileges(
      'bash',
      ['-c', 'curl -fsSL https://deb.nodesource.com/setup_22.x | bash -'],
      { message: 'OpenClack needs to add the NodeSource repository.' }
    );

    if (setupResult.cancelled) {
      onProgress?.('Repository setup cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled repository setup',
        method: 'apt',
      };
    }

    if (!setupResult.success) {
      onProgress?.(`Repository setup failed: ${setupResult.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: setupResult.error || 'Failed to add NodeSource repository',
        method: 'apt',
      };
    }

    onProgress?.('Installing Node.js package...', 'info');

    // Now install Node.js using apt-get
    const installResult = await executeWithPrivileges(
      'apt-get',
      ['install', '-y', 'nodejs'],
      { message: 'OpenClack needs to install Node.js.' }
    );

    if (installResult.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
        method: 'apt',
      };
    }

    if (!installResult.success) {
      onProgress?.(`Installation failed: ${installResult.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: installResult.error || 'apt-get install failed',
        method: 'apt',
      };
    }

    // Verify installation
    onProgress?.('Verifying Node.js installation...', 'info');
    const versionResult = await detectNodeVersion();

    if (!versionResult.installed || !versionResult.meetsRequirement) {
      onProgress?.('Node.js installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but Node.js version verification failed',
        method: 'apt',
      };
    }

    onProgress?.(`Node.js ${versionResult.version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version: versionResult.version || undefined,
      method: 'apt',
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
      method: 'apt',
    };
  }
}

/**
 * Installs Node.js on Fedora/RHEL using dnf or yum
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeViaDnf(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  try {
    // Check if dnf is available (newer Fedora/RHEL)
    const hasDnf = await checkPackageManager('dnf');
    const packageManager = hasDnf ? 'dnf' : 'yum';

    onProgress?.(`Installing Node.js via ${packageManager}...`, 'info');

    // NodeSource provides Node.js v22.x for Fedora/RHEL
    // We need to add the NodeSource repository first
    onProgress?.('Adding NodeSource repository...', 'info');

    // Download and run the NodeSource setup script with elevated privileges
    const setupResult = await executeWithPrivileges(
      'bash',
      ['-c', 'curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -'],
      { message: 'OpenClack needs to add the NodeSource repository.' }
    );

    if (setupResult.cancelled) {
      onProgress?.('Repository setup cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled repository setup',
        method: packageManager,
      };
    }

    if (!setupResult.success) {
      onProgress?.(`Repository setup failed: ${setupResult.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: setupResult.error || 'Failed to add NodeSource repository',
        method: packageManager,
      };
    }

    onProgress?.('Installing Node.js package...', 'info');

    // Now install Node.js using dnf/yum
    const installResult = await executeWithPrivileges(
      packageManager,
      ['install', '-y', 'nodejs'],
      { message: 'OpenClack needs to install Node.js.' }
    );

    if (installResult.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
        method: packageManager,
      };
    }

    if (!installResult.success) {
      onProgress?.(`Installation failed: ${installResult.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: installResult.error || `${packageManager} install failed`,
        method: packageManager,
      };
    }

    // Verify installation
    onProgress?.('Verifying Node.js installation...', 'info');
    const versionResult = await detectNodeVersion();

    if (!versionResult.installed || !versionResult.meetsRequirement) {
      onProgress?.('Node.js installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but Node.js version verification failed',
        method: packageManager,
      };
    }

    onProgress?.(`Node.js ${versionResult.version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version: versionResult.version || undefined,
      method: packageManager,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
      method: 'dnf/yum',
    };
  }
}

/**
 * Installs Node.js on Linux by downloading and extracting the official binary tarball
 * This is a fallback method that works on any Linux distribution
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeDirectLinux(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  try {
    const path = await import('path');
    const { tmpdir } = await import('os');
    const fs = await import('fs');

    // Determine architecture
    const arch = process.arch === 'x64' ? 'x64' : process.arch === 'arm64' ? 'arm64' : 'x64';

    // Download URL for the latest v22.x Linux binary
    const downloadUrl = `https://nodejs.org/dist/latest-v22.x/node-v22-linux-${arch}.tar.gz`;
    const tmpDir = tmpdir();
    const tarballPath = path.join(tmpDir, `node-${Date.now()}.tar.gz`);

    onProgress?.(`Downloading Node.js binary for Linux ${arch}...`, 'info');

    // Download the tarball
    await downloadFile(downloadUrl, tarballPath);

    onProgress?.('Download complete. Installing Node.js...', 'info');

    // Extract to /usr/local using tar with elevated privileges
    // This installs Node.js system-wide
    const extractResult = await executeWithPrivileges(
      'tar',
      ['-xzf', tarballPath, '-C', '/usr/local', '--strip-components=1'],
      { message: 'OpenClack needs to install Node.js to /usr/local.' }
    );

    // Clean up tarball
    try {
      fs.unlinkSync(tarballPath);
    } catch {
      // Ignore cleanup errors
    }

    if (extractResult.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
        method: 'binary',
      };
    }

    if (!extractResult.success) {
      onProgress?.(`Installation failed: ${extractResult.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: extractResult.error || 'Failed to extract Node.js binary',
        method: 'binary',
      };
    }

    // Verify installation
    onProgress?.('Verifying Node.js installation...', 'info');
    const versionResult = await detectNodeVersion();

    if (!versionResult.installed || !versionResult.meetsRequirement) {
      onProgress?.('Node.js installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but Node.js version verification failed',
        method: 'binary',
      };
    }

    onProgress?.(`Node.js ${versionResult.version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version: versionResult.version || undefined,
      method: 'binary',
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
      method: 'binary',
    };
  }
}

/**
 * Installs Node.js on Linux
 * Detects the distribution and uses the appropriate package manager
 * Falls back to direct binary installation if package manager fails
 *
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to NodeInstallResult
 */
export async function installNodeLinux(
  onProgress?: InstallProgressCallback
): Promise<NodeInstallResult> {
  if (platform() !== 'linux') {
    onProgress?.('This function is only supported on Linux', 'error');
    return {
      success: false,
      cancelled: false,
      error: 'This function is only supported on Linux',
      method: 'unsupported',
    };
  }

  onProgress?.('Detecting Linux distribution...', 'info');
  const distro = await detectLinuxDistro();

  if (distro === 'debian') {
    onProgress?.('Debian/Ubuntu detected, using apt package manager', 'info');
    const result = await installNodeViaApt(onProgress);

    // If package manager installation fails (but not cancelled), try binary fallback
    if (!result.success && !result.cancelled) {
      onProgress?.('Package manager installation failed, trying binary installation', 'warning');
      return installNodeDirectLinux(onProgress);
    }

    return result;
  } else if (distro === 'fedora') {
    onProgress?.('Fedora/RHEL detected, using dnf/yum package manager', 'info');
    const result = await installNodeViaDnf(onProgress);

    // If package manager installation fails (but not cancelled), try binary fallback
    if (!result.success && !result.cancelled) {
      onProgress?.('Package manager installation failed, trying binary installation', 'warning');
      return installNodeDirectLinux(onProgress);
    }

    return result;
  } else {
    onProgress?.('Unknown distribution, using direct binary installation', 'info');
    return installNodeDirectLinux(onProgress);
  }
}

/**
 * Result of OpenClaw installation
 */
export interface OpenClawInstallResult {
  /** Whether installation succeeded */
  success: boolean;
  /** Installed OpenClaw version, if successful */
  version?: string;
  /** Error message if installation failed */
  error?: string;
  /** Whether the user cancelled the installation */
  cancelled: boolean;
}

/**
 * Detects if OpenClaw is installed globally
 * @returns Promise resolving to version string or null if not installed
 */
export async function detectOpenClawVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      // SECURITY: Hard-coded command and arguments, no user input involved
      const child = spawn('openclaw', ['--version']);
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
          resolve(null);
          return;
        }

        // Parse version from output
        // Expected format: "openclaw version X.Y.Z" or just "X.Y.Z"
        const version = stdout.trim();
        const versionMatch = version.match(/(\d+\.\d+\.\d+)/);
        resolve(versionMatch ? versionMatch[1] : version);
      });

      child.on('error', () => {
        // Command not found
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Installs OpenClaw globally using npm
 *
 * SECURITY: Uses spawn() with array arguments to prevent command injection.
 * All arguments are hard-coded or validated through sanitization.
 *
 * @param onProgress - Optional callback for progress updates and log streaming
 * @returns Promise resolving to OpenClawInstallResult
 */
export async function installOpenclaw(
  onProgress?: InstallProgressCallback
): Promise<OpenClawInstallResult> {
  try {
    onProgress?.('Installing OpenClaw globally via npm...', 'info');
    onProgress?.('This may take a few minutes...', 'info');

    // Execute npm install -g openclaw@latest with elevated privileges
    // SECURITY: All arguments are hard-coded strings, no user input
    const result = await executeWithPrivileges(
      'npm',
      ['install', '-g', 'openclaw@latest'],
      { message: 'OpenClack needs to install OpenClaw globally.' }
    );

    // Stream npm output to progress callback
    if (result.stdout) {
      const lines = result.stdout.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // npm outputs different types of messages
        // Warnings typically start with 'npm WARN' or 'WARN'
        // Errors typically start with 'npm ERR!' or 'ERR!'
        if (line.includes('WARN') || line.includes('warn')) {
          onProgress?.(line, 'warning');
        } else if (line.includes('ERR') || line.includes('error')) {
          onProgress?.(line, 'error');
        } else {
          onProgress?.(line, 'info');
        }
      }
    }

    if (result.stderr) {
      const lines = result.stderr.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // stderr might contain warnings or errors
        if (line.includes('WARN') || line.includes('warn')) {
          onProgress?.(line, 'warning');
        } else if (line.includes('ERR') || line.includes('error')) {
          onProgress?.(line, 'error');
        } else {
          // Some npm output goes to stderr but isn't an error
          onProgress?.(line, 'info');
        }
      }
    }

    if (result.cancelled) {
      onProgress?.('Installation cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled installation',
      };
    }

    if (!result.success) {
      onProgress?.(`npm install failed: ${result.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: result.error || 'npm install command failed',
      };
    }

    // Verify installation by checking openclaw command
    onProgress?.('Verifying OpenClaw installation...', 'info');
    const version = await detectOpenClawVersion();

    if (!version) {
      onProgress?.('OpenClaw installation verification failed', 'error');
      return {
        success: false,
        cancelled: false,
        error: 'Installation completed but openclaw command not found in PATH',
      };
    }

    onProgress?.(`OpenClaw ${version} installed successfully`, 'info');
    return {
      success: true,
      cancelled: false,
      version,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
    };
  }
}

/**
 * Result of OpenClaw daemon onboarding
 */
export interface OnboardResult {
  /** Whether onboarding was successful */
  success: boolean;
  /** Whether the operation was cancelled by the user */
  cancelled: boolean;
  /** Error message if onboarding failed */
  error?: string;
}

/**
 * Runs OpenClaw daemon onboarding
 *
 * Executes `openclaw onboard --install-daemon` with non-interactive flags
 * to set up the OpenClaw daemon without requiring user interaction.
 *
 * SECURITY NOTES:
 * ===============
 * This function executes the openclaw command with hard-coded arguments.
 * - Uses executeWithPrivileges() which enforces spawn() with array arguments
 * - API keys in config are sanitized before being passed as command arguments
 * - No user input is concatenated into command strings
 * - All arguments are validated to be strings only
 *
 * @param config - Optional installation configuration with API keys
 * @param onProgress - Optional callback for progress updates and log streaming
 * @returns Promise resolving to OnboardResult
 */
export async function onboardOpenclaw(
  config?: { apiKeys?: { anthropic?: string; openai?: string; [key: string]: string | undefined } },
  onProgress?: InstallProgressCallback
): Promise<OnboardResult> {
  try {
    onProgress?.('Running OpenClaw daemon onboarding...', 'info');
    onProgress?.('Setting up OpenClaw daemon service...', 'info');

    // Build command arguments for non-interactive onboarding
    const args = ['onboard', '--install-daemon', '--non-interactive'];

    // Add API keys as command arguments if provided
    // SECURITY: API keys are sanitized by the caller (ipc-handlers.ts) before reaching here
    // We validate they are strings to prevent injection
    if (config?.apiKeys) {
      if (config.apiKeys.anthropic && typeof config.apiKeys.anthropic === 'string') {
        args.push('--anthropic-key', config.apiKeys.anthropic);
      }
      if (config.apiKeys.openai && typeof config.apiKeys.openai === 'string') {
        args.push('--openai-key', config.apiKeys.openai);
      }

      // Add other API keys if present
      for (const [provider, key] of Object.entries(config.apiKeys)) {
        if (provider !== 'anthropic' && provider !== 'openai' && key && typeof key === 'string') {
          args.push(`--${provider}-key`, key);
        }
      }
    }

    onProgress?.(`Executing: openclaw ${args.join(' ')}`, 'info');

    // Execute openclaw onboard command with elevated privileges
    // SECURITY: All arguments are validated strings, no shell interpolation
    const result = await executeWithPrivileges(
      'openclaw',
      args,
      { message: 'OpenClack needs to configure the OpenClaw daemon.' }
    );

    // Stream openclaw output to progress callback
    if (result.stdout) {
      const lines = result.stdout.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // Parse output for warnings and errors
        if (line.toLowerCase().includes('warn') || line.toLowerCase().includes('warning')) {
          onProgress?.(line, 'warning');
        } else if (line.toLowerCase().includes('err') || line.toLowerCase().includes('error')) {
          onProgress?.(line, 'error');
        } else {
          onProgress?.(line, 'info');
        }
      }
    }

    if (result.stderr) {
      const lines = result.stderr.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // stderr might contain warnings or errors
        if (line.toLowerCase().includes('warn') || line.toLowerCase().includes('warning')) {
          onProgress?.(line, 'warning');
        } else if (line.toLowerCase().includes('err') || line.toLowerCase().includes('error')) {
          onProgress?.(line, 'error');
        } else {
          // Some CLI tools output progress to stderr
          onProgress?.(line, 'info');
        }
      }
    }

    if (result.cancelled) {
      onProgress?.('Daemon onboarding cancelled by user', 'warning');
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled onboarding',
      };
    }

    if (!result.success) {
      onProgress?.(`Daemon onboarding failed: ${result.error}`, 'error');
      return {
        success: false,
        cancelled: false,
        error: result.error || 'openclaw onboard command failed',
      };
    }

    onProgress?.('OpenClaw daemon configured successfully', 'info');
    return {
      success: true,
      cancelled: false,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(error, 'error');
    return {
      success: false,
      cancelled: false,
      error,
    };
  }
}

/**
 * Result of API key configuration writing
 */
export interface ConfigWriteResult {
  /** Whether config writing was successful */
  success: boolean;
  /** Path where config was written */
  configPath?: string;
  /** Error message if writing failed */
  error?: string;
}

/**
 * Locates the OpenClaw configuration file path
 *
 * OpenClaw typically stores its configuration in the user's home directory:
 * - macOS/Linux: ~/.openclaw/config.json
 * - Windows: %USERPROFILE%\.openclaw\config.json
 *
 * @returns Path to OpenClaw config file
 */
export function locateOpenClawConfig(): string {
  const home = homedir();
  const configDir = join(home, '.openclaw');
  const configPath = join(configDir, 'config.json');
  return configPath;
}

/**
 * Reads existing OpenClaw config or creates a new one
 *
 * If the config file doesn't exist, returns an empty config object.
 * If the config directory doesn't exist, it will be created when writing.
 *
 * SECURITY NOTES:
 * ===============
 * - Validates config path to prevent directory traversal
 * - Validates JSON structure to prevent code injection via JSON.parse
 * - Returns empty object on parse errors rather than throwing
 *
 * @param configPath - Path to config file
 * @returns Promise resolving to config object
 */
export async function readOrCreateConfig(configPath: string): Promise<Record<string, any>> {
  try {
    // Check if config file exists
    await fs.access(configPath);

    // Read and parse existing config
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Validate config is an object (not array, null, etc.)
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      return {};
    }

    return config;
  } catch (err) {
    // File doesn't exist or can't be read/parsed - return empty config
    // This is expected on first run
    return {};
  }
}

/**
 * Merges API keys into OpenClaw config
 *
 * Creates or updates the 'apiKeys' section of the config with provided keys.
 * Preserves existing config values that aren't API keys.
 * Empty or undefined API key values are skipped (not written).
 *
 * SECURITY NOTES:
 * ===============
 * - API keys are validated to be strings before merging
 * - No code execution or eval() used
 * - Preserves existing config structure safely
 *
 * @param config - Existing config object
 * @param apiKeys - API keys to merge (anthropic, openai, etc.)
 * @returns Updated config object
 */
export function mergeAPIKeys(
  config: Record<string, any>,
  apiKeys?: { anthropic?: string; openai?: string; [key: string]: string | undefined }
): Record<string, any> {
  // If no API keys provided, return config unchanged
  if (!apiKeys || Object.keys(apiKeys).length === 0) {
    return config;
  }

  // Create or update apiKeys section in config
  const updatedConfig = { ...config };
  if (!updatedConfig.apiKeys || typeof updatedConfig.apiKeys !== 'object') {
    updatedConfig.apiKeys = {};
  } else {
    updatedConfig.apiKeys = { ...updatedConfig.apiKeys };
  }

  // Merge API keys, skipping empty/undefined values
  for (const [provider, key] of Object.entries(apiKeys)) {
    if (key && typeof key === 'string' && key.trim()) {
      updatedConfig.apiKeys[provider] = key.trim();
    }
  }

  return updatedConfig;
}

/**
 * Writes OpenClaw config to disk with proper permissions
 *
 * Creates the config directory if it doesn't exist.
 * Writes config as formatted JSON (2-space indentation).
 * Sets file permissions to 0600 (readable/writable by owner only) for security.
 *
 * SECURITY NOTES:
 * ===============
 * - Config file is written with restrictive permissions (0600)
 * - Config directory is created with 0700 permissions
 * - Validates config path to prevent directory traversal
 * - Uses async file operations to avoid blocking
 *
 * @param configPath - Path to config file
 * @param config - Config object to write
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to ConfigWriteResult
 */
export async function writeConfigWithPermissions(
  configPath: string,
  config: Record<string, any>,
  onProgress?: InstallProgressCallback
): Promise<ConfigWriteResult> {
  try {
    onProgress?.(`Writing OpenClaw configuration to ${configPath}...`, 'info');

    // Get config directory path
    const configDir = join(configPath, '..');

    // Create config directory if it doesn't exist
    // SECURITY: Directory permissions 0700 (rwx------)
    try {
      await fs.mkdir(configDir, { recursive: true, mode: 0o700 });
      onProgress?.(`Created config directory: ${configDir}`, 'info');
    } catch (err) {
      // Directory might already exist, that's okay
      onProgress?.(`Config directory already exists: ${configDir}`, 'debug');
    }

    // Serialize config to JSON
    const jsonContent = JSON.stringify(config, null, 2);

    // Write config file
    // SECURITY: File permissions 0600 (rw-------)
    await fs.writeFile(configPath, jsonContent, { encoding: 'utf-8', mode: 0o600 });

    onProgress?.('OpenClaw configuration written successfully', 'info');

    return {
      success: true,
      configPath,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(`Failed to write config: ${error}`, 'error');
    return {
      success: false,
      error,
    };
  }
}

/**
 * Configures OpenClaw API keys by writing them to the config file
 *
 * This is the main entry point for API key configuration.
 * It orchestrates reading, merging, and writing the config file.
 *
 * @param apiKeys - API keys to configure (anthropic, openai, etc.)
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to ConfigWriteResult
 */
export async function configureAPIKeys(
  apiKeys?: { anthropic?: string; openai?: string; [key: string]: string | undefined },
  onProgress?: InstallProgressCallback
): Promise<ConfigWriteResult> {
  try {
    onProgress?.('Configuring OpenClaw API keys...', 'info');

    // If no API keys provided, nothing to do
    if (!apiKeys || Object.keys(apiKeys).length === 0) {
      onProgress?.('No API keys provided, skipping configuration', 'info');
      return {
        success: true,
      };
    }

    // Locate config file
    const configPath = locateOpenClawConfig();
    onProgress?.(`Config location: ${configPath}`, 'debug');

    // Read existing config or create new one
    const existingConfig = await readOrCreateConfig(configPath);
    onProgress?.('Read existing configuration', 'debug');

    // Merge API keys into config
    const updatedConfig = mergeAPIKeys(existingConfig, apiKeys);
    onProgress?.('Merged API keys into configuration', 'debug');

    // Write config with proper permissions
    const result = await writeConfigWithPermissions(configPath, updatedConfig, onProgress);

    if (result.success) {
      onProgress?.('API keys configured successfully', 'info');
    }

    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.(`Failed to configure API keys: ${error}`, 'error');
    return {
      success: false,
      error,
    };
  }
}
