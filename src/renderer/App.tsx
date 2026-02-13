import React, { useState } from 'react';

function App() {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = () => {
    setIsInstalling(true);
    // Placeholder - will be implemented
  };

  return (
    <div className="app">
      <header className="header">
        <h1>OpenClack</h1>
        <p>Silent installer for OpenClaw</p>
      </header>
      <main className="main">
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="install-button"
        >
          {isInstalling ? 'Installing...' : 'Install OpenClaw'}
        </button>
      </main>
    </div>
  );
}

export default App;
