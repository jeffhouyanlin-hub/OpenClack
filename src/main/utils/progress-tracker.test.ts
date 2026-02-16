import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressTracker, ProgressStep } from './progress-tracker';

describe('ProgressTracker', () => {
  let steps: ProgressStep[];

  beforeEach(() => {
    steps = [
      { name: 'Step 1', weight: 10, completed: false },
      { name: 'Step 2', weight: 20, completed: false },
      { name: 'Step 3', weight: 30, completed: false },
      { name: 'Step 4', weight: 40, completed: false },
    ];
  });

  describe('Constructor', () => {
    it('should initialize with provided steps', () => {
      const tracker = new ProgressTracker(steps);
      expect(tracker.getSteps()).toHaveLength(4);
    });

    it('should calculate total weight correctly', () => {
      const tracker = new ProgressTracker(steps);
      // With no progress, percentage should be 0
      expect(tracker.calculatePercentage()).toBe(0);
    });

    it('should initialize with start time', () => {
      const tracker = new ProgressTracker(steps);
      const elapsed = tracker.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('startStep', () => {
    it('should mark step as started', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      expect(tracker.getCurrentStepName()).toBe('Step 1');
    });

    it('should set start time for step', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].startTime).toBeDefined();
    });

    it('should initialize subProgress to 0', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].subProgress).toBe(0);
    });

    it('should throw error for non-existent step', () => {
      const tracker = new ProgressTracker(steps);
      expect(() => tracker.startStep('Non-existent')).toThrow('Step not found: Non-existent');
    });
  });

  describe('updateSubProgress', () => {
    it('should update sub-progress for current step', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.updateSubProgress(50);
      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].subProgress).toBe(50);
    });

    it('should clamp sub-progress to 0-100 range', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.updateSubProgress(150);
      expect(tracker.getSteps()[0].subProgress).toBe(100);

      tracker.updateSubProgress(-50);
      expect(tracker.getSteps()[0].subProgress).toBe(0);
    });

    it('should do nothing if no step is started', () => {
      const tracker = new ProgressTracker(steps);
      tracker.updateSubProgress(50);
      // Should not throw error
      expect(tracker.getCurrentStepName()).toBe('Unknown');
    });
  });

  describe('completeStep', () => {
    it('should mark step as completed', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].completed).toBe(true);
    });

    it('should set end time for step', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].endTime).toBeDefined();
    });

    it('should set subProgress to 100', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].subProgress).toBe(100);
    });

    it('should throw error for non-existent step', () => {
      const tracker = new ProgressTracker(steps);
      expect(() => tracker.completeStep('Non-existent')).toThrow('Step not found: Non-existent');
    });
  });

  describe('calculatePercentage', () => {
    it('should return 0 when no steps completed', () => {
      const tracker = new ProgressTracker(steps);
      expect(tracker.calculatePercentage()).toBe(0);
    });

    it('should return correct percentage for one completed step', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      // Step 1 weight: 10, total weight: 100
      expect(tracker.calculatePercentage()).toBe(10);
    });

    it('should return correct percentage for multiple completed steps', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      tracker.startStep('Step 2');
      tracker.completeStep('Step 2');
      // Step 1 + Step 2 weight: 30, total weight: 100
      expect(tracker.calculatePercentage()).toBe(30);
    });

    it('should include sub-progress in calculation', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      tracker.startStep('Step 2');
      tracker.updateSubProgress(50);
      // Step 1 (10) + Step 2 (20 * 0.5) = 20
      expect(tracker.calculatePercentage()).toBe(20);
    });

    it('should return 100 when all steps completed', () => {
      const tracker = new ProgressTracker(steps);
      for (const step of steps) {
        tracker.startStep(step.name);
        tracker.completeStep(step.name);
      }
      expect(tracker.calculatePercentage()).toBe(100);
    });

    it('should round percentage to nearest integer', () => {
      const customSteps: ProgressStep[] = [
        { name: 'A', weight: 33, completed: false },
        { name: 'B', weight: 33, completed: false },
        { name: 'C', weight: 34, completed: false },
      ];
      const tracker = new ProgressTracker(customSteps);
      tracker.startStep('A');
      tracker.completeStep('A');
      // 33/100 = 33%
      expect(tracker.calculatePercentage()).toBe(33);
    });

    it('should never exceed 100%', () => {
      const tracker = new ProgressTracker(steps);
      // Complete all steps
      for (const step of steps) {
        tracker.startStep(step.name);
        tracker.updateSubProgress(150); // Try to set over 100
        tracker.completeStep(step.name);
      }
      expect(tracker.calculatePercentage()).toBe(100);
    });
  });

  describe('getCurrentStepName', () => {
    it('should return Unknown when no step started', () => {
      const tracker = new ProgressTracker(steps);
      expect(tracker.getCurrentStepName()).toBe('Unknown');
    });

    it('should return current step name', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 2');
      expect(tracker.getCurrentStepName()).toBe('Step 2');
    });

    it('should return last started step', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.startStep('Step 2');
      expect(tracker.getCurrentStepName()).toBe('Step 2');
    });
  });

  describe('calculateEstimatedTimeRemaining', () => {
    it('should return undefined when no steps completed', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      expect(tracker.calculateEstimatedTimeRemaining()).toBeUndefined();
    });

    it('should calculate estimate based on completed steps', () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000);
      const tracker = new ProgressTracker(steps);

      // Complete Step 1 (weight 10) in 1000ms
      vi.setSystemTime(1000);
      tracker.startStep('Step 1');
      vi.setSystemTime(2000);
      tracker.completeStep('Step 1');

      // Remaining weight: 20 + 30 + 40 = 90
      // Average time per weight: 1000ms / 10 = 100ms
      // Estimated remaining: 90 * 100 = 9000ms
      const estimate = tracker.calculateEstimatedTimeRemaining();
      expect(estimate).toBe(9000);
      vi.useRealTimers();
    });

    it('should account for sub-progress in current step', () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000);
      const tracker = new ProgressTracker(steps);

      // Complete Step 1 (weight 10) in 1000ms
      vi.setSystemTime(1000);
      tracker.startStep('Step 1');
      vi.setSystemTime(2000);
      tracker.completeStep('Step 1');

      // Start Step 2 with 50% sub-progress
      tracker.startStep('Step 2');
      tracker.updateSubProgress(50);

      // Remaining weight: 20*0.5 + 30 + 40 = 80
      // Average time per weight: 1000ms / 10 = 100ms
      // Estimated remaining: 80 * 100 = 8000ms
      const estimate = tracker.calculateEstimatedTimeRemaining();
      expect(estimate).toBe(8000);
      vi.useRealTimers();
    });

    it('should return 0 when all steps completed', () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      const tracker = new ProgressTracker(steps);

      for (let i = 0; i < steps.length; i++) {
        vi.setSystemTime(i * 1000);
        tracker.startStep(steps[i].name);
        vi.setSystemTime((i + 1) * 1000);
        tracker.completeStep(steps[i].name);
      }
      expect(tracker.calculateEstimatedTimeRemaining()).toBe(0);
      vi.useRealTimers();
    });

    it('should use average across multiple completed steps', () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      const tracker = new ProgressTracker(steps);

      // Complete Step 1 (weight 10) in 1000ms
      vi.setSystemTime(0);
      tracker.startStep('Step 1');
      vi.setSystemTime(1000);
      tracker.completeStep('Step 1');

      // Complete Step 2 (weight 20) in 3000ms
      vi.setSystemTime(1000);
      tracker.startStep('Step 2');
      vi.setSystemTime(4000);
      tracker.completeStep('Step 2');

      // Total time: 4000ms, total weight: 30
      // Average time per weight: 4000 / 30 ≈ 133.33ms
      // Remaining weight: 30 + 40 = 70
      // Estimated remaining: 70 * 133.33 ≈ 9333ms
      const estimate = tracker.calculateEstimatedTimeRemaining();
      expect(estimate).toBeGreaterThan(9000);
      expect(estimate).toBeLessThan(10000);
      vi.useRealTimers();
    });
  });

  describe('getElapsedTime', () => {
    it('should return time since tracker creation', () => {
      const tracker = new ProgressTracker(steps);
      const elapsed = tracker.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should increase over time', async () => {
      const tracker = new ProgressTracker(steps);
      const elapsed1 = tracker.getElapsedTime();
      await new Promise(resolve => setTimeout(resolve, 10));
      const elapsed2 = tracker.getElapsedTime();
      expect(elapsed2).toBeGreaterThan(elapsed1);
    });
  });

  describe('getProgress', () => {
    it('should return complete progress result', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      const progress = tracker.getProgress();

      expect(progress).toHaveProperty('percentage');
      expect(progress).toHaveProperty('currentStep');
      expect(progress).toHaveProperty('estimatedTimeRemainingMs');
      expect(progress).toHaveProperty('elapsedTimeMs');
    });

    it('should have correct percentage', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      const progress = tracker.getProgress();
      expect(progress.percentage).toBe(10);
    });

    it('should have correct current step', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 2');
      const progress = tracker.getProgress();
      expect(progress.currentStep).toBe('Step 2');
    });

    it('should include elapsed time', () => {
      const tracker = new ProgressTracker(steps);
      const progress = tracker.getProgress();
      expect(progress.elapsedTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('should reset all steps to incomplete', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      tracker.reset();

      const trackerSteps = tracker.getSteps();
      for (const step of trackerSteps) {
        expect(step.completed).toBe(false);
      }
    });

    it('should reset current step index', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.reset();
      expect(tracker.getCurrentStepName()).toBe('Unknown');
    });

    it('should reset start time', () => {
      const tracker = new ProgressTracker(steps);
      const elapsed1 = tracker.getElapsedTime();
      tracker.reset();
      const elapsed2 = tracker.getElapsedTime();
      expect(elapsed2).toBeLessThan(elapsed1 + 10);
    });

    it('should clear step timing data', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.completeStep('Step 1');
      tracker.reset();

      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].startTime).toBeUndefined();
      expect(trackerSteps[0].endTime).toBeUndefined();
    });

    it('should reset sub-progress to 0', () => {
      const tracker = new ProgressTracker(steps);
      tracker.startStep('Step 1');
      tracker.updateSubProgress(75);
      tracker.reset();

      const trackerSteps = tracker.getSteps();
      expect(trackerSteps[0].subProgress).toBe(0);
    });
  });

  describe('getSteps', () => {
    it('should return copy of steps', () => {
      const tracker = new ProgressTracker(steps);
      const retrievedSteps = tracker.getSteps();
      expect(retrievedSteps).not.toBe(steps);
    });

    it('should prevent external modification', () => {
      const tracker = new ProgressTracker(steps);
      const retrievedSteps = tracker.getSteps();
      retrievedSteps[0].completed = true;

      const secondRetrieve = tracker.getSteps();
      expect(secondRetrieve[0].completed).toBe(false);
    });

    it('should return all steps', () => {
      const tracker = new ProgressTracker(steps);
      const retrievedSteps = tracker.getSteps();
      expect(retrievedSteps).toHaveLength(4);
      expect(retrievedSteps[0].name).toBe('Step 1');
      expect(retrievedSteps[3].name).toBe('Step 4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      const tracker = new ProgressTracker([]);
      expect(tracker.calculatePercentage()).toBe(0);
    });

    it('should handle single step', () => {
      const singleStep: ProgressStep[] = [{ name: 'Only', weight: 100, completed: false }];
      const tracker = new ProgressTracker(singleStep);
      tracker.startStep('Only');
      tracker.completeStep('Only');
      expect(tracker.calculatePercentage()).toBe(100);
    });

    it('should handle steps with zero weight', () => {
      const zeroSteps: ProgressStep[] = [
        { name: 'A', weight: 0, completed: false },
        { name: 'B', weight: 100, completed: false },
      ];
      const tracker = new ProgressTracker(zeroSteps);
      tracker.startStep('A');
      tracker.completeStep('A');
      expect(tracker.calculatePercentage()).toBe(0);

      tracker.startStep('B');
      tracker.completeStep('B');
      expect(tracker.calculatePercentage()).toBe(100);
    });

    it('should handle very small weights correctly', () => {
      const smallSteps: ProgressStep[] = [
        { name: 'A', weight: 1, completed: false },
        { name: 'B', weight: 1, completed: false },
        { name: 'C', weight: 1, completed: false },
      ];
      const tracker = new ProgressTracker(smallSteps);
      tracker.startStep('A');
      tracker.completeStep('A');
      // 1/3 = 33.33...% should round to 33%
      expect(tracker.calculatePercentage()).toBe(33);
    });
  });

  describe('Integration Tests', () => {
    it('should handle realistic installation workflow', () => {
      const tracker = new ProgressTracker(steps);

      // Start and complete steps sequentially
      tracker.startStep('Step 1');
      expect(tracker.calculatePercentage()).toBe(0);

      tracker.updateSubProgress(50);
      expect(tracker.calculatePercentage()).toBe(5); // 10 * 0.5

      tracker.completeStep('Step 1');
      expect(tracker.calculatePercentage()).toBe(10);

      tracker.startStep('Step 2');
      tracker.updateSubProgress(25);
      expect(tracker.calculatePercentage()).toBe(15); // 10 + 20*0.25

      tracker.completeStep('Step 2');
      expect(tracker.calculatePercentage()).toBe(30);

      tracker.startStep('Step 3');
      tracker.completeStep('Step 3');
      expect(tracker.calculatePercentage()).toBe(60);

      tracker.startStep('Step 4');
      tracker.completeStep('Step 4');
      expect(tracker.calculatePercentage()).toBe(100);
    });

    it('should provide time estimates during workflow', () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      const tracker = new ProgressTracker(steps);

      // Complete first step with known duration
      vi.setSystemTime(0);
      tracker.startStep('Step 1');
      vi.setSystemTime(1000);
      tracker.completeStep('Step 1');

      // Should have estimate for remaining work
      const estimate = tracker.calculateEstimatedTimeRemaining();
      expect(estimate).toBeDefined();
      expect(estimate).toBeGreaterThan(0);
      vi.useRealTimers();
    });
  });
});
