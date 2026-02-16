/**
 * LoadingSpinner - feat-058: Loading spinner during initial checks
 * Shows a spinner animation while initial system checks are running
 */
import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
}) => {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 72,
  };

  const dimension = sizeMap[size];

  return (
    <div
      className="loading-spinner-container"
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <svg
        className={`loading-spinner loading-spinner--${size}`}
        width={dimension}
        height={dimension}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle
          className="loading-spinner-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="4"
        />
        <circle
          className="loading-spinner-indicator"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#667eea"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 25 25;360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      {message && (
        <p className="loading-spinner-message">{message}</p>
      )}
    </div>
  );
};
