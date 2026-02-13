import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for IPC methods
  onInstallProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('install-progress', (_event, data) => callback(data));
  },
  startInstall: (config: any) => ipcRenderer.invoke('start-install', config),
});
