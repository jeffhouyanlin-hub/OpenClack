import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';

function App() {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = () => {
    setIsInstalling(true);
    // Placeholder - will be implemented
  };

  return (
    <div className="app">
      <WelcomeScreen onInstall={handleInstall} isInstalling={isInstalling} />
    </div>
  );
}

export default App;
