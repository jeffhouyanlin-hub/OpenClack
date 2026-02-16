/**
 * WelcomeScreen - feat-060: Keyboard shortcuts, feat-061: Accessibility
 */
import { useEffect, useCallback } from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onInstall: () => void;
  isInstalling: boolean;
  onSettings?: () => void;
}

export function WelcomeScreen({ onInstall, isInstalling, onSettings }: WelcomeScreenProps) {
  // feat-060: Handle Enter key to start installation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isInstalling) {
        onInstall();
      }
    },
    [onInstall, isInstalling]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="welcome-screen" role="main" aria-label="Welcome screen">
      <div className="welcome-content">
        <div className="logo-container">
          <div className="logo" aria-hidden="true">
            <div className="logo-icon">OC</div>
          </div>
        </div>

        <h1 className="app-title">OpenClack</h1>
        <p className="app-tagline">Silent installer for OpenClaw</p>

        <p className="app-description">
          The easiest way to install OpenClaw on your system.
          Just click install and we'll handle the rest.
        </p>

        <button
          className="install-button primary"
          onClick={onInstall}
          disabled={isInstalling}
          aria-label={isInstalling ? 'Installation in progress' : 'Install OpenClaw'}
        >
          {isInstalling ? 'Installing...' : 'Install OpenClaw'}
        </button>

        {onSettings && (
          <button
            className="settings-button secondary"
            onClick={onSettings}
            disabled={isInstalling}
            aria-label="Configure API Keys"
          >
            Configure API Keys
          </button>
        )}
      </div>
    </div>
  );
}
