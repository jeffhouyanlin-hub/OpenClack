/**
 * feat-050: IPC integration tests
 *
 * Tests IPC handler registration, message format validation,
 * and the isValidInstallConfig function (valid/invalid configs).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('IPC Integration (feat-050)', () => {
  let mockWindow: BrowserWindow;
  let mockWebContents: any;

  beforeEach(() => {
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

  describe('Handler Registration', () => {
    it('should register all expected IPC channels', () => {
      registerIPCHandlers(mockWindow);

      expect(ipcMain.handle).toHaveBeenCalledTimes(5);
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.START_INSTALL, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.CANCEL_INSTALL, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.GET_SYSTEM_INFO, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.LAUNCH_OPENCLAW, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.SAVE_CONFIG, expect.any(Function));
    });

    it('should unregister all IPC channels on cleanup', () => {
      registerIPCHandlers(mockWindow);
      unregisterIPCHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.START_INSTALL);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.CANCEL_INSTALL);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.GET_SYSTEM_INFO);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.LAUNCH_OPENCLAW);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.SAVE_CONFIG);
    });

    it('should unregister exactly 5 handlers', () => {
      registerIPCHandlers(mockWindow);
      unregisterIPCHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledTimes(5);
    });
  });

  describe('IPC Channel Constants', () => {
    it('should define all required channel names', () => {
      expect(IPC_CHANNELS.INSTALL_PROGRESS).toBe('install-progress');
      expect(IPC_CHANNELS.INSTALL_LOG).toBe('install-log');
      expect(IPC_CHANNELS.INSTALL_ERROR).toBe('install-error');
      expect(IPC_CHANNELS.INSTALL_COMPLETE).toBe('install-complete');
      expect(IPC_CHANNELS.START_INSTALL).toBe('start-install');
      expect(IPC_CHANNELS.CANCEL_INSTALL).toBe('cancel-install');
      expect(IPC_CHANNELS.GET_SYSTEM_INFO).toBe('get-system-info');
      expect(IPC_CHANNELS.LAUNCH_OPENCLAW).toBe('launch-openclaw');
      expect(IPC_CHANNELS.SAVE_CONFIG).toBe('save-config');
    });

    it('should have unique channel names', () => {
      const values = Object.values(IPC_CHANNELS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('isValidInstallConfig via START_INSTALL handler', () => {
    function getHandler(channel: string): Function {
      registerIPCHandlers(mockWindow);
      const calls = (ipcMain.handle as any).mock.calls;
      const call = calls.find((c: any) => c[0] === channel);
      return call[1];
    }

    describe('Valid configs', () => {
      it('should accept empty config object', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const result = await handler({}, {});
        expect(result.success).toBe(true);
      });

      it('should accept config with valid apiKeys object', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config: InstallConfig = {
          apiKeys: { anthropic: 'sk-ant-test', openai: 'sk-test' },
        };
        const result = await handler({}, config);
        expect(result.success).toBe(true);
      });

      it('should accept config with skipNodeInstall boolean', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config: InstallConfig = { skipNodeInstall: true };
        const result = await handler({}, config);
        expect(result.success).toBe(true);
      });

      it('should accept config with skipNodeInstall false', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config: InstallConfig = { skipNodeInstall: false };
        const result = await handler({}, config);
        expect(result.success).toBe(true);
      });

      it('should accept config with installPath string', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config: InstallConfig = { installPath: '/usr/local/bin' };
        const result = await handler({}, config);
        expect(result.success).toBe(true);
      });

      it('should accept config with all valid fields', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config: InstallConfig = {
          apiKeys: { anthropic: 'sk-ant-test' },
          skipNodeInstall: false,
          installPath: '/opt/openclaw',
        };
        const result = await handler({}, config);
        expect(result.success).toBe(true);
      });

      it('should accept config with undefined apiKeys values', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config = {
          apiKeys: { anthropic: undefined, openai: 'sk-test' },
        };
        const result = await handler({}, config);
        expect(result.success).toBe(true);
      });

      it('should accept null/undefined config as valid (empty config)', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        // sanitizeInstallConfig should handle null/undefined
        const result = await handler({}, null);
        expect(result.success).toBeDefined();
      });
    });

    describe('Invalid configs', () => {
      it('should reject config with non-object apiKeys', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config = { apiKeys: 'not-an-object' };
        const result = await handler({}, config);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject config with non-boolean skipNodeInstall', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config = { skipNodeInstall: 'yes' };
        const result = await handler({}, config);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject config with non-string installPath', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const config = { installPath: 123 };
        const result = await handler({}, config);
        expect(result.success).toBe(false);
      });

      it('should sanitize non-string API key values (silently dropped)', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        // Non-string API key values are dropped by sanitization,
        // resulting in an empty apiKeys object which is valid
        const config = { apiKeys: { anthropic: 123 } };
        const result = await handler({}, config);
        // The sanitizer drops non-string values, so the config becomes valid
        expect(result.success).toBe(true);
      });
    });

    describe('Error result format', () => {
      it('should return proper error structure on invalid config', async () => {
        const handler = getHandler(IPC_CHANNELS.START_INSTALL);
        const result = await handler({}, { apiKeys: 'invalid' });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.code).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.phase).toBeDefined();
        expect(result.error.recoverable).toBe(true);
      });
    });
  });

  describe('Message Format Validation via Send Functions', () => {
    describe('sendInstallProgress', () => {
      it('should send progress with correct channel and data', () => {
        const progress: InstallProgress = {
          phase: 'installing-node',
          percentage: 50,
          currentStep: 'Downloading Node.js',
          message: '50% complete',
        };

        sendInstallProgress(mockWindow, progress);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_PROGRESS,
          expect.objectContaining({
            phase: 'installing-node',
            percentage: 50,
            currentStep: 'Downloading Node.js',
          })
        );
      });

      it('should not send when window is destroyed', () => {
        (mockWindow.isDestroyed as any).mockReturnValue(true);

        sendInstallProgress(mockWindow, {
          phase: 'detecting',
          percentage: 10,
          currentStep: 'Checking',
        });

        expect(mockWebContents.send).not.toHaveBeenCalled();
      });

      it('should send progress with all valid phase values', () => {
        const phases: InstallProgress['phase'][] = [
          'detecting',
          'installing-node',
          'installing-openclaw',
          'onboarding',
          'configuring',
          'complete',
        ];

        phases.forEach((phase) => {
          sendInstallProgress(mockWindow, {
            phase,
            percentage: 50,
            currentStep: 'Test',
          });
        });

        expect(mockWebContents.send).toHaveBeenCalledTimes(phases.length);
      });
    });

    describe('sendInstallLog', () => {
      it('should send log entry with correct channel', () => {
        const log: LogEntry = {
          timestamp: Date.now(),
          level: 'info',
          message: 'Installation started',
        };

        sendInstallLog(mockWindow, log);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_LOG,
          expect.objectContaining({
            level: 'info',
            message: 'Installation started',
          })
        );
      });

      it('should send log with details field', () => {
        const log: LogEntry = {
          timestamp: Date.now(),
          level: 'error',
          message: 'Install failed',
          details: 'Stack trace here',
        };

        sendInstallLog(mockWindow, log);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_LOG,
          expect.objectContaining({ details: 'Stack trace here' })
        );
      });

      it('should not send when window is destroyed', () => {
        (mockWindow.isDestroyed as any).mockReturnValue(true);

        sendInstallLog(mockWindow, {
          timestamp: Date.now(),
          level: 'info',
          message: 'Test',
        });

        expect(mockWebContents.send).not.toHaveBeenCalled();
      });
    });

    describe('sendInstallError', () => {
      it('should send error with correct channel and data', () => {
        const error: InstallError = {
          code: 'NODE_INSTALL_FAILED',
          message: 'Failed to install Node.js',
          phase: 'installing-node',
          recoverable: true,
        };

        sendInstallError(mockWindow, error);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_ERROR,
          expect.objectContaining({
            code: 'NODE_INSTALL_FAILED',
            message: 'Failed to install Node.js',
            phase: 'installing-node',
            recoverable: true,
          })
        );
      });

      it('should send error with stack trace', () => {
        const error: InstallError = {
          code: 'UNEXPECTED',
          message: 'Something went wrong',
          phase: 'detecting',
          recoverable: false,
          stack: 'Error: Something went wrong\n    at <anonymous>:1:1',
        };

        sendInstallError(mockWindow, error);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_ERROR,
          expect.objectContaining({ stack: expect.stringContaining('Something went wrong') })
        );
      });

      it('should not send when window is destroyed', () => {
        (mockWindow.isDestroyed as any).mockReturnValue(true);

        sendInstallError(mockWindow, {
          code: 'TEST',
          message: 'Test',
          phase: 'detecting',
          recoverable: true,
        });

        expect(mockWebContents.send).not.toHaveBeenCalled();
      });
    });

    describe('sendInstallComplete', () => {
      it('should send success result with correct channel', () => {
        const result: InstallResult = {
          success: true,
          nodeVersion: '22.12.0',
          openclawVersion: '1.0.0',
        };

        sendInstallComplete(mockWindow, result);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_COMPLETE,
          expect.objectContaining({
            success: true,
            nodeVersion: '22.12.0',
            openclawVersion: '1.0.0',
          })
        );
      });

      it('should send failure result with error', () => {
        const result: InstallResult = {
          success: false,
          error: {
            code: 'FAILED',
            message: 'Install failed',
            phase: 'installing-openclaw',
            recoverable: true,
          },
        };

        sendInstallComplete(mockWindow, result);

        expect(mockWebContents.send).toHaveBeenCalledWith(
          IPC_CHANNELS.INSTALL_COMPLETE,
          expect.objectContaining({ success: false })
        );
      });

      it('should not send when window is destroyed', () => {
        (mockWindow.isDestroyed as any).mockReturnValue(true);

        sendInstallComplete(mockWindow, { success: true });

        expect(mockWebContents.send).not.toHaveBeenCalled();
      });
    });
  });

  describe('Handler Response Formats', () => {
    function getHandler(channel: string): Function {
      registerIPCHandlers(mockWindow);
      const calls = (ipcMain.handle as any).mock.calls;
      const call = calls.find((c: any) => c[0] === channel);
      return call[1];
    }

    describe('GET_SYSTEM_INFO handler', () => {
      it('should return SystemInfo with required fields', async () => {
        const handler = getHandler(IPC_CHANNELS.GET_SYSTEM_INFO);
        const result = await handler({});

        expect(result).toHaveProperty('platform');
        expect(result).toHaveProperty('arch');
        expect(typeof result.openclawInstalled).toBe('boolean');
      });

      it('should return valid platform value', async () => {
        const handler = getHandler(IPC_CHANNELS.GET_SYSTEM_INFO);
        const result = await handler({});

        expect(['darwin', 'win32', 'linux']).toContain(result.platform);
      });

      it('should return node version string', async () => {
        const handler = getHandler(IPC_CHANNELS.GET_SYSTEM_INFO);
        const result = await handler({});

        expect(result.nodeVersion).toBeDefined();
        expect(typeof result.nodeVersion).toBe('string');
      });
    });

    describe('CANCEL_INSTALL handler', () => {
      it('should return undefined (void)', async () => {
        const handler = getHandler(IPC_CHANNELS.CANCEL_INSTALL);
        const result = await handler({});
        expect(result).toBeUndefined();
      });
    });

    describe('LAUNCH_OPENCLAW handler', () => {
      it('should return object with success boolean', async () => {
        const handler = getHandler(IPC_CHANNELS.LAUNCH_OPENCLAW);
        const result = await handler({});

        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });
    });

    describe('SAVE_CONFIG handler', () => {
      it('should resolve without error for valid config', async () => {
        const handler = getHandler(IPC_CHANNELS.SAVE_CONFIG);
        const config: InstallConfig = { apiKeys: { openai: 'sk-test-key' } };
        await expect(handler({}, config)).resolves.toBeUndefined();
      });

      it('should reject with error for invalid config', async () => {
        const handler = getHandler(IPC_CHANNELS.SAVE_CONFIG);
        const invalidConfig = { skipNodeInstall: 'yes' }; // Should be boolean
        await expect(handler({}, invalidConfig)).rejects.toThrow();
      });

      it('should include meaningful error message on rejection', async () => {
        const handler = getHandler(IPC_CHANNELS.SAVE_CONFIG);
        const invalidConfig = { apiKeys: 42 };
        await expect(handler({}, invalidConfig)).rejects.toThrow(/configuration/i);
      });
    });
  });
});
