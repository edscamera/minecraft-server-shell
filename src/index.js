const { app, BrowserWindow, ipcMain, ipcRenderer, dialog } = require('electron');
const path = require('path');
const os = require('os');
const pty = require('node-pty');
const fs = require('fs');
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow = null;
let ptyProcess = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    icon: `${__dirname}/../icon.png`
  });

  // and load the index.html of the app.
  mainWindow.loadFile(`${__dirname}/index.html`);
  mainWindow.on('close', event => {
    event.preventDefault();
    dialog.showMessageBox({
      type: 'question',
      title: 'Minecraft Server Shell',
      buttons: ["Yes", "No"],
      message: "Are you sure you want to quit? This will close the server."
    }).then(data => {
      if (data.response === 0) {
        mainWindow.destroy();
      }
    });
  })
  ipcMain.on('terminal.create', (event, data) => {
    if (ptyProcess === null) {
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 73,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
      });
      ptyProcess.on('data', data => mainWindow.webContents.send('terminal.incomingData', data));
      
      data.forEach(cmd => ptyProcess.write(`${cmd}\r`));
    }
  });
  ipcMain.on('terminal.toTerminal', (event, data) => {
    if (ptyProcess !== null) ptyProcess.write(data);
  });
  ipcMain.on('terminal.kill', (event, data) => {
    if (ptyProcess !== null) ptyProcess.kill();
    ptyProcess = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.