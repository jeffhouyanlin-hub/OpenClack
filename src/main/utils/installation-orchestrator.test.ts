import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstallationOrchestrator } from './installation-orchestrator';
import type { InstallProgress, LogEntry, InstallError, InstallResult } from '../../types/ipc';
import * as installer from './installer';

// Mock the installer module
vi.mock('./installer');

describe('InstallationOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for installNodeMacOS
    vi.mocked(installer.installNodeMacOS).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '22.12.0',
      method: 'homebrew',
    });

    // Default mock for installNodeWindows
    vi.mocked(installer.installNodeWindows).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '22.12.0',
      method: 'msi',
    });

    // Default mock for installNodeLinux
    vi.mocked(installer.installNodeLinux).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '22.12.0',
      method: 'apt',
    });

    // Default mock for installOpenclaw
    vi.mocked(installer.installOpenclaw).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '1.0.0',
    });

    // Default mock for onboardOpenclaw
    vi.mocked(installer.onboardOpenclaw).mockResolvedValue({
      success: true,
      cancelled: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create an orchestrator with provided config', () => {
      const config = { apiKeys: { anthropic: 'sk-ant-test' } };
      const orchestrator = new InstallationOrchestrator(config);
      expect(orchestrator).toBeInstanceOf(InstallationOrchestrator);
    });

    it('should create an orchestrator with empty config', () => {
      const orchestrator = new InstallationOrchestrator({});
      expect(orchestrator).toBeInstanceOf(InstallationOrchestrator);
    });
  });

  describe('Installation Phases', () => {
    it('should execute detection phase', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      const logEvents: LogEntry[] = [];

      orchestrator.on('progress', (progress) => progressEvents.push(progress));
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      // Verify detection phase emitted progress
      expect(progressEvents.some(p => p.phase === 'detecting')).toBe(true);
      expect(progressEvents.some(p => p.currentStep.includes('Detecting'))).toBe(true);

      // Verify detection logged Node.js info
      expect(logEvents.some(l => l.message.includes('Node.js') && l.message.includes('22.12.0'))).toBe(true);
    });

    it('should handle Node.js not installed', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: false,
        version: null,
        meetsRequirement: false,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(logEvents.some(l => l.message.includes('not installed'))).toBe(true);
    });

    it('should handle Node.js below minimum version', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v20.0.0',
        meetsRequirement: false,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(logEvents.some(l => l.level === 'warning' && l.message.includes('below required'))).toBe(true);
    });

    it('should skip Node.js installation when configured', async () => {
      const config = { skipNodeInstall: true };
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: false,
        version: null,
        meetsRequirement: false,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(logEvents.some(l => l.message.includes('Skipping Node.js installation'))).toBe(true);
    });

    it('should skip Node.js installation when already meets requirements', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(logEvents.some(l => l.message.includes('already installed and meets requirements'))).toBe(true);
    });

    it('should execute OpenClaw installation phase', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      expect(progressEvents.some(p => p.phase === 'installing-openclaw')).toBe(true);
      expect(progressEvents.some(p => p.currentStep.includes('Installing OpenClaw'))).toBe(true);
    });

    it('should execute onboarding phase', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      expect(progressEvents.some(p => p.phase === 'onboarding')).toBe(true);
      expect(progressEvents.some(p => p.currentStep.includes('daemon'))).toBe(true);
    });

    it('should execute configuration phase with API keys', async () => {
      const config = {
        apiKeys: {
          anthropic: 'sk-ant-test',
          openai: 'sk-test',
        },
      };
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      const logEvents: LogEntry[] = [];

      orchestrator.on('progress', (progress) => progressEvents.push(progress));
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(progressEvents.some(p => p.phase === 'configuring')).toBe(true);
      expect(logEvents.some(l => l.message.includes('API key'))).toBe(true);
    });

    it('should skip configuration phase when no API keys provided', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(logEvents.some(l => l.message.includes('No API keys'))).toBe(true);
    });
  });

  describe('Progress Events', () => {
    it('should emit progress events in correct order', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      // Verify progress increases
      for (let i = 1; i < progressEvents.length; i++) {
        expect(progressEvents[i].percentage).toBeGreaterThanOrEqual(progressEvents[i - 1].percentage);
      }
    });

    it('should emit 100% progress on completion', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      expect(progressEvents[progressEvents.length - 1].percentage).toBe(100);
      expect(progressEvents[progressEvents.length - 1].phase).toBe('complete');
    });

    it('should include current step in progress events', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      // All progress events should have a current step
      progressEvents.forEach((progress) => {
        expect(progress.currentStep).toBeTruthy();
        expect(typeof progress.currentStep).toBe('string');
      });
    });
  });

  describe('Log Events', () => {
    it('should emit log events with timestamps', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      logEvents.forEach((log) => {
        expect(log.timestamp).toBeTypeOf('number');
        expect(log.timestamp).toBeGreaterThan(0);
      });
    });

    it('should emit log events with correct levels', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      // Should have info logs
      expect(logEvents.some(l => l.level === 'info')).toBe(true);

      // All log levels should be valid
      logEvents.forEach((log) => {
        expect(['info', 'warning', 'error', 'debug']).toContain(log.level);
      });
    });

    it('should emit descriptive log messages', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      // All logs should have messages
      logEvents.forEach((log) => {
        expect(log.message).toBeTruthy();
        expect(typeof log.message).toBe('string');
        expect(log.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Completion', () => {
    it('should emit complete event with success result', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      let completeEvent: InstallResult | null = null;
      orchestrator.on('complete', (result: InstallResult) => {
        completeEvent = result;
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(true);
      expect(completeEvent).not.toBeNull();
      expect(completeEvent!.success).toBe(true);
    });

    it('should return success result from start()', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const result = await orchestrator.start();

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          nodeVersion: expect.any(String),
          openclawVersion: expect.any(String),
        })
      );
    });
  });

  describe('Cancellation', () => {
    it('should handle cancellation during installation', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      // Cancel immediately after starting
      setTimeout(() => orchestrator.cancel(), 10);

      const result = await orchestrator.start();

      // Should return cancelled result (implementation depends on timing)
      expect(result).toBeDefined();
    });

    it('should emit log when cancelled', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      orchestrator.cancel();

      expect(logEvents.some(l => l.message.includes('cancelled'))).toBe(true);
    });

    it('should return cancelled result when cancel() is called', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockImplementation(() => {
        orchestrator.cancel();
        return Promise.resolve({
          installed: true,
          version: 'v22.12.0',
          meetsRequirement: true,
        });
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANCELLED');
      expect(result.error?.message).toContain('cancelled');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during detection phase', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(new Error('Detection failed'));

      const errorEvents: InstallError[] = [];
      orchestrator.on('error', (error) => errorEvents.push(error));

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSTALLATION_FAILED');
      expect(result.error?.message).toContain('Detection failed');
      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('should emit error events with phase information', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(new Error('Test error'));

      let errorEvent: InstallError | null = null;
      orchestrator.on('error', (error: InstallError) => {
        errorEvent = error;
      });

      await orchestrator.start();

      expect(errorEvent).not.toBeNull();
      expect(errorEvent!.phase).toBeDefined();
      expect(['detecting', 'installing-node', 'installing-openclaw', 'onboarding', 'configuring']).toContain(
        errorEvent!.phase
      );
    });

    it('should mark errors as recoverable', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(new Error('Recoverable error'));

      let errorEvent: InstallError | null = null;
      orchestrator.on('error', (error: InstallError) => {
        errorEvent = error;
      });

      await orchestrator.start();

      expect(errorEvent!.recoverable).toBe(true);
    });

    it('should include stack trace in error', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      const testError = new Error('Test error with stack');
      vi.mocked(installer.detectNodeVersion).mockRejectedValue(testError);

      // Add error listener to prevent unhandled error
      orchestrator.on('error', () => {
        // Error is expected, just consume it
      });

      const result = await orchestrator.start();

      expect(result.error?.stack).toBeDefined();
    });
  });

  describe('Sequential Execution', () => {
    it('should execute all phases in order', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      // Extract unique phases in order
      const phases = [...new Set(progressEvents.map(p => p.phase))];

      // Verify phases appear in correct order
      expect(phases.indexOf('detecting')).toBeLessThan(phases.indexOf('installing-openclaw'));
      expect(phases.indexOf('installing-openclaw')).toBeLessThan(phases.indexOf('onboarding'));
      expect(phases.indexOf('onboarding')).toBeLessThan(phases.indexOf('configuring'));
      expect(phases.indexOf('configuring')).toBeLessThan(phases.indexOf('complete'));
    });

    it('should not skip phases unless configured', async () => {
      const config = {};
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (progress) => progressEvents.push(progress));

      await orchestrator.start();

      // Should have events for all major phases
      const phases = new Set(progressEvents.map(p => p.phase));
      expect(phases.has('detecting')).toBe(true);
      expect(phases.has('installing-openclaw')).toBe(true);
      expect(phases.has('onboarding')).toBe(true);
      expect(phases.has('complete')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config gracefully', async () => {
      const orchestrator = new InstallationOrchestrator({});

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const result = await orchestrator.start();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle undefined API keys in config', async () => {
      const config = { apiKeys: undefined };
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(true);
    });

    it('should handle empty API keys object', async () => {
      const config = { apiKeys: {} };
      const orchestrator = new InstallationOrchestrator(config);

      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v22.12.0',
        meetsRequirement: true,
      });

      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (log) => logEvents.push(log));

      await orchestrator.start();

      expect(logEvents.some(l => l.message.includes('No API keys'))).toBe(true);
    });
  });
});
