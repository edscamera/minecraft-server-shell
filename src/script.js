// Imports
const fs = require('fs');

const electron = require('electron');
const ipc = require('electron').ipcRenderer;

const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit');
const { exec } = require('child_process');

const http = require("follow-redirects").http;
const resizeImg = require('resize-img');

// Variable Declaration
let SERVER_NAME = null;
let SERVER_RAW_PATH = `${process.env.LOCALAPPDATA}\\MinecraftServerShell\\`;
let SERVER_PATH = null;
let SERVER_ONLINE = false;
let SERVER_ONLINE_LOOP = null;

// Function Declaration
const removeChildren = parent => { while (parent.firstChild) parent.removeChild(parent.firstChild); }
const showLoad = text => {
    document.querySelector('#Loading').style.display = 'block';
    document.querySelector('#Loading-Text').innerText = text;
    if (!text) document.querySelector('#Loading').style.display = 'none';
};
const showTab = tab => {
    document.querySelector('#Navbar').style.display = ["Servers", "NewServer"].includes(tab) ? 'none' : 'block';
    document.querySelector('#Content').style.marginLeft = `${document.querySelector('#Navbar').offsetWidth}px`;
    for (let t of document.querySelector('#Content').children) t.style.display = (t.id === tab) ? 'block' : 'none';
}
const infoBox = msg => electron.remote.dialog.showMessageBox({ type: 'info', title: 'Minecraft Server Shell', message: msg });
const errBox = msg => electron.remote.dialog.showMessageBox({ type: 'error', title: 'Minecraft Server Shell', message: msg });
const warnBox = msg => electron.remote.dialog.showMessageBox({ type: 'warning', title: 'Minecraft Server Shell', message: msg });
const confirmBox = msg => electron.remote.dialog.showMessageBox({ type: 'question', title: 'Minecraft Server Shell', buttons: ["Yes", "Cancel"], message: msg });

// On Window Load
window.addEventListener('load', () => {

    // Create Directories
    showLoad('Creating Files');
    if (!fs.existsSync(SERVER_RAW_PATH)) fs.mkdirSync(SERVER_RAW_PATH);
    if (!fs.existsSync(`${SERVER_RAW_PATH}Servers\\`)) fs.mkdirSync(`${SERVER_RAW_PATH}Servers\\`);
    showLoad();
    // Navbar Setup
    for (let element of document.querySelector('#Navbar').querySelector('ul').children) {
        element.onclick = () => {
            if (element.classList.contains('Selected')) return;
            for (let element of document.querySelector('#Navbar').querySelector('ul').children) element.classList.remove('Selected');
            element.classList.toggle('Selected');
            showTab(element.innerText.replace(/Game /g, ''));
            runTab(element.innerText);
        }
    }
    // Navbar Back Button Setup
    document.querySelector('#Navbar-Back').onclick = () => {
        if (SERVER_ONLINE) {
            showLoad('');
            confirmBox('Are you sure you want to quit? This will close the server.').then(data => {
                if (data.response === 0) {
                    showTab('Servers');
                    retrieveLocalServers();
                    ipc.send('terminal.kill');
                }
                showLoad();
            });
        } else {
            showTab('Servers');
            retrieveLocalServers();
            ipc.send('terminal.kill');
        }
    };

    // Reset Terminal && Show Server Select Menu
    showTab('Servers');
    ipc.send('terminal.kill');

    window.setTimeout(console.clear, 1000);
});

// Console Window
document.querySelector('#Console-Start').onclick = () => {
    ipc.send('terminal.toTerminal', './start.bat\r');
    SERVER_ONLINE = true;
    document.querySelector('#Console-Start').disabled = SERVER_ONLINE;
    document.querySelector('#Console-Stop').disabled = !SERVER_ONLINE;
};
document.querySelector('#Console-Stop').onclick = () => {
    ipc.send('terminal.toTerminal', 'stop\r');
    SERVER_ONLINE = false;
    document.querySelector('#Console-Start').disabled = SERVER_ONLINE;
    document.querySelector('#Console-Stop').disabled = !SERVER_ONLINE;
};

// Update Server List
(window.retrieveLocalServers = () => {
    showLoad('Locating Servers');

    removeChildren(document.querySelector('#Servers-List'));
    let serverNames = fs.readdirSync(`${SERVER_RAW_PATH}Servers\\`, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    document.querySelector('#Servers-DisplayText').innerText = `${serverNames.length} server${serverNames.length !== 1 ? 's' : ''} found!`;

    serverNames.forEach(name => {
        let serverDiv = document.createElement('DIV');
        serverDiv.addEventListener('click', () => {
            SERVER_NAME = name;
            SERVER_PATH = `${SERVER_RAW_PATH}Servers\\${SERVER_NAME}\\`;

            // Create terminal
            ipc.send('terminal.create', [
                `cd ${SERVER_PATH}`,
                `cls`
            ]);

            // Server acticity detection
            if (fs.existsSync(`${SERVER_PATH}logs\\latest.log`)) fs.unlinkSync(`${SERVER_PATH}logs\\latest.log`);
            window.clearInterval(SERVER_ONLINE_LOOP);
            SERVER_ONLINE_LOOP = window.setInterval(() => {
                if (fs.existsSync(`${SERVER_PATH}logs\\latest.log`)) {
                    fs.readFile(`${SERVER_PATH}logs\\latest.log`, 'utf8', (err, data) => {
                        if (data.split('\n')[data.split('\n').length - 2] === undefined || data.split('\n')[data.split('\n').length - 2].includes('[Server thread/INFO]: Closing Server')) {
                            SERVER_ONLINE = false;
                            fs.unlinkSync(`${SERVER_PATH}logs\\latest.log`);
                        } else {
                            SERVER_ONLINE = true;
                        }
                    });
                } else {
                    SERVER_ONLINE = false;
                }
            }, 5000);

            // Hide confirm server buttons
            for (let c of document.querySelector('#Servers-List').children) {
                c.classList.remove('SelectedServer');
                c.querySelector('.ACCEPT').style.display = c === serverDiv ? 'block' : 'none';
            }
            serverDiv.classList.add('SelectedServer');
        });
        if (name === SERVER_NAME) serverDiv.classList.add('SelectedServer');

        let serverDivLabel = Object.assign(document.createElement('SPAN'), { innerText: name, });

        let serverDivImg = Object.assign(document.createElement('IMG'), {
            src: fs.existsSync(`${SERVER_RAW_PATH}Servers\\${name}\\server-icon.png`) ? `${SERVER_RAW_PATH}Servers\\${name}\\server-icon.png` : '',
        });
        serverDivImg.style = {
            ...serverDivImg.style,
            float: 'left',
            paddingRight: '15px',
        };

        let serverDivConfirm = Object.assign(document.createElement('SPAN'), {
            innerText: '▶',
        });
        serverDivConfirm.classList.add('ACCEPT');
        serverDivConfirm.addEventListener('click', () => {
            if (!SERVER_NAME) warnBox('Pick a server!');
            else {
                showTab("Console");
                runTab("Console");
            }
        });

        serverDiv.append(serverDivImg, serverDivLabel, serverDivConfirm);
        document.querySelector('#Servers-List').appendChild(serverDiv);

        serverDivImg.style = {
            ...serverDivImg.style,
            height: '50px',
            width: '50px',
        }
    });
    showLoad();
})();
// Update Backups Tab
const refreshBackups = () => {
    showLoad("Loading Server Data");
    let files = fs.readdirSync(SERVER_PATH, { withFileTypes: true }).filter(dirent => !['backups', 'minecraftservershell.json'].includes(dirent.name));
    let backupList = document.querySelector('#Backups-BackupList');
    let autoCheck = ["world", "world_nether", "world_the_end", "server.properties"];
    files.forEach(file => {
        let container = document.createElement('DIV');

        let label = Object.assign(document.createElement('SPAN'), { innerText: file.name });

        let icon = Object.assign(document.createElement('SPAN'), { innerText: file.isDirectory() ? '📁' : '📄' });
        Object.assign(icon.style, {
            paddingLeft: '5px',
            paddingRight: '5px',
        });

        let checkBox = Object.assign(document.createElement('INPUT'), {
            type: 'checkbox',
            checked: autoCheck.includes(file.name),
        });

        container.append(checkBox, icon, label);
        backupList.appendChild(container);
    });
    showLoad();
};
// New Server Tab
const newServer = () => {
    showTab('NewServer');
    showLoad('Fetching Data');
    let timeout = window.setTimeout(() => {
        errBox('Timed out!');
        showLoad();
        showTab('Servers');
    }, 10000);
    // Request & Organize Data
    // ##########################################################################################################################################
    window.fetch("https://papermc.io/api/v1/paper").then(response => response.json()).then(data => {
        window.clearTimeout(timeout);
        data.versions.forEach(version => {
            let elm = Object.assign(document.createElement('OPTION'), { innerText: version });
            document.querySelector('#NewServer-VersionSelect').appendChild(elm);
        });
        (document.querySelector('#NewServer-VersionSelect').onchange = () => {
            removeChildren(document.querySelector('#NewServer-BuildSelect'));
            window.fetch(`https://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}`).then(response => response.json()).then(data => {
                data.builds.all.forEach(build => {
                    let elm = Object.assign(document.createElement('OPTION'), { innerText: build === data.builds.latest ? `${build} (Latest)` : build });
                    document.querySelector('#NewServer-BuildSelect').appendChild(elm);
                });
                showLoad();
            });
        })();
    });
    document.querySelector('#NewServer-EULA').onchange = () => document.querySelector('#NewServer-JarDownload').disabled = !document.querySelector('#NewServer-JarDownload').disabled;
    document.querySelector('#NewServer-JarDownload').onclick = () => {
        if (!document.querySelector('#NewServer-EULA').checked) return;
        showLoad('Creating Folder');
        let serverName = document.querySelector('#NewServer-ServerName').value.replace(/\/||\\||\||\|||./g, '');
        let newServerPath = SERVER_RAW_PATH + 'Servers\\' + serverName + '\\';
        // Create Server Folder
        fs.mkdir(newServerPath, err => {
            const defaultFiles = [
                {
                    path: `${newServerPath}eula.txt`,
                    data: 'eula=true',
                    loadingText: 'Accepting EULA',
                    overwrite: null,
                },
                {
                    path: `${newServerPath}start.bat`,
                    data: 'java -Xms512M -Xmx2G -jar server.jar nogui',
                    loadingText: 'Creating Start Task',
                    overwrite: null,
                },
                {
                    path: `${newServerPath}minecraftservershell.json`,
                    data: JSON.stringify({
                        server: {
                            version: document.querySelector('#NewServer-VersionSelect').value,
                            build: document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]
                        },
                        memory: '2G',
                    }),
                    loadingText: 'Saving Data',
                    overwrite: null,
                },
                {
                    loadingText: 'Copying Icon',
                    overwrite: (async () => {
                        if (document.querySelector('#NewServer-Icon').files.length > 0) {
                            fs.copyFileSync(document.querySelector('#NewServer-Icon').files[0].path, `${newServerPath}server-icon-original.png`);
                            let img = await resizeImg(fs.readFileSync(`${newServerPath}server-icon-original.png`), {
                                width: 64,
                                height: 64
                            });
                            fs.writeFileSync(`${newServerPath}server-icon.png`, img);
                        }
                        retrieveLocalServers();
                    }),
                },
            ];
            if (err) {
                if (document.querySelector('#NewServer-ServerName').value === '') {
                    warnBox('Server name cannot be empty!');
                } else {
                    errBox(`An unknown error occurred creating the folder.\n\n${err}`);
                    showLoad();
                    showTab('Servers');
                }
                return;
            }
            // Get Server JAR
            showLoad('Downloading JAR');
            let file = fs.createWriteStream(`${newServerPath}server.jar`);
            file.on('open', () => {
                http.get(`http://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}/${document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]}/download`, response => {
                    response.pipe(file);
                    file.on('finish', () => file.close());
                });
            });
            file.on('close', () => {
                // Write Required Server Files
                defaultFiles.forEach(task => {
                    showLoad(task.loadingText);
                    if (task.overwrite) task.overwrite();
                    else fs.writeFileSync(task.path, task.data);
                });
                showLoad();
                retrieveLocalServers();
                showTab('Servers');
            });
        });
    };
};
const serverFolder = () => {
    exec(`start "" "${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers"`);
};
const loadServerProperties = () => {
    showLoad('Fetching Options');
    // Check if options exist
    if (!fs.existsSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\server.properties`)) {
        warnBox('You must run the server once before you change settings!');
        showLoad();
        showTab('Console');
        for (let c of document.querySelector('#Navbar').querySelector('ul').children) c.classList.remove('Selected');
        document.querySelector('#Navbar').querySelector('ul').children[0].classList.add('Selected');
        return;
    }
    showLoad();
    document.querySelector('#Options-Textbox').value = fs.readFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\server.properties`, 'utf8');
    document.querySelector('#Options-Textbox').style.height = document.querySelector('#Options-Textbox').scrollHeight - 4 + 'px';
    document.querySelector('#Options-Textbox').oninput = () => document.querySelector('#Options-Textbox').style.height = document.querySelector('#Options-Textbox').scrollHeight - 4 + 'px';
    document.querySelector('#Options-Save').onclick = () => {
        showLoad('Saving Options');
        let t = true;
        try { fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\server.properties`, document.querySelector('#Options-Textbox').value) }
        catch (e) {
            errBox('There was an error saving the options.\n\n' + e);
            t = false;
        }
        if (t) {
            if (SERVER_ONLINE) {
                infoBox('Options saved! Restarting server...');
                ipc.send('terminal.toTerminal', 'reload confirm\r');
            }
            else infoBox('Options saved!');
        }
        showLoad();
    }
};
const runTab = tab => {
    switch (tab) {
        case 'Servers':
            retrieveLocalServers();
            break;
        case 'Console':
            if (document.querySelector('.terminal')) return;

            let term = new Terminal({ cursorBlink: true });
            let fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(document.querySelector('#Console-Terminal'));

            window.addEventListener('resize', fitAddon.fit);
            fitAddon.fit();

            document.querySelector('#Console-Start').disabled = SERVER_ONLINE;
            document.querySelector('#Console-Stop').disabled = !SERVER_ONLINE;

            Object.assign(term, {
                chars: '',
                lastCMD: null,
            });

            ipc.send('terminal.toTerminal', 'cls\r');

            term.onData(e => {
                ipc.send('terminal.toTerminal', e);
                if (e === '\r') {
                    term.lastCMD = term.chars;
                    term.chars = '';
                } else term.chars += e;
                if (term.lastCMD === './start.bat' || term.lastCMD === './start') term.inJar = true;
                if (term.lastCMD === 'stop') term.inJar = false;
                document.querySelector('#Console-Start').disabled = term.inJar;
                document.querySelector('#Console-Stop').disabled = !term.inJar;
            });
            ipc.on('terminal.incomingData', (event, data) => { if (!term.disabled) term.write(data); });
            ipc.send('terminal.toTerminal', `cd ${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\\rcls\r`);
            term.clear();
            break;
        case 'Game Options':
            loadServerProperties();
            break;
        case 'Backups':
            refreshBackups();
            break;
    }
};
