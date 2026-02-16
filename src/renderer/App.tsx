import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { InstallationScreen, LogEntry } from './components/InstallationScreen';
import { SuccessScreen, InstallationSummary } from './components/SuccessScreen';
import { ErrorScreen, ErrorDetails } from './components/ErrorScreen';

// Application state enum
export enum AppScreen {
  WELCOME = 'welcome',
  SETTINGS = 'settings',
  INSTALLING = 'installing',
  SUCCESS = 'success',
  ERROR = 'error',
}

// API Keys interface
interface APIKeys {
  anthropic: string;
  openai: string;
  gemini: string;
}

// Application state
interface AppState {
  currentScreen: AppScreen;
  apiKeys: Partial<APIKeys>;
  installProgress: number;
  currentStep: string;
  logs: LogEntry[];
  error: ErrorDetails | null;
  installationSummary: InstallationSummary | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentScreen: AppScreen.WELCOME,
    apiKeys: {},
    installProgress: 0,
    currentStep: '',
    logs: [],
    error: null,
    installationSummary: null,
  });

  // Navigation functions
  const goToSettings = () => {
    setState((prev) => ({
      ...prev,
      currentScreen: AppScreen.SETTINGS,
    }));
  };

  const goToWelcome = () => {
    setState((prev) => ({
      ...prev,
      currentScreen: AppScreen.WELCOME,
    }));
  };

  const startInstall = () => {
    // Reset state for new installation
    setState((prev) => ({
      ...prev,
      currentScreen: AppScreen.INSTALLING,
      installProgress: 0,
      currentStep: 'Initializing...',
      logs: [],
      error: null,
    }));

    // Placeholder - actual installation logic will be implemented in future features
    // For now, just simulate transition to success
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        currentScreen: AppScreen.SUCCESS,
        installationSummary: {
          nodeVersion: '22.12.0',
          openclawVersion: '1.0.0',
          configuredApis: Object.keys(prev.apiKeys).filter(
            (key) => prev.apiKeys[key as keyof APIKeys]
          ),
        },
      }));
    }, 2000);
  };

  // feat-065: Installation cancellation
  const cancelInstall = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.cancelInstall();
    }
    setState((prev) => ({
      ...prev,
      currentScreen: AppScreen.WELCOME,
      installProgress: 0,
      currentStep: '',
      logs: [],
    }));
  };

  const handleRetry = () => {
    // Reset error and restart installation
    setState((prev) => ({
      ...prev,
      error: null,
    }));
    startInstall();
  };

  const handleSaveSettings = (keys: Partial<APIKeys>) => {
    setState((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, ...keys },
      currentScreen: AppScreen.WELCOME,
    }));
  };

  const handleLaunch = () => {
    // Placeholder - will be implemented in feat-026
    console.log('Launch OpenClaw');
  };

  const handleClose = () => {
    // Close the application
    window.close();
  };

  // Render appropriate screen based on current state
  const renderScreen = () => {
    switch (state.currentScreen) {
      case AppScreen.WELCOME:
        return (
          <WelcomeScreen
            onInstall={startInstall}
            isInstalling={false}
            onSettings={goToSettings}
          />
        );

      case AppScreen.SETTINGS:
        return (
          <SettingsScreen
            onSave={handleSaveSettings}
            onBack={goToWelcome}
            initialKeys={state.apiKeys}
          />
        );

      case AppScreen.INSTALLING:
        return (
          <InstallationScreen
            progress={state.installProgress}
            currentStep={state.currentStep}
            logs={state.logs}
            onCancel={cancelInstall}
          />
        );

      case AppScreen.SUCCESS:
        return (
          <SuccessScreen
            summary={state.installationSummary || {}}
            onLaunch={handleLaunch}
            onClose={handleClose}
          />
        );

      case AppScreen.ERROR:
        return (
          <ErrorScreen
            error={state.error || { message: 'Unknown error' }}
            logs={state.logs}
            onRetry={handleRetry}
          />
        );

      default:
        return (
          <WelcomeScreen
            onInstall={startInstall}
            isInstalling={false}
          />
        );
    }
  };

  return <div className="app">{renderScreen()}</div>;
}

export default App;
