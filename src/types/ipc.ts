/**
 * IPC Type Definitions
 * Defines all communication channels and data structures between main and renderer processes
 */

// Installation configuration from renderer
export interface InstallConfig {
  apiKeys?: {
    anthropic?: string;
    openai?: string;
    [key: string]: string | undefined;
  };
  skipNodeInstall?: boolean;
  installPath?: string;
}

// Installation progress data
export interface InstallProgress {
  phase: 'detecting' | 'installing-node' | 'installing-openclaw' | 'onboarding' | 'configuring' | 'complete';
  percentage: number;
  currentStep: string;
  message?: string;
}

// Log entry from installation process
export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: string;
}

// Installation error data
export interface InstallError {
  code: string;
  message: string;
  phase: InstallProgress['phase'];
  stack?: string;
  recoverable: boolean;
}

// Installation result
export interface InstallResult {
  success: boolean;
  nodeVersion?: string;
  openclawVersion?: string;
  error?: InstallError;
}

// System information
export interface SystemInfo {
  platform: 'darwin' | 'win32' | 'linux';
  arch: string;
  nodeVersion?: string;
  openclawInstalled: boolean;
}

// IPC Channel names (type-safe constants)
export const IPC_CHANNELS = {
  // Main -> Renderer
  INSTALL_PROGRESS: 'install-progress',
  INSTALL_LOG: 'install-log',
  INSTALL_ERROR: 'install-error',
  INSTALL_COMPLETE: 'install-complete',

  // Renderer -> Main
  START_INSTALL: 'start-install',
  CANCEL_INSTALL: 'cancel-install',
  GET_SYSTEM_INFO: 'get-system-info',
  LAUNCH_OPENCLAW: 'launch-openclaw',
  SAVE_CONFIG: 'save-config',
} as const;

// Type for channel names
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

// Window API exposed to renderer through contextBridge
export interface WindowAPI {
  // Installation operations
  startInstall: (config: InstallConfig) => Promise<InstallResult>;
  cancelInstall: () => Promise<void>;

  // System queries
  getSystemInfo: () => Promise<SystemInfo>;

  // Post-installation operations
  launchOpenclaw: () => Promise<{ success: boolean; error?: string }>;

  // Configuration
  saveConfig: (config: InstallConfig) => Promise<void>;

  // Event listeners (main -> renderer)
  onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
  onInstallLog: (callback: (log: LogEntry) => void) => () => void;
  onInstallError: (callback: (error: InstallError) => void) => () => void;
  onInstallComplete: (callback: (result: InstallResult) => void) => () => void;
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    electronAPI: WindowAPI;
  }
}
