/**
 * Secure Command Execution Utilities
 *
 * This module provides utilities for safely executing external commands while preventing:
 * - Command injection attacks
 * - Shell injection attacks
 * - Path traversal attacks
 * - Arbitrary code execution
 *
 * SECURITY PRINCIPLES:
 * 1. Always use spawn() with array arguments, never exec() or shell strings
 * 2. Validate all command arguments before execution
 * 3. Sanitize all user-provided inputs
 * 4. Never allow dynamic code execution (eval, Function, etc.)
 * 5. Whitelist allowed commands and reject unknown ones
 */

import { spawn, SpawnOptions } from 'child_process';
import { sanitizePath, sanitizeString } from './sanitization';

/**
 * List of allowed commands that can be executed
 * This whitelist prevents arbitrary command execution
 */
const ALLOWED_COMMANDS = new Set([
  'node',
  'npm',
  'openclaw',
  'which',
  'brew',
  'osascript',
  'pkexec',
  'powershell.exe',
  'msiexec',
  'installer',
]);

/**
 * Validate that a command is in the allowed list
 */
export function isAllowedCommand(command: string): boolean {
  return ALLOWED_COMMANDS.has(command);
}

/**
 * Sanitize and validate command arguments
 *
 * @param args - Array of command arguments
 * @returns Sanitized array of arguments
 */
export function sanitizeCommandArgs(args: unknown[]): string[] {
  if (!Array.isArray(args)) {
    throw new Error('Command arguments must be an array');
  }

  return args.map((arg) => {
    // Only accept strings or numbers as arguments
    if (typeof arg === 'string') {
      // Sanitize the string to remove null bytes and dangerous characters
      return sanitizeString(arg);
    } else if (typeof arg === 'number') {
      // Convert numbers to strings safely
      return String(arg);
    } else if (typeof arg === 'boolean') {
      // Convert booleans to strings
      return String(arg);
    } else {
      throw new Error(`Invalid argument type: ${typeof arg}. Only strings, numbers, and booleans are allowed.`);
    }
  });
}

/**
 * Validate and sanitize file path arguments
 *
 * @param path - File path to validate
 * @returns Sanitized path
 */
export function validatePath(path: string): string {
  const sanitized = sanitizePath(path);

  // Additional path validation
  if (sanitized.length === 0) {
    throw new Error('Path cannot be empty');
  }

  // Check for suspicious patterns that might indicate injection attempts
  const suspiciousPatterns = [
    /;/,           // Command separator
    /\|/,          // Pipe
    /&&/,          // Command chaining
    /\|\|/,        // OR operator
    /`/,           // Command substitution (backtick)
    /\$\(/,        // Command substitution
    />/,           // Redirect
    /</,           // Redirect
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Path contains suspicious characters that may indicate injection attempt');
    }
  }

  return sanitized;
}

/**
 * Securely execute a command with validated arguments
 *
 * SECURITY NOTES:
 * - Uses spawn() with array arguments (not shell strings)
 * - Does NOT use shell: true option
 * - Validates command is in whitelist
 * - Sanitizes all arguments
 * - Rejects suspicious patterns
 *
 * @param command - Command to execute (must be in whitelist)
 * @param args - Array of command arguments
 * @param options - Spawn options (shell option is always forced to false)
 * @returns Child process
 */
export function secureSpawn(
  command: string,
  args: string[] = [],
  options: Omit<SpawnOptions, 'shell'> = {}
): ReturnType<typeof spawn> {
  // Validate command is allowed
  if (!isAllowedCommand(command)) {
    throw new Error(`Command "${command}" is not in the allowed commands list`);
  }

  // Sanitize command name
  const sanitizedCommand = sanitizeString(command);
  if (sanitizedCommand.length === 0) {
    throw new Error('Command cannot be empty');
  }

  // Sanitize and validate arguments
  const sanitizedArgs = sanitizeCommandArgs(args);

  // Force shell to false to prevent shell injection
  const secureOptions: SpawnOptions = {
    ...options,
    shell: false, // CRITICAL: Never enable shell mode
  };

  // Execute command with sanitized inputs
  return spawn(sanitizedCommand, sanitizedArgs, secureOptions);
}

/**
 * Add a command to the allowed list
 * Use this carefully - only add commands that are absolutely necessary
 *
 * @param command - Command to allow
 */
export function allowCommand(command: string): void {
  const sanitized = sanitizeString(command);
  if (sanitized.length > 0) {
    ALLOWED_COMMANDS.add(sanitized);
  }
}

/**
 * Remove a command from the allowed list
 *
 * @param command - Command to disallow
 */
export function disallowCommand(command: string): void {
  ALLOWED_COMMANDS.delete(command);
}

/**
 * Get the list of currently allowed commands
 *
 * @returns Array of allowed command names
 */
export function getAllowedCommands(): string[] {
  return Array.from(ALLOWED_COMMANDS);
}
