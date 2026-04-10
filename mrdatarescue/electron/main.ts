import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "DataRescue Web Desktop",
    backgroundColor: '#0f172a', // Slate-900
  });

  // In production, load the index.html from the dist folder
  if (process.env.NODE_ENV === 'production') {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // In development, load from the vite dev server
    win.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
