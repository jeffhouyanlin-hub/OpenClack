import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
};

export interface LoggerOptions {
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  minLevel?: LogLevel;
}

export class Logger {
  private logDir: string;
  private maxFileSize: number;
  private maxFiles: number;
  private minLevel: LogLevel;
  private currentLogFile: string;
  private writeQueue: Promise<void> = Promise.resolve();
  private initialized = false;

  constructor(options?: LoggerOptions) {
    this.logDir = options?.logDir ?? join(homedir(), '.openclaw', 'logs');
    this.maxFileSize = options?.maxFileSize ?? 5 * 1024 * 1024; // 5MB
    this.maxFiles = options?.maxFiles ?? 5;
    this.minLevel = options?.minLevel ?? 'info';
    this.currentLogFile = this.generateLogFileName();
  }

  private generateLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return join(this.logDir, `openclack-${date}.log`);
  }

  private async ensureLogDir(): Promise<void> {
    if (this.initialized) return;
    try {
      await fs.mkdir(this.logDir, { recursive: true, mode: 0o700 });
      this.initialized = true;
    } catch {
      // Directory might already exist
      this.initialized = true;
    }
  }

  private formatEntry(level: LogLevel, message: string, details?: string): string {
    const timestamp = new Date().toISOString();
    const lvl = level.toUpperCase().padEnd(7);
    let line = `[${timestamp}] ${lvl} ${message}`;
    if (details) {
      line += `\n  ${details.replace(/\n/g, '\n  ')}`;
    }
    return line + '\n';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  async write(level: LogLevel, message: string, details?: string): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, details);

    this.writeQueue = this.writeQueue.then(async () => {
      try {
        await this.ensureLogDir();
        await this.rotateIfNeeded();
        await fs.appendFile(this.currentLogFile, entry, { encoding: 'utf-8' });
      } catch {
        // Silently fail - logging should not break the app
      }
    });

    return this.writeQueue;
  }

  async debug(message: string, details?: string): Promise<void> {
    return this.write('debug', message, details);
  }

  async info(message: string, details?: string): Promise<void> {
    return this.write('info', message, details);
  }

  async warning(message: string, details?: string): Promise<void> {
    return this.write('warning', message, details);
  }

  async error(message: string, details?: string): Promise<void> {
    return this.write('error', message, details);
  }

  private async rotateIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile);
      if (stats.size >= this.maxFileSize) {
        this.currentLogFile = this.generateLogFileName();
        await this.cleanOldLogs();
      }
    } catch {
      // File might not exist yet, that's fine
    }
  }

  private async cleanOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(f => f.startsWith('openclack-') && f.endsWith('.log'))
        .sort()
        .reverse();

      if (logFiles.length > this.maxFiles) {
        const toDelete = logFiles.slice(this.maxFiles);
        for (const file of toDelete) {
          await fs.unlink(join(this.logDir, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  getLogDir(): string {
    return this.logDir;
  }

  getCurrentLogFile(): string {
    return this.currentLogFile;
  }
}
