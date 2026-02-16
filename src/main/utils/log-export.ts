/**
 * Log Export Utility - feat-071: Log export functionality
 * Packages logs with system info into a single exportable string
 */
import { platform, arch, release, hostname, totalmem, freemem } from 'os';

export interface LogExportOptions {
  logs: string[];
  appVersion?: string;
  includeSystemInfo?: boolean;
}

export interface LogExportResult {
  content: string;
  filename: string;
  timestamp: number;
}

/**
 * Gathers system information for the export header
 */
export function getSystemInfoBlock(appVersion?: string): string {
  const lines: string[] = [
    '=== OpenClack System Information ===',
    `Date: ${new Date().toISOString()}`,
    `Platform: ${platform()}`,
    `Architecture: ${arch()}`,
    `OS Release: ${release()}`,
    `Hostname: ${hostname()}`,
    `Total Memory: ${Math.round(totalmem() / (1024 * 1024))} MB`,
    `Free Memory: ${Math.round(freemem() / (1024 * 1024))} MB`,
    `Node.js: ${process.version}`,
  ];

  if (appVersion) {
    lines.push(`App Version: ${appVersion}`);
  }

  lines.push('=== End System Information ===');
  lines.push('');

  return lines.join('\n');
}

/**
 * Packages logs with system info into an exportable format
 */
export function exportLogs(options: LogExportOptions): LogExportResult {
  const { logs, appVersion, includeSystemInfo = true } = options;
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const parts: string[] = [];

  if (includeSystemInfo) {
    parts.push(getSystemInfoBlock(appVersion));
  }

  parts.push('=== Installation Logs ===');
  parts.push('');

  if (logs.length === 0) {
    parts.push('(No logs recorded)');
  } else {
    parts.push(...logs);
  }

  parts.push('');
  parts.push('=== End of Log Export ===');

  return {
    content: parts.join('\n'),
    filename: `openclack-logs-${dateStr}.txt`,
    timestamp,
  };
}
