import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onInstall: () => void;
  isInstalling: boolean;
  onSettings?: () => void;
}

export function WelcomeScreen({ onInstall, isInstalling, onSettings }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="logo-container">
          <div className="logo">
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
        >
          {isInstalling ? 'Installing...' : 'Install OpenClaw'}
        </button>

        {onSettings && (
          <button
            className="settings-button secondary"
            onClick={onSettings}
            disabled={isInstalling}
          >
            Configure API Keys
          </button>
        )}
      </div>
    </div>
  );
}
