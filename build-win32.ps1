rm -r ./build/
mkdir ./build/
electron-packager ./ --out=./build/ --platform=win32 --asar --icon=./src/img/icon.ico
node -e "
const electronInstaller = require('electron-winstaller');
const path = require('path');
(async () => {
    console.log('Building installer for platform win32 x64');
    await electronInstaller.createWindowsInstaller({
        appDirectory: path.join(process.cwd(), './build/MinecraftServerShell-win32-x64/'),
        outputDirectory: path.join(process.cwd(), './build/'),
        authors: 'edwardscamera',
        exe: 'MinecraftServerShell.exe',
        iconUrl: path.join(process.cwd(), './src/img/icon.ico'),
    });
    console.log('Installer build succeeded');
})();
"
signtool sign ./build/MinecraftServerShellSetup.exe