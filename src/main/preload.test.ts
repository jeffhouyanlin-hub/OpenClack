/**
 * Tests for preload script
 * Verifies contextBridge exposes correct API to renderer
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { IPC_CHANNELS } from '../types/ipc';
import type { WindowAPI } from '../types/ipc';

// Mock electron modules
const mockInvoke = vi.fn();
const mockOn = vi.fn();
const mockRemoveListener = vi.fn();
const mockExposeInMainWorld = vi.fn();

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld,
  },
  ipcRenderer: {
    invoke: mockInvoke,
    on: mockOn,
    removeListener: mockRemoveListener,
  },
}));

describe('Preload Script', () => {
  let api: WindowAPI;

  beforeAll(async () => {
    // Import preload once to trigger contextBridge.exposeInMainWorld
    await import('./preload');

    // Extract the API object from the mock call
    const calls = mockExposeInMainWorld.mock.calls;
    const exposeCall = calls.find(call => call[0] === 'electronAPI');
    if (!exposeCall) {
      throw new Error('electronAPI was not exposed to main world');
    }
    api = exposeCall[1] as WindowAPI;
  });

  it('should expose electronAPI to window', () => {
    expect(mockExposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.any(Object));
  });

  it('should expose startInstall method', () => {
    expect(api.startInstall).toBeInstanceOf(Function);
  });

  it('should expose cancelInstall method', () => {
    expect(api.cancelInstall).toBeInstanceOf(Function);
  });

  it('should expose getSystemInfo method', () => {
    expect(api.getSystemInfo).toBeInstanceOf(Function);
  });

  it('should expose launchOpenclaw method', () => {
    expect(api.launchOpenclaw).toBeInstanceOf(Function);
  });

  it('should expose saveConfig method', () => {
    expect(api.saveConfig).toBeInstanceOf(Function);
  });

  it('should expose onInstallProgress listener', () => {
    expect(api.onInstallProgress).toBeInstanceOf(Function);
  });

  it('should expose onInstallLog listener', () => {
    expect(api.onInstallLog).toBeInstanceOf(Function);
  });

  it('should expose onInstallError listener', () => {
    expect(api.onInstallError).toBeInstanceOf(Function);
  });

  it('should expose onInstallComplete listener', () => {
    expect(api.onInstallComplete).toBeInstanceOf(Function);
  });

  it('should invoke correct IPC channel for startInstall', () => {
    const config = { apiKeys: { anthropic: 'test' } };

    api.startInstall(config);

    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.START_INSTALL, config);
  });

  it('should invoke correct IPC channel for cancelInstall', () => {
    api.cancelInstall();

    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.CANCEL_INSTALL);
  });

  it('should invoke correct IPC channel for getSystemInfo', () => {
    api.getSystemInfo();

    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.GET_SYSTEM_INFO);
  });

  it('should invoke correct IPC channel for launchOpenclaw', () => {
    api.launchOpenclaw();

    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.LAUNCH_OPENCLAW);
  });

  it('should invoke correct IPC channel for saveConfig', () => {
    const config = { skipNodeInstall: true };

    api.saveConfig(config);

    expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.SAVE_CONFIG, config);
  });

  it('should register listener for onInstallProgress', () => {
    const callback = vi.fn();

    api.onInstallProgress(callback);

    expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_PROGRESS, expect.any(Function));
  });

  it('should return cleanup function from onInstallProgress', () => {
    const callback = vi.fn();

    const cleanup = api.onInstallProgress(callback);

    expect(cleanup).toBeInstanceOf(Function);

    // Call cleanup
    cleanup();

    expect(mockRemoveListener).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_PROGRESS, expect.any(Function));
  });

  it('should register listener for onInstallLog', () => {
    const callback = vi.fn();

    api.onInstallLog(callback);

    expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_LOG, expect.any(Function));
  });

  it('should register listener for onInstallError', () => {
    const callback = vi.fn();

    api.onInstallError(callback);

    expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_ERROR, expect.any(Function));
  });

  it('should register listener for onInstallComplete', () => {
    const callback = vi.fn();

    api.onInstallComplete(callback);

    expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.INSTALL_COMPLETE, expect.any(Function));
  });
});
