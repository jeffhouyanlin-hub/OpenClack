import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

export interface LogMessage {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: string;
  source?: string;
}

export class LogStreamer extends EventEmitter {
  private logHistory: LogMessage[] = [];
  private maxHistorySize: number;
  private batchBuffer: LogMessage[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private batchIntervalMs: number;

  constructor(options?: { maxHistorySize?: number; batchIntervalMs?: number }) {
    super();
    this.maxHistorySize = options?.maxHistorySize ?? 10000;
    this.batchIntervalMs = options?.batchIntervalMs ?? 50;
  }

  log(level: LogMessage['level'], message: string, details?: string, source?: string): void {
    const entry: LogMessage = {
      timestamp: Date.now(),
      level,
      message,
      details,
      source,
    };

    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    this.batchBuffer.push(entry);
    this.scheduleBatchFlush();
  }

  info(message: string, details?: string, source?: string): void {
    this.log('info', message, details, source);
  }

  warning(message: string, details?: string, source?: string): void {
    this.log('warning', message, details, source);
  }

  error(message: string, details?: string, source?: string): void {
    this.log('error', message, details, source);
  }

  debug(message: string, details?: string, source?: string): void {
    this.log('debug', message, details, source);
  }

  attachProcess(child: ChildProcess, source?: string): void {
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          const level = this.detectLevel(line);
          this.log(level, line, undefined, source);
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          const level = line.toLowerCase().includes('warn') ? 'warning' : 'error';
          this.log(level, line, undefined, source);
        }
      });
    }
  }

  getHistory(): LogMessage[] {
    return [...this.logHistory];
  }

  getHistoryByLevel(level: LogMessage['level']): LogMessage[] {
    return this.logHistory.filter(entry => entry.level === level);
  }

  getFullLog(): string {
    return this.logHistory
      .map(entry => {
        const ts = new Date(entry.timestamp).toISOString();
        const lvl = entry.level.toUpperCase().padEnd(7);
        const src = entry.source ? `[${entry.source}] ` : '';
        return `${ts} ${lvl} ${src}${entry.message}`;
      })
      .join('\n');
  }

  clear(): void {
    this.logHistory = [];
    this.batchBuffer = [];
  }

  getHistorySize(): number {
    return this.logHistory.length;
  }

  private detectLevel(line: string): LogMessage['level'] {
    const lower = line.toLowerCase();
    if (lower.includes('error') || lower.includes('err!')) return 'error';
    if (lower.includes('warn')) return 'warning';
    if (lower.includes('debug') || lower.includes('verbose')) return 'debug';
    return 'info';
  }

  private scheduleBatchFlush(): void {
    if (this.batchTimer !== null) return;
    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, this.batchIntervalMs);
  }

  private flushBatch(): void {
    this.batchTimer = null;
    if (this.batchBuffer.length === 0) return;
    const batch = [...this.batchBuffer];
    this.batchBuffer = [];
    this.emit('logs', batch);
    for (const entry of batch) {
      this.emit('log', entry);
    }
  }

  destroy(): void {
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.flushBatch();
    this.removeAllListeners();
  }
}
