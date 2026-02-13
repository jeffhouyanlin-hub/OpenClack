/**
 * IPC Handlers
 * Secure communication handlers between main and renderer processes
 */

import { ipcMain, BrowserWindow } from 'electron';
import {
  IPC_CHANNELS,
  InstallConfig,
  InstallResult,
  SystemInfo,
  InstallProgress,
  LogEntry,
  InstallError,
} from '../types/ipc';

/**
 * Register all IPC handlers
 * This should be called once when the app starts
 */
export function registerIPCHandlers(mainWindow: BrowserWindow): void {
  // Handler: Start installation
  ipcMain.handle(IPC_CHANNELS.START_INSTALL, async (_event, config: InstallConfig): Promise<InstallResult> => {
    try {
      // Validate config
      if (!isValidInstallConfig(config)) {
        throw new Error('Invalid installation configuration');
      }

      // TODO: Implement actual installation logic in future features
      // For now, return a mock success result
      const result: InstallResult = {
        success: true,
        nodeVersion: '22.12.0',
        openclawVersion: '1.0.0',
      };

      return result;
    } catch (error) {
      const installError: InstallError = {
        code: 'INSTALL_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        phase: 'detecting',
        stack: error instanceof Error ? error.stack : undefined,
        recoverable: true,
      };

      return {
        success: false,
        error: installError,
      };
    }
  });

  // Handler: Cancel installation
  ipcMain.handle(IPC_CHANNELS.CANCEL_INSTALL, async (): Promise<void> => {
    // TODO: Implement cancellation logic in future features
    // For now, just acknowledge
    return;
  });

  // Handler: Get system information
  ipcMain.handle(IPC_CHANNELS.GET_SYSTEM_INFO, async (): Promise<SystemInfo> => {
    const systemInfo: SystemInfo = {
      platform: process.platform as 'darwin' | 'win32' | 'linux',
      arch: process.arch,
      nodeVersion: process.version,
      openclawInstalled: false, // TODO: Detect actual installation in future features
    };

    return systemInfo;
  });

  // Handler: Launch OpenClaw
  ipcMain.handle(IPC_CHANNELS.LAUNCH_OPENCLAW, async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // TODO: Implement actual launch logic in future features
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to launch OpenClaw',
      };
    }
  });

  // Handler: Save configuration
  ipcMain.handle(IPC_CHANNELS.SAVE_CONFIG, async (_event, config: InstallConfig): Promise<void> => {
    try {
      // Validate config
      if (!isValidInstallConfig(config)) {
        throw new Error('Invalid configuration');
      }

      // TODO: Implement config persistence in future features
      // For now, just acknowledge
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Unregister all IPC handlers
 * Call this during cleanup
 */
export function unregisterIPCHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.START_INSTALL);
  ipcMain.removeHandler(IPC_CHANNELS.CANCEL_INSTALL);
  ipcMain.removeHandler(IPC_CHANNELS.GET_SYSTEM_INFO);
  ipcMain.removeHandler(IPC_CHANNELS.LAUNCH_OPENCLAW);
  ipcMain.removeHandler(IPC_CHANNELS.SAVE_CONFIG);
}

/**
 * Send installation progress to renderer
 */
export function sendInstallProgress(mainWindow: BrowserWindow, progress: InstallProgress): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.INSTALL_PROGRESS, progress);
  }
}

/**
 * Send installation log to renderer
 */
export function sendInstallLog(mainWindow: BrowserWindow, log: LogEntry): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.INSTALL_LOG, log);
  }
}

/**
 * Send installation error to renderer
 */
export function sendInstallError(mainWindow: BrowserWindow, error: InstallError): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.INSTALL_ERROR, error);
  }
}

/**
 * Send installation complete to renderer
 */
export function sendInstallComplete(mainWindow: BrowserWindow, result: InstallResult): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.INSTALL_COMPLETE, result);
  }
}

/**
 * Validate installation configuration
 */
function isValidInstallConfig(config: unknown): config is InstallConfig {
  if (!config || typeof config !== 'object') {
    return true; // Empty config is valid
  }

  const cfg = config as Partial<InstallConfig>;

  // Validate API keys if provided
  if (cfg.apiKeys !== undefined) {
    if (typeof cfg.apiKeys !== 'object' || cfg.apiKeys === null) {
      return false;
    }

    // Check each API key is a string
    for (const value of Object.values(cfg.apiKeys)) {
      if (value !== undefined && typeof value !== 'string') {
        return false;
      }
    }
  }

  // Validate skipNodeInstall if provided
  if (cfg.skipNodeInstall !== undefined && typeof cfg.skipNodeInstall !== 'boolean') {
    return false;
  }

  // Validate installPath if provided
  if (cfg.installPath !== undefined && typeof cfg.installPath !== 'string') {
    return false;
  }

  return true;
}
