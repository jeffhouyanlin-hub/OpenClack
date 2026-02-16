/**
 * ProgressTracker - Tracks installation progress with accurate percentage calculation
 * and estimated time remaining
 */

/**
 * Represents a single installation step with its weight and completion status
 */
export interface ProgressStep {
  name: string;
  weight: number; // Relative weight (e.g., 10, 20, 5)
  completed: boolean;
  startTime?: number; // Timestamp when step started
  endTime?: number; // Timestamp when step completed
  subProgress?: number; // Optional: 0-100 for sub-step progress
}

/**
 * Progress tracking result with percentage and time estimate
 */
export interface ProgressResult {
  percentage: number; // 0-100
  currentStep: string;
  estimatedTimeRemainingMs?: number; // Milliseconds remaining (optional)
  elapsedTimeMs: number; // Total elapsed time
}

/**
 * ProgressTracker calculates accurate installation progress
 */
export class ProgressTracker {
  private steps: ProgressStep[];
  private totalWeight: number;
  private startTime: number;
  private currentStepIndex: number = -1;

  /**
   * Creates a new ProgressTracker
   * @param steps - Array of steps with their relative weights
   */
  constructor(steps: ProgressStep[]) {
    this.steps = steps;
    this.totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    this.startTime = Date.now();
  }

  /**
   * Marks a step as started
   * @param stepName - Name of the step to start
   */
  startStep(stepName: string): void {
    const index = this.steps.findIndex(s => s.name === stepName);
    if (index === -1) {
      throw new Error(`Step not found: ${stepName}`);
    }

    this.currentStepIndex = index;
    this.steps[index].startTime = Date.now();
    this.steps[index].completed = false;
    this.steps[index].subProgress = 0;
  }

  /**
   * Updates sub-progress for the current step
   * @param subProgress - 0-100 representing progress within current step
   */
  updateSubProgress(subProgress: number): void {
    if (this.currentStepIndex === -1) {
      return;
    }

    const clamped = Math.max(0, Math.min(100, subProgress));
    this.steps[this.currentStepIndex].subProgress = clamped;
  }

  /**
   * Marks a step as completed
   * @param stepName - Name of the step to complete
   */
  completeStep(stepName: string): void {
    const index = this.steps.findIndex(s => s.name === stepName);
    if (index === -1) {
      throw new Error(`Step not found: ${stepName}`);
    }

    this.steps[index].completed = true;
    this.steps[index].endTime = Date.now();
    this.steps[index].subProgress = 100;
  }

  /**
   * Calculates current progress percentage
   * Takes into account completed steps and sub-progress of current step
   * @returns Percentage (0-100)
   */
  calculatePercentage(): number {
    if (this.totalWeight === 0) {
      return 0;
    }

    let completedWeight = 0;

    for (const step of this.steps) {
      if (step.completed) {
        completedWeight += step.weight;
      } else if (step.subProgress !== undefined && step.subProgress > 0) {
        completedWeight += (step.weight * step.subProgress) / 100;
      }
    }

    const percentage = (completedWeight / this.totalWeight) * 100;
    return Math.min(100, Math.max(0, Math.round(percentage)));
  }

  /**
   * Gets the current step name
   * @returns Name of the current step or 'Unknown' if none
   */
  getCurrentStepName(): string {
    if (this.currentStepIndex === -1) {
      return 'Unknown';
    }
    return this.steps[this.currentStepIndex].name;
  }

  /**
   * Calculates estimated time remaining based on completed steps
   * Uses average time per weight unit to estimate remaining time
   * @returns Estimated time remaining in milliseconds, or undefined if not enough data
   */
  calculateEstimatedTimeRemaining(): number | undefined {
    const completedSteps = this.steps.filter(s => s.completed && s.startTime !== undefined && s.endTime !== undefined);

    if (completedSteps.length === 0) {
      // Not enough data to estimate
      return undefined;
    }

    // Calculate average time per weight unit from completed steps
    let totalTimeForCompletedSteps = 0;
    let totalWeightOfCompletedSteps = 0;

    for (const step of completedSteps) {
      const stepDuration = step.endTime! - step.startTime!;
      totalTimeForCompletedSteps += stepDuration;
      totalWeightOfCompletedSteps += step.weight;
    }

    const avgTimePerWeightUnit = totalTimeForCompletedSteps / totalWeightOfCompletedSteps;

    // Calculate remaining weight
    let remainingWeight = 0;
    for (const step of this.steps) {
      if (!step.completed) {
        if (step.subProgress !== undefined && step.subProgress > 0) {
          // Account for partial progress in current step
          remainingWeight += (step.weight * (100 - step.subProgress)) / 100;
        } else {
          remainingWeight += step.weight;
        }
      }
    }

    const estimatedTimeRemaining = avgTimePerWeightUnit * remainingWeight;
    return Math.max(0, Math.round(estimatedTimeRemaining));
  }

  /**
   * Gets total elapsed time since tracking started
   * @returns Elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Gets complete progress result with percentage and time estimates
   * @returns ProgressResult object
   */
  getProgress(): ProgressResult {
    return {
      percentage: this.calculatePercentage(),
      currentStep: this.getCurrentStepName(),
      estimatedTimeRemainingMs: this.calculateEstimatedTimeRemaining(),
      elapsedTimeMs: this.getElapsedTime(),
    };
  }

  /**
   * Resets the tracker to initial state
   */
  reset(): void {
    this.currentStepIndex = -1;
    this.startTime = Date.now();
    for (const step of this.steps) {
      step.completed = false;
      step.startTime = undefined;
      step.endTime = undefined;
      step.subProgress = 0;
    }
  }

  /**
   * Gets all steps (for debugging/inspection)
   * @returns Array of all steps
   */
  getSteps(): ProgressStep[] {
    return this.steps.map(step => ({ ...step }));
  }
}
