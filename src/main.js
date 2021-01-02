const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
let mainWindow;

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        autoHideMenuBar: true,
    });
    const startURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startURL);
    mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.on('ready', () => {
    installExtension(REACT_DEVELOPER_TOOLS).then((name) => {
        console.log(`Loaded Extension:  ${name}`);
    }).catch((err) => {
        console.log('An error occurred installing the React Developer Tools: ', err);
    });
    createWindow();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});