const { app, BrowserWindow, session } = require('electron');
const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
require('electron-reload')(`${__dirname}/../`);

let mainWindow = null;
const createWindow = () => {
    installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        icon: `${__dirname}/../icon.png`,
    });
    mainWindow.loadURL('http://localhost:3000');

};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})