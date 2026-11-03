const { app, BrowserWindow } = require('electron');
const path = require('path');
const expressApp = require('./server/app');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'SwitchBot App',
    icon: path.join(__dirname, 'client/build', 'switchbot.ico'),
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111924', 
      symbolColor: '#fff', 
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'client', 'build', 'index.html'));
}


// Auto-update is intentionally disabled: it pointed at the original author's
// GitHub releases and would replace this customized build with the upstream one.

app.whenReady().then(() => {
  createWindow();
});

expressApp.listen(8089, () => {
  console.log('Desktop Express server running on http://localhost:8089');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

