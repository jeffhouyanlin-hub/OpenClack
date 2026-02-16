/**
 * Telemetry - feat-085-086: Analytics with opt-in
 * Stub implementation for usage telemetry (opt-in only)
 */

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  properties?: Record<string, string | number | boolean>;
}

export interface TelemetryConfig {
  enabled: boolean;
  userId?: string;
  sessionId?: string;
}

/**
 * In-memory telemetry collector (stub - does not send data anywhere)
 */
export class TelemetryCollector {
  private events: TelemetryEvent[] = [];
  private config: TelemetryConfig;

  constructor(config?: Partial<TelemetryConfig>) {
    this.config = {
      enabled: config?.enabled ?? false,
      userId: config?.userId,
      sessionId: config?.sessionId || this.generateSessionId(),
    };
  }

  /**
   * Records a telemetry event (only if opted in)
   */
  track(name: string, properties?: Record<string, string | number | boolean>): void {
    if (!this.config.enabled) return;

    this.events.push({
      name,
      timestamp: Date.now(),
      properties,
    });
  }

  /**
   * Gets all collected events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Checks if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enables or disables telemetry
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.events = [];
    }
  }

  /**
   * Gets the session ID
   */
  getSessionId(): string | undefined {
    return this.config.sessionId;
  }

  /**
   * Clears all collected events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Flushes events (stub - in production would send to server)
   * Returns the events that were flushed
   */
  async flush(): Promise<TelemetryEvent[]> {
    if (!this.config.enabled) return [];
    const flushed = [...this.events];
    this.events = [];
    return flushed;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
