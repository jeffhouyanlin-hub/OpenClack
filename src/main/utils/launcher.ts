import { spawn } from 'child_process';
import { platform } from 'os';

export interface LaunchResult {
  success: boolean;
  error?: string;
}

export async function detectOpenClawPath(): Promise<string | null> {
  return new Promise((resolve) => {
    const cmd = platform() === 'win32' ? 'where' : 'which';
    try {
      const child = spawn(cmd, ['openclaw']);
      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          resolve(stdout.trim().split('\n')[0]);
        } else {
          resolve(null);
        }
      });

      child.on('error', () => {
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

export async function launchOpenClaw(): Promise<LaunchResult> {
  try {
    const openclawPath = await detectOpenClawPath();
    if (!openclawPath) {
      return {
        success: false,
        error: 'OpenClaw not found in PATH. Please ensure it is installed.',
      };
    }

    const child = spawn('openclaw', ['start'], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to launch OpenClaw',
    };
  }
}
