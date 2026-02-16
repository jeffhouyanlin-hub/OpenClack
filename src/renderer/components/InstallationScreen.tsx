import React from 'react';
import './InstallationScreen.css';

export interface LogEntry {
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface InstallationScreenProps {
  progress: number; // 0-100
  currentStep: string;
  logs: LogEntry[];
  onCancel?: () => void;
}

export const InstallationScreen: React.FC<InstallationScreenProps> = ({
  progress,
  currentStep,
  logs,
  onCancel,
}) => {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getLogClassName = (level: LogEntry['level']): string => {
    return `log-entry log-entry--${level}`;
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.cancelInstall();
    }
  };

  return (
    <div className="installation-screen" role="main" aria-label="Installation progress">
      <div className="installation-content">
        <h1 className="installation-title">Installing OpenClaw</h1>

        <div className="progress-section">
          <div className="progress-info">
            <span className="current-step">{currentStep}</span>
            <span className="progress-percentage">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Installation progress"
            />
          </div>
        </div>

        <div className="logs-section">
          <h2 className="logs-title">Installation Log</h2>
          <div
            className="logs-container"
            ref={logContainerRef}
            role="log"
            aria-live="polite"
            aria-label="Installation log output"
          >
            {logs.length === 0 ? (
              <div className="log-entry log-entry--info">
                <span className="log-timestamp">{formatTimestamp(Date.now())}</span>
                <span className="log-message">Preparing installation...</span>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={getLogClassName(log.level)}>
                  <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="installation-actions">
          <button
            className="cancel-button"
            onClick={handleCancel}
            aria-label="Cancel installation"
          >
            Cancel Installation
          </button>
        </div>
      </div>
    </div>
  );
};
