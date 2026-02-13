import React from 'react';
import './SuccessScreen.css';

export interface InstallationSummary {
  nodeVersion?: string;
  openclawVersion?: string;
  configuredApis?: string[];
}

export interface SuccessScreenProps {
  summary: InstallationSummary;
  onLaunch: () => void;
  onClose: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  summary,
  onLaunch,
  onClose,
}) => {
  return (
    <div className="success-screen">
      <div className="success-content">
        <div className="success-icon" aria-label="Success">
          ✓
        </div>
        <h1 className="success-title">Installation Complete!</h1>
        <p className="success-message">
          OpenClaw has been successfully installed and configured.
        </p>

        <div className="installation-summary">
          <h2>Installation Summary</h2>
          {summary.nodeVersion && (
            <div className="summary-item">
              <span className="summary-label">Node.js:</span>
              <span className="summary-value">{summary.nodeVersion}</span>
            </div>
          )}
          {summary.openclawVersion && (
            <div className="summary-item">
              <span className="summary-label">OpenClaw:</span>
              <span className="summary-value">{summary.openclawVersion}</span>
            </div>
          )}
          {summary.configuredApis && summary.configuredApis.length > 0 && (
            <div className="summary-item">
              <span className="summary-label">Configured APIs:</span>
              <span className="summary-value">
                {summary.configuredApis.join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="success-actions">
          <button
            className="btn-primary"
            onClick={onLaunch}
            aria-label="Launch OpenClaw"
          >
            Launch OpenClaw
          </button>
          <button
            className="btn-secondary"
            onClick={onClose}
            aria-label="Close installer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
