import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    center: true,
    title: 'OpenClack',
    backgroundColor: '#1a1a1a',
    show: false, // Don't show until ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Window lifecycle event handlers
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    // Window minimized - could save state or pause operations
  });

  mainWindow.on('maximize', () => {
    // Window maximized
  });

  mainWindow.on('unmaximize', () => {
    // Window restored from maximized state
  });

  mainWindow.on('restore', () => {
    // Window restored from minimized state
  });

  mainWindow.on('focus', () => {
    // Window gained focus
  });

  mainWindow.on('blur', () => {
    // Window lost focus
  });
}

// App lifecycle event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app before-quit event
app.on('before-quit', () => {
  // Cleanup before quitting
});

// Export for testing
export { createWindow, mainWindow };
