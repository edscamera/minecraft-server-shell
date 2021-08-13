const electronInstaller = require("electron-winstaller");
const path = require("path");

(async () => {
    try {
        await electronInstaller.createWindowsInstaller({
            appDirectory: path.join(process.cwd(), "./build/MinecraftServerShell-win32-x64/"),
            outputDirectory: path.join(process.cwd(), "./build/"),
            authors: "edwardscamera",
            exe: "MinecraftServerShell.exe",
            iconUrl: path.join(process.cwd(), "./src/img/icon.ico"),
        });
        console.log("Installer build succeeded");
    } catch (e) {
        console.log(e.message);
    }
})();