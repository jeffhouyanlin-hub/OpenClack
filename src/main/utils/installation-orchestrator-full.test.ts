/**
 * feat-046: Full InstallationOrchestrator test suite
 *
 * Tests progress event emission, phase execution, cancellation handling,
 * and result building for the InstallationOrchestrator class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstallationOrchestrator, InstallationPhase } from './installation-orchestrator';
import type { InstallProgress, LogEntry, InstallError, InstallResult } from '../../types/ipc';
import * as installer from './installer';

// Mock the installer module
vi.mock('./installer');

describe('InstallationOrchestrator - Full Suite (feat-046)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for a successful run
    vi.mocked(installer.detectNodeVersion).mockResolvedValue({
      installed: true,
      version: 'v22.12.0',
      meetsRequirement: true,
    });

    vi.mocked(installer.installNodeMacOS).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '22.12.0',
      method: 'homebrew',
    });

    vi.mocked(installer.installNodeWindows).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '22.12.0',
      method: 'msi',
    });

    vi.mocked(installer.installNodeLinux).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '22.12.0',
      method: 'apt',
    });

    vi.mocked(installer.installOpenclaw).mockResolvedValue({
      success: true,
      cancelled: false,
      version: '1.0.0',
    });

    vi.mocked(installer.onboardOpenclaw).mockResolvedValue({
      success: true,
      cancelled: false,
    });

    vi.mocked(installer.configureAPIKeys).mockResolvedValue({
      success: true,
      configPath: '/mock/home/.openclaw/config.json',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Progress Event Emission', () => {
    it('should emit progress events during each phase', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (p: InstallProgress) => progressEvents.push(p));

      await orchestrator.start();

      // Should have emitted multiple progress events
      expect(progressEvents.length).toBeGreaterThan(5);
    });

    it('should emit progress events with increasing percentage', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const percentages: number[] = [];
      orchestrator.on('progress', (p: InstallProgress) => percentages.push(p.percentage));

      await orchestrator.start();

      // Percentages should be non-decreasing
      for (let i = 1; i < percentages.length; i++) {
        expect(percentages[i]).toBeGreaterThanOrEqual(percentages[i - 1]);
      }
    });

    it('should emit progress with phase field matching current phase', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const phases: string[] = [];
      orchestrator.on('progress', (p: InstallProgress) => {
        if (!phases.includes(p.phase)) {
          phases.push(p.phase);
        }
      });

      await orchestrator.start();

      // Should pass through all phases
      expect(phases).toContain('detecting');
      expect(phases).toContain('installing-openclaw');
      expect(phases).toContain('onboarding');
      expect(phases).toContain('configuring');
      expect(phases).toContain('complete');
    });

    it('should emit progress events with non-empty currentStep', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (p: InstallProgress) => progressEvents.push(p));

      await orchestrator.start();

      progressEvents.forEach((p) => {
        expect(p.currentStep).toBeTruthy();
        expect(typeof p.currentStep).toBe('string');
      });
    });

    it('should emit 100% progress when installation succeeds', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (p: InstallProgress) => progressEvents.push(p));

      await orchestrator.start();

      const lastEvent = progressEvents[progressEvents.length - 1];
      expect(lastEvent.percentage).toBe(100);
      expect(lastEvent.phase).toBe('complete');
    });

    it('should include time estimate message in some progress events', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const progressEvents: InstallProgress[] = [];
      orchestrator.on('progress', (p: InstallProgress) => progressEvents.push(p));

      await orchestrator.start();

      // Some events may have messages, some may not
      const eventsWithMessage = progressEvents.filter((p) => p.message);
      // The last event should have total time info
      expect(progressEvents[progressEvents.length - 1].message).toBeDefined();
    });
  });

  describe('Phase Execution Order', () => {
    it('should execute phases in correct order: detect -> node -> openclaw -> onboard -> configure', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const phaseOrder: string[] = [];
      orchestrator.on('progress', (p: InstallProgress) => {
        if (phaseOrder.length === 0 || phaseOrder[phaseOrder.length - 1] !== p.phase) {
          phaseOrder.push(p.phase);
        }
      });

      await orchestrator.start();

      const detectIdx = phaseOrder.indexOf('detecting');
      const openclawIdx = phaseOrder.indexOf('installing-openclaw');
      const onboardIdx = phaseOrder.indexOf('onboarding');
      const configIdx = phaseOrder.indexOf('configuring');
      const completeIdx = phaseOrder.indexOf('complete');

      expect(detectIdx).toBeLessThan(openclawIdx);
      expect(openclawIdx).toBeLessThan(onboardIdx);
      expect(onboardIdx).toBeLessThan(configIdx);
      expect(configIdx).toBeLessThan(completeIdx);
    });

    it('should call detectNodeVersion during detection phase', async () => {
      const orchestrator = new InstallationOrchestrator({});
      await orchestrator.start();

      // detectNodeVersion is called during detection and during node install check
      expect(installer.detectNodeVersion).toHaveBeenCalled();
    });

    it('should call installOpenclaw during openclaw install phase', async () => {
      const orchestrator = new InstallationOrchestrator({});
      await orchestrator.start();

      expect(installer.installOpenclaw).toHaveBeenCalledTimes(1);
    });

    it('should call onboardOpenclaw during onboarding phase', async () => {
      const orchestrator = new InstallationOrchestrator({});
      await orchestrator.start();

      expect(installer.onboardOpenclaw).toHaveBeenCalledTimes(1);
    });

    it('should call configureAPIKeys during configuration phase when keys provided', async () => {
      const orchestrator = new InstallationOrchestrator({
        apiKeys: { anthropic: 'sk-ant-test-key-12345' },
      });
      await orchestrator.start();

      expect(installer.configureAPIKeys).toHaveBeenCalledTimes(1);
    });

    it('should not call configureAPIKeys when no API keys provided', async () => {
      const orchestrator = new InstallationOrchestrator({});
      await orchestrator.start();

      expect(installer.configureAPIKeys).not.toHaveBeenCalled();
    });
  });

  describe('Cancellation Handling', () => {
    it('should set cancelled flag when cancel() is called', () => {
      const orchestrator = new InstallationOrchestrator({});
      orchestrator.on('log', () => {});
      orchestrator.cancel();

      // Verify cancel was logged
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));
      orchestrator.cancel();
      expect(logEvents.some((l) => l.message.includes('cancelled'))).toBe(true);
    });

    it('should return cancelled result with CANCELLED code', async () => {
      const orchestrator = new InstallationOrchestrator({});

      // Cancel during detection
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
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('CANCELLED');
      expect(result.error!.message).toContain('cancelled');
    });

    it('should stop execution at detection phase when cancelled', async () => {
      const orchestrator = new InstallationOrchestrator({});

      vi.mocked(installer.detectNodeVersion).mockImplementation(() => {
        orchestrator.cancel();
        return Promise.resolve({
          installed: true,
          version: 'v22.12.0',
          meetsRequirement: true,
        });
      });

      await orchestrator.start();

      // installOpenclaw should NOT have been called since we cancelled before it
      expect(installer.installOpenclaw).not.toHaveBeenCalled();
    });

    it('should emit complete event with cancelled result', async () => {
      const orchestrator = new InstallationOrchestrator({});
      let completeResult: InstallResult | null = null;
      orchestrator.on('complete', (r: InstallResult) => {
        completeResult = r;
      });

      vi.mocked(installer.detectNodeVersion).mockImplementation(() => {
        orchestrator.cancel();
        return Promise.resolve({
          installed: true,
          version: 'v22.12.0',
          meetsRequirement: true,
        });
      });

      await orchestrator.start();

      expect(completeResult).not.toBeNull();
      expect(completeResult!.success).toBe(false);
      expect(completeResult!.error!.code).toBe('CANCELLED');
    });

    it('should handle cancellation during openclaw install phase', async () => {
      const orchestrator = new InstallationOrchestrator({});

      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: true,
        error: 'User cancelled',
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANCELLED');
    });

    it('should handle cancellation during onboarding phase', async () => {
      const orchestrator = new InstallationOrchestrator({});

      vi.mocked(installer.onboardOpenclaw).mockResolvedValue({
        success: false,
        cancelled: true,
        error: 'User cancelled',
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANCELLED');
    });
  });

  describe('Result Building', () => {
    it('should build success result with nodeVersion and openclawVersion', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const result = await orchestrator.start();

      expect(result.success).toBe(true);
      expect(result.nodeVersion).toBeDefined();
      expect(result.openclawVersion).toBeDefined();
    });

    it('should build error result when detection fails', async () => {
      const orchestrator = new InstallationOrchestrator({});
      orchestrator.on('error', () => {}); // Consume error event

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(
        new Error('Network timeout during detection')
      );

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('INSTALLATION_FAILED');
      expect(result.error!.message).toContain('Network timeout');
      expect(result.error!.recoverable).toBe(true);
    });

    it('should build error result when openclaw install fails', async () => {
      const orchestrator = new InstallationOrchestrator({});
      orchestrator.on('error', () => {});

      vi.mocked(installer.installOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'npm install failed',
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('npm install failed');
    });

    it('should build error result when onboarding fails', async () => {
      const orchestrator = new InstallationOrchestrator({});
      orchestrator.on('error', () => {});

      vi.mocked(installer.onboardOpenclaw).mockResolvedValue({
        success: false,
        cancelled: false,
        error: 'Daemon setup failed',
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('Daemon');
    });

    it('should build error result when API key configuration fails', async () => {
      const orchestrator = new InstallationOrchestrator({
        apiKeys: { anthropic: 'sk-ant-test-123' },
      });
      orchestrator.on('error', () => {});

      vi.mocked(installer.configureAPIKeys).mockResolvedValue({
        success: false,
        error: 'Permission denied writing config',
      });

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error!.message).toContain('Permission denied');
    });

    it('should include stack trace in error result when available', async () => {
      const orchestrator = new InstallationOrchestrator({});
      orchestrator.on('error', () => {});

      const err = new Error('Test error with stack');
      vi.mocked(installer.detectNodeVersion).mockRejectedValue(err);

      const result = await orchestrator.start();

      expect(result.error!.stack).toBeDefined();
      expect(result.error!.stack).toContain('Test error with stack');
    });

    it('should handle non-Error thrown values', async () => {
      const orchestrator = new InstallationOrchestrator({});
      orchestrator.on('error', () => {});

      vi.mocked(installer.detectNodeVersion).mockRejectedValue('string error');

      const result = await orchestrator.start();

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Unknown error occurred');
    });

    it('should emit complete event on success', async () => {
      const orchestrator = new InstallationOrchestrator({});
      let completeResult: InstallResult | null = null;
      orchestrator.on('complete', (r: InstallResult) => {
        completeResult = r;
      });

      await orchestrator.start();

      expect(completeResult).not.toBeNull();
      expect(completeResult!.success).toBe(true);
    });

    it('should emit complete event on error', async () => {
      const orchestrator = new InstallationOrchestrator({});
      let completeResult: InstallResult | null = null;
      orchestrator.on('complete', (r: InstallResult) => {
        completeResult = r;
      });
      orchestrator.on('error', () => {});

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(new Error('fail'));

      await orchestrator.start();

      expect(completeResult).not.toBeNull();
      expect(completeResult!.success).toBe(false);
    });
  });

  describe('Log Event Emission', () => {
    it('should emit log events with info level during normal operation', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      await orchestrator.start();

      const infoLogs = logEvents.filter((l) => l.level === 'info');
      expect(infoLogs.length).toBeGreaterThan(0);
    });

    it('should emit warning log when Node.js version is below requirement', async () => {
      vi.mocked(installer.detectNodeVersion).mockResolvedValue({
        installed: true,
        version: 'v20.0.0',
        meetsRequirement: false,
      });

      const orchestrator = new InstallationOrchestrator({});
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      await orchestrator.start();

      expect(logEvents.some((l) => l.level === 'warning' && l.message.includes('below required'))).toBe(true);
    });

    it('should emit log events with valid timestamps', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      const beforeStart = Date.now();
      await orchestrator.start();
      const afterEnd = Date.now();

      logEvents.forEach((l) => {
        expect(l.timestamp).toBeGreaterThanOrEqual(beforeStart);
        expect(l.timestamp).toBeLessThanOrEqual(afterEnd);
      });
    });

    it('should emit error log and error event when a phase fails', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const logEvents: LogEntry[] = [];
      const errorEvents: InstallError[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));
      orchestrator.on('error', (e: InstallError) => errorEvents.push(e));

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(new Error('Detection failure'));

      await orchestrator.start();

      expect(logEvents.some((l) => l.level === 'error')).toBe(true);
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].code).toBe('INSTALLATION_FAILED');
    });

    it('should emit log about skipping Node.js install when already meets requirements', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      await orchestrator.start();

      expect(
        logEvents.some((l) => l.message.includes('already installed and meets requirements'))
      ).toBe(true);
    });

    it('should emit log about no API keys when config has empty apiKeys', async () => {
      const orchestrator = new InstallationOrchestrator({ apiKeys: {} });
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      await orchestrator.start();

      expect(logEvents.some((l) => l.message.includes('No API keys'))).toBe(true);
    });

    it('should emit API key count log when keys are configured', async () => {
      const orchestrator = new InstallationOrchestrator({
        apiKeys: { anthropic: 'sk-ant-test-key', openai: 'sk-test-key' },
      });
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      await orchestrator.start();

      expect(logEvents.some((l) => l.message.includes('2 API key(s)'))).toBe(true);
    });
  });

  describe('Error Event Emission', () => {
    it('should emit error events with correct phase information', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const errorEvents: InstallError[] = [];
      orchestrator.on('error', (e: InstallError) => errorEvents.push(e));

      vi.mocked(installer.installOpenclaw).mockRejectedValue(new Error('Openclaw failed'));

      await orchestrator.start();

      expect(errorEvents.length).toBeGreaterThan(0);
      // The phase should be the one where the error occurred
      expect(errorEvents[0].phase).toBeDefined();
    });

    it('should mark errors as recoverable', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const errorEvents: InstallError[] = [];
      orchestrator.on('error', (e: InstallError) => errorEvents.push(e));

      vi.mocked(installer.detectNodeVersion).mockRejectedValue(new Error('Fail'));

      await orchestrator.start();

      expect(errorEvents[0].recoverable).toBe(true);
    });
  });

  describe('InstallationPhase Enum', () => {
    it('should define all expected phases', () => {
      expect(InstallationPhase.DETECTING).toBe('detecting');
      expect(InstallationPhase.INSTALLING_NODE).toBe('installing-node');
      expect(InstallationPhase.INSTALLING_OPENCLAW).toBe('installing-openclaw');
      expect(InstallationPhase.ONBOARDING).toBe('onboarding');
      expect(InstallationPhase.CONFIGURING).toBe('configuring');
      expect(InstallationPhase.COMPLETE).toBe('complete');
    });
  });

  describe('Configuration Handling', () => {
    it('should pass apiKeys to onboardOpenclaw', async () => {
      const config = {
        apiKeys: { anthropic: 'sk-ant-test-key', openai: 'sk-openai-key' },
      };
      const orchestrator = new InstallationOrchestrator(config);

      await orchestrator.start();

      expect(installer.onboardOpenclaw).toHaveBeenCalledWith(
        expect.objectContaining({ apiKeys: config.apiKeys }),
        expect.any(Function)
      );
    });

    it('should pass apiKeys to configureAPIKeys', async () => {
      const config = {
        apiKeys: { anthropic: 'sk-ant-key-123' },
      };
      const orchestrator = new InstallationOrchestrator(config);

      await orchestrator.start();

      expect(installer.configureAPIKeys).toHaveBeenCalledWith(
        config.apiKeys,
        expect.any(Function)
      );
    });

    it('should skip node install when skipNodeInstall is true', async () => {
      const orchestrator = new InstallationOrchestrator({ skipNodeInstall: true });
      const logEvents: LogEntry[] = [];
      orchestrator.on('log', (l: LogEntry) => logEvents.push(l));

      await orchestrator.start();

      expect(logEvents.some((l) => l.message.includes('Skipping Node.js installation'))).toBe(true);
    });
  });

  describe('Multiple Listener Support', () => {
    it('should support multiple progress listeners', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const listener1Events: InstallProgress[] = [];
      const listener2Events: InstallProgress[] = [];

      orchestrator.on('progress', (p: InstallProgress) => listener1Events.push(p));
      orchestrator.on('progress', (p: InstallProgress) => listener2Events.push(p));

      await orchestrator.start();

      expect(listener1Events.length).toBe(listener2Events.length);
      expect(listener1Events.length).toBeGreaterThan(0);
    });

    it('should support multiple log listeners', async () => {
      const orchestrator = new InstallationOrchestrator({});
      const listener1: LogEntry[] = [];
      const listener2: LogEntry[] = [];

      orchestrator.on('log', (l: LogEntry) => listener1.push(l));
      orchestrator.on('log', (l: LogEntry) => listener2.push(l));

      await orchestrator.start();

      expect(listener1.length).toBe(listener2.length);
    });
  });
});
