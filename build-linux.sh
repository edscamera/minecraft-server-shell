rm -r ./build/
mkdir ./build/
electron-packager ./ --out=./build/ --platform=linux --asar --icon=./src/img/icon.ico --arch=x64 --executableName=minecraftservershell
electron-installer-debian --src "build/Minecraft Server Shell-linux-x64" --dest build/ --arch amd64