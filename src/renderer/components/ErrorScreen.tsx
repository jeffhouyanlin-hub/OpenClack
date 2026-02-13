import React, { useState } from 'react';
import './ErrorScreen.css';
import { LogEntry } from './InstallationScreen';

export interface ErrorDetails {
  message: string;
  stack?: string;
  code?: string;
}

export interface ErrorScreenProps {
  error: ErrorDetails;
  logs: LogEntry[];
  onRetry: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  logs,
  onRetry,
}) => {
  const [showStackTrace, setShowStackTrace] = useState(false);
  const [showFullLogs, setShowFullLogs] = useState(false);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getLogClassName = (level: LogEntry['level']): string => {
    return `log-entry log-entry--${level}`;
  };

  return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon" aria-label="Error">
          ✕
        </div>
        <h1 className="error-title">Installation Failed</h1>
        <p className="error-message">{error.message}</p>

        {error.code && (
          <div className="error-code">
            Error Code: <span>{error.code}</span>
          </div>
        )}

        {error.stack && (
          <div className="error-details">
            <button
              className="btn-toggle"
              onClick={() => setShowStackTrace(!showStackTrace)}
              aria-expanded={showStackTrace}
              aria-controls="stack-trace"
            >
              {showStackTrace ? '▼' : '▶'} Stack Trace
            </button>
            {showStackTrace && (
              <pre
                id="stack-trace"
                className="stack-trace"
                role="region"
                aria-label="Error stack trace"
              >
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="error-logs">
          <button
            className="btn-toggle"
            onClick={() => setShowFullLogs(!showFullLogs)}
            aria-expanded={showFullLogs}
            aria-controls="full-logs"
          >
            {showFullLogs ? '▼' : '▶'} View Full Logs ({logs.length} entries)
          </button>
          {showFullLogs && (
            <div
              id="full-logs"
              className="logs-container"
              role="log"
              aria-label="Full installation log output"
            >
              {logs.length === 0 ? (
                <div className="log-entry log-entry--info">
                  <span className="log-message">No logs available</span>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={getLogClassName(log.level)}>
                    <span className="log-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="error-actions">
          <button
            className="btn-primary"
            onClick={onRetry}
            aria-label="Retry installation"
          >
            Retry Installation
          </button>
        </div>
      </div>
    </div>
  );
};
