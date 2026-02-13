import { EventEmitter } from 'events';
import { detectNodeVersion } from './installer';
import type { InstallConfig, InstallProgress, LogEntry, InstallError, InstallResult } from '../../types/ipc';

/**
 * Installation phases that the orchestrator executes
 */
export enum InstallationPhase {
  DETECTING = 'detecting',
  INSTALLING_NODE = 'installing-node',
  INSTALLING_OPENCLAW = 'installing-openclaw',
  ONBOARDING = 'onboarding',
  CONFIGURING = 'configuring',
  COMPLETE = 'complete',
}

/**
 * Events emitted by the InstallationOrchestrator
 */
export interface OrchestratorEvents {
  progress: (progress: InstallProgress) => void;
  log: (log: LogEntry) => void;
  error: (error: InstallError) => void;
  complete: (result: InstallResult) => void;
}

/**
 * InstallationOrchestrator coordinates all installation steps
 * Executes phases sequentially: detect -> install node -> install openclaw -> onboard -> configure
 * Emits progress events for UI updates
 */
export class InstallationOrchestrator extends EventEmitter {
  private config: InstallConfig;
  private cancelled: boolean = false;
  private currentPhase: InstallationPhase = InstallationPhase.DETECTING;

  constructor(config: InstallConfig) {
    super();
    this.config = config;
  }

  /**
   * Starts the installation process
   * Executes all phases sequentially with error handling
   */
  async start(): Promise<InstallResult> {
    try {
      this.cancelled = false;

      // Phase 1: Detect current system state
      await this.executeDetectionPhase();
      if (this.cancelled) return this.buildCancelledResult();

      // Phase 2: Install Node.js if needed
      await this.executeNodeInstallPhase();
      if (this.cancelled) return this.buildCancelledResult();

      // Phase 3: Install OpenClaw
      await this.executeOpenClawInstallPhase();
      if (this.cancelled) return this.buildCancelledResult();

      // Phase 4: Onboard OpenClaw daemon
      await this.executeOnboardingPhase();
      if (this.cancelled) return this.buildCancelledResult();

      // Phase 5: Configure API keys
      await this.executeConfigurationPhase();
      if (this.cancelled) return this.buildCancelledResult();

      // Complete
      return this.buildSuccessResult();
    } catch (error) {
      return this.buildErrorResult(error);
    }
  }

  /**
   * Cancels the installation process
   */
  cancel(): void {
    this.cancelled = true;
    this.emitLog('info', 'Installation cancelled by user');
  }

  /**
   * Phase 1: Detection - Check current system state
   */
  private async executeDetectionPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.DETECTING;
    this.emitProgress(0, 'Detecting system configuration...');
    this.emitLog('info', 'Starting system detection');

    // Detect Node.js version
    const nodeResult = await detectNodeVersion();

    if (nodeResult.installed) {
      this.emitLog('info', `Node.js ${nodeResult.version} detected`);
      if (nodeResult.meetsRequirement) {
        this.emitLog('info', 'Node.js version meets requirements');
      } else {
        this.emitLog('warning', `Node.js ${nodeResult.version} is below required version 22.12.0`);
      }
    } else {
      this.emitLog('info', 'Node.js is not installed');
    }

    this.emitProgress(10, 'System detection complete');
  }

  /**
   * Phase 2: Install Node.js if needed
   */
  private async executeNodeInstallPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.INSTALLING_NODE;

    if (this.config.skipNodeInstall) {
      this.emitLog('info', 'Skipping Node.js installation (configured)');
      this.emitProgress(30, 'Skipped Node.js installation');
      return;
    }

    // Check if Node.js needs to be installed
    const nodeResult = await detectNodeVersion();
    if (nodeResult.installed && nodeResult.meetsRequirement) {
      this.emitLog('info', 'Node.js is already installed and meets requirements');
      this.emitProgress(30, 'Node.js already installed');
      return;
    }

    this.emitProgress(15, 'Installing Node.js...');
    this.emitLog('info', 'Starting Node.js installation');

    // Placeholder for actual Node.js installation
    // Will be implemented in feat-015, feat-016, feat-017
    this.emitLog('info', 'Node.js installation placeholder - will be implemented in future features');

    this.emitProgress(30, 'Node.js installation complete');
  }

  /**
   * Phase 3: Install OpenClaw npm package
   */
  private async executeOpenClawInstallPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.INSTALLING_OPENCLAW;
    this.emitProgress(35, 'Installing OpenClaw...');
    this.emitLog('info', 'Starting OpenClaw installation');

    // Placeholder for npm install -g openclaw@latest
    // Will be implemented in feat-020
    this.emitLog('info', 'OpenClaw installation placeholder - will be implemented in feat-020');

    this.emitProgress(60, 'OpenClaw installation complete');
  }

  /**
   * Phase 4: Onboard OpenClaw daemon
   */
  private async executeOnboardingPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.ONBOARDING;
    this.emitProgress(65, 'Setting up OpenClaw daemon...');
    this.emitLog('info', 'Starting OpenClaw daemon onboarding');

    // Placeholder for openclaw onboard --install-daemon
    // Will be implemented in feat-021
    this.emitLog('info', 'OpenClaw onboarding placeholder - will be implemented in feat-021');

    this.emitProgress(85, 'OpenClaw daemon setup complete');
  }

  /**
   * Phase 5: Configure API keys
   */
  private async executeConfigurationPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.CONFIGURING;
    this.emitProgress(90, 'Configuring API keys...');

    if (!this.config.apiKeys || Object.keys(this.config.apiKeys).length === 0) {
      this.emitLog('info', 'No API keys to configure');
      this.emitProgress(95, 'Configuration skipped');
      return;
    }

    this.emitLog('info', 'Writing API keys to OpenClaw configuration');

    // Placeholder for API key configuration
    // Will be implemented in feat-022
    const keyCount = Object.keys(this.config.apiKeys).filter(k => this.config.apiKeys![k]).length;
    this.emitLog('info', `Configuration placeholder - ${keyCount} API key(s) will be saved in feat-022`);

    this.emitProgress(95, 'Configuration complete');
  }

  /**
   * Emits a progress event
   */
  private emitProgress(percentage: number, currentStep: string, message?: string): void {
    const progress: InstallProgress = {
      phase: this.currentPhase,
      percentage,
      currentStep,
      message,
    };
    this.emit('progress', progress);
  }

  /**
   * Emits a log event
   */
  private emitLog(level: LogEntry['level'], message: string, details?: string): void {
    const log: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      details,
    };
    this.emit('log', log);
  }

  /**
   * Emits an error event
   */
  private emitError(code: string, message: string, recoverable: boolean, stack?: string): void {
    const error: InstallError = {
      code,
      message,
      phase: this.currentPhase,
      recoverable,
      stack,
    };
    this.emit('error', error);
  }

  /**
   * Builds a cancelled result
   */
  private buildCancelledResult(): InstallResult {
    const error: InstallError = {
      code: 'CANCELLED',
      message: 'Installation was cancelled by user',
      phase: this.currentPhase,
      recoverable: false,
    };

    const result: InstallResult = {
      success: false,
      error,
    };

    this.emit('complete', result);
    return result;
  }

  /**
   * Builds a success result
   */
  private buildSuccessResult(): InstallResult {
    this.currentPhase = InstallationPhase.COMPLETE;
    this.emitProgress(100, 'Installation complete!');
    this.emitLog('info', 'Installation completed successfully');

    const result: InstallResult = {
      success: true,
      nodeVersion: 'placeholder', // Will be set by actual detection
      openclawVersion: 'placeholder', // Will be set by actual detection
    };

    this.emit('complete', result);
    return result;
  }

  /**
   * Builds an error result
   */
  private buildErrorResult(error: unknown): InstallResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.emitLog('error', errorMessage, errorStack);
    this.emitError('INSTALLATION_FAILED', errorMessage, true, errorStack);

    const installError: InstallError = {
      code: 'INSTALLATION_FAILED',
      message: errorMessage,
      phase: this.currentPhase,
      recoverable: true,
      stack: errorStack,
    };

    const result: InstallResult = {
      success: false,
      error: installError,
    };

    this.emit('complete', result);
    return result;
  }
}
