import { EventEmitter } from 'events';
import { detectNodeVersion, installNodeMacOS, installNodeWindows, installNodeLinux, installOpenclaw, onboardOpenclaw, configureAPIKeys } from './installer';
import { platform } from 'os';
import type { InstallConfig, InstallProgress, LogEntry, InstallError, InstallResult } from '../../types/ipc';
import { ProgressTracker, ProgressStep } from './progress-tracker';

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
  private progressTracker: ProgressTracker;

  constructor(config: InstallConfig) {
    super();
    this.config = config;

    // Initialize progress tracker with installation steps
    // Weights are based on typical duration of each phase
    const steps: ProgressStep[] = [
      { name: 'Detecting system configuration', weight: 5, completed: false },
      { name: 'Installing Node.js', weight: 30, completed: false },
      { name: 'Installing OpenClaw', weight: 35, completed: false },
      { name: 'Setting up OpenClaw daemon', weight: 20, completed: false },
      { name: 'Configuring API keys', weight: 10, completed: false },
    ];
    this.progressTracker = new ProgressTracker(steps);
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
    this.progressTracker.startStep('Detecting system configuration');
    this.emitProgressFromTracker();
    this.emitLog('info', 'Starting system detection');

    // Detect Node.js version
    this.progressTracker.updateSubProgress(50);
    this.emitProgressFromTracker();
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

    this.progressTracker.completeStep('Detecting system configuration');
    this.emitProgressFromTracker();
  }

  /**
   * Phase 2: Install Node.js if needed
   */
  private async executeNodeInstallPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.INSTALLING_NODE;
    this.progressTracker.startStep('Installing Node.js');

    if (this.config.skipNodeInstall) {
      this.emitLog('info', 'Skipping Node.js installation (configured)');
      this.progressTracker.completeStep('Installing Node.js');
      this.emitProgressFromTracker();
      return;
    }

    // Check if Node.js needs to be installed
    this.progressTracker.updateSubProgress(10);
    this.emitProgressFromTracker();
    const nodeResult = await detectNodeVersion();
    if (nodeResult.installed && nodeResult.meetsRequirement) {
      this.emitLog('info', 'Node.js is already installed and meets requirements');
      this.progressTracker.completeStep('Installing Node.js');
      this.emitProgressFromTracker();
      return;
    }

    this.progressTracker.updateSubProgress(20);
    this.emitProgressFromTracker();
    this.emitLog('info', 'Starting Node.js installation');

    // Install Node.js based on platform
    const os = platform();

    if (os === 'darwin') {
      // macOS installation
      const installResult = await installNodeMacOS((message, level) => {
        this.emitLog(level, message);
        // Update sub-progress during installation (estimate 20-90%)
        this.progressTracker.updateSubProgress(Math.min(90, 20 + Math.random() * 30));
        this.emitProgressFromTracker();
      });

      if (installResult.cancelled) {
        this.cancelled = true;
        return;
      }

      if (!installResult.success) {
        throw new Error(installResult.error || 'Node.js installation failed');
      }

      this.emitLog('info', `Node.js ${installResult.version} installed successfully via ${installResult.method}`);
      this.progressTracker.completeStep('Installing Node.js');
      this.emitProgressFromTracker();
    } else if (os === 'win32') {
      // Windows installation
      const installResult = await installNodeWindows((message, level) => {
        this.emitLog(level, message);
        // Update sub-progress during installation (estimate 20-90%)
        this.progressTracker.updateSubProgress(Math.min(90, 20 + Math.random() * 30));
        this.emitProgressFromTracker();
      });

      if (installResult.cancelled) {
        this.cancelled = true;
        return;
      }

      if (!installResult.success) {
        throw new Error(installResult.error || 'Node.js installation failed');
      }

      this.emitLog('info', `Node.js ${installResult.version} installed successfully via ${installResult.method}`);
      this.progressTracker.completeStep('Installing Node.js');
      this.emitProgressFromTracker();
    } else if (os === 'linux') {
      // Linux installation
      const installResult = await installNodeLinux((message, level) => {
        this.emitLog(level, message);
        // Update sub-progress during installation (estimate 20-90%)
        this.progressTracker.updateSubProgress(Math.min(90, 20 + Math.random() * 30));
        this.emitProgressFromTracker();
      });

      if (installResult.cancelled) {
        this.cancelled = true;
        return;
      }

      if (!installResult.success) {
        throw new Error(installResult.error || 'Node.js installation failed');
      }

      this.emitLog('info', `Node.js ${installResult.version} installed successfully via ${installResult.method}`);
      this.progressTracker.completeStep('Installing Node.js');
      this.emitProgressFromTracker();
    } else {
      throw new Error(`Unsupported platform: ${os}`);
    }
  }

  /**
   * Phase 3: Install OpenClaw npm package
   */
  private async executeOpenClawInstallPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.INSTALLING_OPENCLAW;
    this.progressTracker.startStep('Installing OpenClaw');
    this.emitProgressFromTracker();
    this.emitLog('info', 'Starting OpenClaw installation');

    // Install OpenClaw globally via npm
    const installResult = await installOpenclaw((message, level) => {
      this.emitLog(level, message);
      // Update sub-progress during installation (estimate 10-90%)
      this.progressTracker.updateSubProgress(Math.min(90, 10 + Math.random() * 40));
      this.emitProgressFromTracker();
    });

    if (installResult.cancelled) {
      this.cancelled = true;
      return;
    }

    if (!installResult.success) {
      throw new Error(installResult.error || 'OpenClaw installation failed');
    }

    this.emitLog('info', `OpenClaw ${installResult.version} installed successfully`);
    this.progressTracker.completeStep('Installing OpenClaw');
    this.emitProgressFromTracker();
  }

  /**
   * Phase 4: Onboard OpenClaw daemon
   */
  private async executeOnboardingPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.ONBOARDING;
    this.progressTracker.startStep('Setting up OpenClaw daemon');
    this.emitProgressFromTracker();
    this.emitLog('info', 'Starting OpenClaw daemon onboarding');

    // Execute openclaw onboard --install-daemon with non-interactive flags
    const onboardResult = await onboardOpenclaw(
      { apiKeys: this.config.apiKeys },
      (message, level) => {
        this.emitLog(level, message);
        // Update sub-progress during onboarding (estimate 10-90%)
        this.progressTracker.updateSubProgress(Math.min(90, 10 + Math.random() * 40));
        this.emitProgressFromTracker();
      }
    );

    if (onboardResult.cancelled) {
      this.cancelled = true;
      return;
    }

    if (!onboardResult.success) {
      throw new Error(onboardResult.error || 'OpenClaw daemon onboarding failed');
    }

    this.emitLog('info', 'OpenClaw daemon configured successfully');
    this.progressTracker.completeStep('Setting up OpenClaw daemon');
    this.emitProgressFromTracker();
  }

  /**
   * Phase 5: Configure API keys
   */
  private async executeConfigurationPhase(): Promise<void> {
    this.currentPhase = InstallationPhase.CONFIGURING;
    this.progressTracker.startStep('Configuring API keys');
    this.emitProgressFromTracker();

    if (!this.config.apiKeys || Object.keys(this.config.apiKeys).length === 0) {
      this.emitLog('info', 'No API keys to configure');
      this.progressTracker.completeStep('Configuring API keys');
      this.emitProgressFromTracker();
      return;
    }

    this.emitLog('info', 'Writing API keys to OpenClaw configuration');
    this.progressTracker.updateSubProgress(30);
    this.emitProgressFromTracker();

    // Write API keys to OpenClaw config file
    const result = await configureAPIKeys(
      this.config.apiKeys,
      (message: string, level: 'info' | 'warning' | 'error' | 'debug') => {
        this.emitLog(level, message);
        this.progressTracker.updateSubProgress(Math.min(90, 30 + Math.random() * 30));
        this.emitProgressFromTracker();
      }
    );

    if (this.cancelled) {
      throw new Error('Installation cancelled by user');
    }

    if (!result.success) {
      throw new Error(`Failed to configure API keys: ${result.error}`);
    }

    const keyCount = Object.keys(this.config.apiKeys).filter(k => this.config.apiKeys![k]).length;
    this.emitLog('info', `Successfully configured ${keyCount} API key(s)`);

    this.progressTracker.completeStep('Configuring API keys');
    this.emitProgressFromTracker();
  }

  /**
   * Emits a progress event using the progress tracker
   */
  private emitProgressFromTracker(): void {
    const trackerProgress = this.progressTracker.getProgress();
    const progress: InstallProgress = {
      phase: this.currentPhase,
      percentage: trackerProgress.percentage,
      currentStep: trackerProgress.currentStep,
      message: trackerProgress.estimatedTimeRemainingMs !== undefined
        ? `Estimated time remaining: ${this.formatTime(trackerProgress.estimatedTimeRemainingMs)}`
        : undefined,
    };
    this.emit('progress', progress);
  }

  /**
   * Formats time in milliseconds to human-readable string
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Emits a progress event (legacy method for backward compatibility)
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
    // Emit final 100% progress using tracker
    const finalProgress = this.progressTracker.getProgress();
    this.emitProgress(100, 'Installation complete!',
      `Total time: ${this.formatTime(finalProgress.elapsedTimeMs)}`);
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
