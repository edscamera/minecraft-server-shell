cls
rm -r ./build/
npx electron-packager ./ --out=./build/ --platform=win32 --asar --icon=./src/img/icon.ico
npx electron-packager ./ --out=./build/ --platform=linux --asar --icon=./src/img/icon.ico --arch=x64
node build-installer.js