const { app, BrowserWindow, dialog } = require('electron');
require('electron-reload')(__dirname);
const path = require('path');

let SERVER_RUNNING = false;
app.allowRendererProcessReuse = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit();

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        icon: path.join(__dirname, "./img/icon.png"),
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on("close", e => {
        e.preventDefault();
        dialog.showMessageBox(null, {
            type: "question",
            title: "Minecraft Server Shell",
            buttons: ["Yes", "Cancel"],
            message: "Do you really want to exit? A running server may be corrupted during a forced shut down.",
        }).then(response => {
            if (response.response === 0) mainWindow.destroy();
        });
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
    if (process.platform !== "darwin") app.quit();
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});