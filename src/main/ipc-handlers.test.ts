/**
 * Tests for IPC handlers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain, BrowserWindow } from 'electron';
import {
  registerIPCHandlers,
  unregisterIPCHandlers,
  sendInstallProgress,
  sendInstallLog,
  sendInstallError,
  sendInstallComplete,
} from './ipc-handlers';
import {
  IPC_CHANNELS,
  InstallConfig,
  InstallProgress,
  LogEntry,
  InstallError,
  InstallResult,
} from '../types/ipc';

// Mock Electron modules
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));

describe('IPC Handlers', () => {
  let mockWindow: BrowserWindow;
  let mockWebContents: any;

  beforeEach(() => {
    // Create mock window with webContents
    mockWebContents = {
      send: vi.fn(),
    };

    mockWindow = {
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: mockWebContents,
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    unregisterIPCHandlers();
  });

  describe('registerIPCHandlers', () => {
    it('should register all IPC handlers', () => {
      registerIPCHandlers(mockWindow);

      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.START_INSTALL, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.CANCEL_INSTALL, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.GET_SYSTEM_INFO, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.LAUNCH_OPENCLAW, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.SAVE_CONFIG, expect.any(Function));
    });

    it('should handle START_INSTALL with valid config', async () => {
      registerIPCHandlers(mockWindow);

      // Get the handler function
      const calls = (ipcMain.handle as any).mock.calls;
      const startInstallCall = calls.find((call: any) => call[0] === IPC_CHANNELS.START_INSTALL);
      const handler = startInstallCall[1];

      const config: InstallConfig = {
        apiKeys: {
          anthropic: 'sk-ant-test',
        },
      };

      const result = await handler({}, config);

      expect(result.success).toBe(true);
      expect(result.nodeVersion).toBeDefined();
      expect(result.openclawVersion).toBeDefined();
    });

    it('should handle START_INSTALL with invalid config', async () => {
      registerIPCHandlers(mockWindow);

      const calls = (ipcMain.handle as any).mock.calls;
      const startInstallCall = calls.find((call: any) => call[0] === IPC_CHANNELS.START_INSTALL);
      const handler = startInstallCall[1];

      const invalidConfig = {
        apiKeys: 'not-an-object', // Invalid: should be object
      };

      const result = await handler({}, invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid');
    });

    it('should handle GET_SYSTEM_INFO', async () => {
      registerIPCHandlers(mockWindow);

      const calls = (ipcMain.handle as any).mock.calls;
      const systemInfoCall = calls.find((call: any) => call[0] === IPC_CHANNELS.GET_SYSTEM_INFO);
      const handler = systemInfoCall[1];

      const result = await handler({});

      expect(result).toBeDefined();
      expect(result.platform).toBeDefined();
      expect(result.arch).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
      expect(typeof result.openclawInstalled).toBe('boolean');
    });

    it('should handle CANCEL_INSTALL', async () => {
      registerIPCHandlers(mockWindow);

      const calls = (ipcMain.handle as any).mock.calls;
      const cancelCall = calls.find((call: any) => call[0] === IPC_CHANNELS.CANCEL_INSTALL);
      const handler = cancelCall[1];

      const result = await handler({});

      expect(result).toBeUndefined();
    });

    it('should handle LAUNCH_OPENCLAW', async () => {
      registerIPCHandlers(mockWindow);

      const calls = (ipcMain.handle as any).mock.calls;
      const launchCall = calls.find((call: any) => call[0] === IPC_CHANNELS.LAUNCH_OPENCLAW);
      const handler = launchCall[1];

      const result = await handler({});

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle SAVE_CONFIG with valid config', async () => {
      registerIPCHandlers(mockWindow);

      const calls = (ipcMain.handle as any).mock.calls;
      const saveConfigCall = calls.find((call: any) => call[0] === IPC_CHANNELS.SAVE_CONFIG);
      const handler = saveConfigCall[1];

      const config: InstallConfig = {
        apiKeys: {
          openai: 'sk-test',
        },
      };

      await expect(handler({}, config)).resolves.toBeUndefined();
    });

    it('should handle SAVE_CONFIG with invalid config', async () => {
      registerIPCHandlers(mockWindow);

      const calls = (ipcMain.handle as any).mock.calls;
      const saveConfigCall = calls.find((call: any) => call[0] === IPC_CHANNELS.SAVE_CONFIG);
      const handler = saveConfigCall[1];

      const invalidConfig = {
        skipNodeInstall: 'yes', // Invalid: should be boolean
      };

      await expect(handler({}, invalidConfig)).rejects.toThrow();
    });
  });

  describe('unregisterIPCHandlers', () => {
    it('should remove all IPC handlers', () => {
      registerIPCHandlers(mockWindow);
      unregisterIPCHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.START_INSTALL);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.CANCEL_INSTALL);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.GET_SYSTEM_INFO);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.LAUNCH_OPENCLAW);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.SAVE_CONFIG);
    });
  });

  describe('sendInstallProgress', () => {
    it('should send progress to renderer', () => {
      const progress: InstallProgress = {
        phase: 'installing-node',
        percentage: 50,
        currentStep: 'Installing Node.js',
      };

      sendInstallProgress(mockWindow, progress);

      expect(mockWebContents.send).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_PROGRESS, progress);
    });

    it('should not send if window is destroyed', () => {
      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

      const progress: InstallProgress = {
        phase: 'installing-node',
        percentage: 50,
        currentStep: 'Installing Node.js',
      };

      sendInstallProgress(mockWindow, progress);

      expect(mockWebContents.send).not.toHaveBeenCalled();
    });
  });

  describe('sendInstallLog', () => {
    it('should send log to renderer', () => {
      const log: LogEntry = {
        timestamp: Date.now(),
        level: 'info',
        message: 'Installing dependencies',
      };

      sendInstallLog(mockWindow, log);

      expect(mockWebContents.send).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_LOG, log);
    });

    it('should not send if window is destroyed', () => {
      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

      const log: LogEntry = {
        timestamp: Date.now(),
        level: 'info',
        message: 'Test',
      };

      sendInstallLog(mockWindow, log);

      expect(mockWebContents.send).not.toHaveBeenCalled();
    });
  });

  describe('sendInstallError', () => {
    it('should send error to renderer', () => {
      const error: InstallError = {
        code: 'NODE_INSTALL_FAILED',
        message: 'Failed to install Node.js',
        phase: 'installing-node',
        recoverable: true,
      };

      sendInstallError(mockWindow, error);

      expect(mockWebContents.send).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_ERROR, error);
    });

    it('should not send if window is destroyed', () => {
      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

      const error: InstallError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        phase: 'detecting',
        recoverable: true,
      };

      sendInstallError(mockWindow, error);

      expect(mockWebContents.send).not.toHaveBeenCalled();
    });
  });

  describe('sendInstallComplete', () => {
    it('should send completion result to renderer', () => {
      const result: InstallResult = {
        success: true,
        nodeVersion: '22.12.0',
        openclawVersion: '1.0.0',
      };

      sendInstallComplete(mockWindow, result);

      expect(mockWebContents.send).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_COMPLETE, result);
    });

    it('should not send if window is destroyed', () => {
      mockWindow.isDestroyed = vi.fn().mockReturnValue(true);

      const result: InstallResult = {
        success: false,
      };

      sendInstallComplete(mockWindow, result);

      expect(mockWebContents.send).not.toHaveBeenCalled();
    });
  });
});
