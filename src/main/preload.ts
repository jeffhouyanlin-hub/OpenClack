/**
 * Preload Script
 * Exposes secure IPC API to renderer process via contextBridge
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  IPC_CHANNELS,
  InstallConfig,
  InstallResult,
  SystemInfo,
  InstallProgress,
  LogEntry,
  InstallError,
  WindowAPI,
} from '../types/ipc';

// Expose secure API to renderer
const electronAPI: WindowAPI = {
  // Installation operations
  startInstall: (config: InstallConfig): Promise<InstallResult> => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_INSTALL, config);
  },

  cancelInstall: (): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CANCEL_INSTALL);
  },

  // System queries
  getSystemInfo: (): Promise<SystemInfo> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_INFO);
  },

  // Post-installation operations
  launchOpenclaw: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.LAUNCH_OPENCLAW);
  },

  // Configuration
  saveConfig: (config: InstallConfig): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, config);
  },

  // Event listeners (main -> renderer)
  onInstallProgress: (callback: (progress: InstallProgress) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, progress: InstallProgress) => callback(progress);
    ipcRenderer.on(IPC_CHANNELS.INSTALL_PROGRESS, listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.INSTALL_PROGRESS, listener);
    };
  },

  onInstallLog: (callback: (log: LogEntry) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, log: LogEntry) => callback(log);
    ipcRenderer.on(IPC_CHANNELS.INSTALL_LOG, listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.INSTALL_LOG, listener);
    };
  },

  onInstallError: (callback: (error: InstallError) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, error: InstallError) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.INSTALL_ERROR, listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.INSTALL_ERROR, listener);
    };
  },

  onInstallComplete: (callback: (result: InstallResult) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, result: InstallResult) => callback(result);
    ipcRenderer.on(IPC_CHANNELS.INSTALL_COMPLETE, listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.INSTALL_COMPLETE, listener);
    };
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
