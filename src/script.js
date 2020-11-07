// Imports
const fs = require('fs');

const electron = require('electron');
const ipc = require('electron').ipcRenderer;

const { Terminal } = require('xterm');
const { FitAddon } = require('xterm-addon-fit');
const { exec } = require('child_process');

const http = require("follow-redirects").http;
const resizeImg = require('resize-img');

let term = null;
let fitAddon = null;
// Navbar Setup
for (let c of document.querySelector('#Navbar').querySelector('ul').children) {
    c.onclick = () => {
        if (c.classList.contains('Selected')) return;
        for (let c of document.querySelector('#Navbar').querySelector('ul').children) c.classList.remove('Selected');
        c.classList.toggle('Selected');
        showTab(c.innerText.replace(/Game /g, ''));
        runTab(c.innerText);
    }
}
// Function Declaration
const removeChildren = parent => { while (parent.firstChild) parent.removeChild(parent.firstChild); }
const showLoad = text => {
    document.querySelector('#Loading').style.display = 'block';
    document.querySelector('#Loading-Text').innerText = text;
    if (text === undefined) document.querySelector('#Loading').style.display = 'none';
};
const showTab = tab => {
    document.querySelector('#Navbar').style.display = tab === "Servers" || tab === "NewServer" ? 'none' : 'block';
    document.querySelector('#Content').style.marginLeft = document.querySelector('#Navbar').offsetWidth + 'px';
    for (let t of document.querySelector('#Content').children) {
        t.style.display = 'none';
        if (t.id === tab) t.style.display = 'block';
    }
}
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
document.querySelector('#BackServerList').onclick = () => {
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
    }else{
        showTab('Servers');
        retrieveLocalServers();
        ipc.send('terminal.kill');
    }
};
const infoBox = msg => electron.remote.dialog.showMessageBox({type: 'info', title: 'Minecraft Server Shell', message: msg});
const errBox = msg => electron.remote.dialog.showMessageBox({type: 'error', title: 'Minecraft Server Shell', message: msg});
const warnBox = msg => electron.remote.dialog.showMessageBox({type: 'warning', title: 'Minecraft Server Shell', message: msg});
const confirmBox = msg => electron.remote.dialog.showMessageBox({type: 'question', title: 'Minecraft Server Shell', buttons: ["Yes", "Cancel"], message: msg});
const getDirectories = source => fs.readdirSync(source, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

// Rest
showTab('Servers');
ipc.send('terminal.kill');
let SERVER_NAME = null;
let SERVER_RAW_PATH = `${process.env.LOCALAPPDATA}\\MinecraftServerShell\\`;
let SERVER_PATH = null;
let SERVER_ONLINE = false;
// Update Server List
const retrieveLocalServers = () => {
    showLoad('Locating Servers')
    removeChildren(document.querySelector('#Servers-List'));
    if (!fs.existsSync(SERVER_RAW_PATH)) fs.mkdirSync(SERVER_RAW_PATH);
    if (!fs.existsSync(`${SERVER_RAW_PATH}Servers\\`)) fs.mkdirSync(`${SERVER_RAW_PATH}Servers\\`);
    let serverNames = getDirectories(`${SERVER_RAW_PATH}Servers\\`);
    document.querySelector('#Servers-DisplayText').innerText = `${serverNames.length} server${serverNames.length !== 1 ? 's' : ''} found!`;
    serverNames.forEach(s => {
        let el = document.createElement('DIV');
        if (s === SERVER_NAME) el.classList.add('SelectedServer');
        el.onclick = () => {
            SERVER_NAME = s;
            SERVER_PATH = SERVER_RAW_PATH + 'Servers\\' + SERVER_NAME + '\\';

            ipc.send('terminal.create', [
                `cd ${SERVER_PATH}`,
                `cls`
            ]);

            if (fs.existsSync(`${SERVER_PATH}logs\\latest.log`)) fs.unlinkSync(`${SERVER_PATH}logs\\latest.log`);

            window.clearInterval(SERVER_ONLINE);
            SERVER_ONLINE = window.setInterval(() => {
                if (fs.existsSync(`${SERVER_PATH}logs\\latest.log`)) {
                    fs.readFile(`${SERVER_PATH}logs\\latest.log`, 'utf8', (err, data) => {
                        if (data.split('\n')[data.split('\n').length - 2] === undefined || data.split('\n')[data.split('\n').length - 2].includes('[Server thread/INFO]: Closing Server')) {
                            SERVER_ONLINE = false;
                            fs.unlinkSync(`${SERVER_PATH}logs\\latest.log`);
                        }else{
                            SERVER_ONLINE = true;
                        }
                    });
                }else{
                    SERVER_ONLINE = false;
                }
            }, 5000);
            for(let c of document.querySelector('#Servers-List').children) {
                c.classList.remove('SelectedServer');
                c.querySelector('.ACCEPT').style.display = 'none';
            }
            el.classList.add('SelectedServer');
            el.querySelector('.ACCEPT').style.display = 'block';
        };

        let el2 = document.createElement('SPAN');
        el2.innerText = s;

        let IMG = document.createElement('IMG');
        if (fs.existsSync(`${SERVER_RAW_PATH}Servers\\${s}\\server-icon.png`)) IMG.src = `${SERVER_RAW_PATH}Servers\\${s}\\server-icon.png`;
        IMG.style.float = 'left';
        IMG.style.paddingRight = '15px';
        
        let ACCEPT = document.createElement('SPAN');
        ACCEPT.classList.add('ACCEPT');
        ACCEPT.innerText = '▶';
        ACCEPT.onclick = () => {
            if (SERVER_NAME === null) { warnBox('Pick a server!'); }
            else {
                showTab("Console");
                runTab("Console");
            }
        };

        el.append(IMG, el2, ACCEPT);
        document.querySelector('#Servers-List').appendChild(el);

        IMG.style.height = '50px';
        IMG.style.width = '50px';
    });
    showLoad();
};
retrieveLocalServers();
// Update Backups Tab
const refreshBackups = () => {
    showLoad("Loading Server Data")
    let files = fs.readdirSync(SERVER_PATH, { withFileTypes: true }).filter(dirent => !['backups', 'minecraftservershell.json'].includes(dirent.name));
    let backupList = document.querySelector('#Backups-BackupList');
    let autoCheck = [
        "world",
        "world_nether",
        "world_the_end",
        "server.properties"
    ]
    files.forEach(file => {
        let container = document.createElement('DIV');

        let label = document.createElement('SPAN');
        label.innerText = file.name;

        let icon = document.createElement('SPAN');
        icon.innerText = file.isDirectory() ? '📁' : '📄';
        icon.style.paddingLeft = '5px';
        icon.style.paddingRight = '5px';

        let checkBox = document.createElement('INPUT');
        checkBox.type = 'checkbox';
        checkBox.checked = autoCheck.includes(file.name);
        
        container.append(checkBox, icon, label);
        backupList.appendChild(container);
    });
    showLoad();
};
const serverFolder = () => exec(`start "" "${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\"`);
const newServer = () => {
    showTab('NewServer');
    showLoad('Fetching Data');
    let timeout = window.setTimeout(() => {
        errBox('Timed out!');
        showLoad();
        showTab('Servers');
    }, 10000);
    window.fetch("https://papermc.io/api/v1/paper").then(response => response.json()).then(data => {
        window.clearTimeout(timeout);
        data.versions.forEach(version => {
            let elm = document.createElement('OPTION');
            elm.innerText = version;
            document.querySelector('#NewServer-VersionSelect').appendChild(elm);
        });
        document.querySelector('#NewServer-VersionSelect').onchange = () => {
            removeChildren(document.querySelector('#NewServer-BuildSelect'));
            window.fetch(`https://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}`).then(response => response.json()).then(data => {
                data.builds.all.forEach(build => {
                    let elm = document.createElement('OPTION');
                    elm.innerText = build === data.builds.latest ? `${build} (Latest)` : build;
                    document.querySelector('#NewServer-BuildSelect').appendChild(elm);
                });
                showLoad();
            });
        };
        document.querySelector('#NewServer-VersionSelect').onchange();
    });
    document.querySelector('#NewServer-EULA').onchange = () => document.querySelector('#NewServer-JarDownload').disabled = !document.querySelector('#NewServer-JarDownload').disabled;
    document.querySelector('#NewServer-JarDownload').onclick = () => {
        if (!document.querySelector('#NewServer-EULA').checked) return;
        showLoad('Downloading JAR');
        let serverName = document.querySelector('#NewServer-ServerName').value.replace(/\/||\\||\||\|||./g, '');
        let newServerPath = SERVER_RAW_PATH + 'Servers\\' + serverName + '\\';
        fs.mkdir(newServerPath, err => {
            if (err === null) {
                try {
                    let file = fs.createWriteStream(`${newServerPath}server.jar`);
                    let request = http.get(`http://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}/${document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]}/download`, response => {
                        response.pipe(file);
                    });
                    console.log(`http://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}/${document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]}/download`);
                    showLoad('Accepting EULA');
                    try {
                        fs.writeFileSync(`${newServerPath}eula.txt`, 'eula=true');
                        showLoad('Creating Start Task');
                        try {
                            fs.writeFileSync(`${newServerPath}start.bat`, 'java -Xms512M -Xmx2G -jar server.jar nogui');
                            showLoad('Copying Icon');
                            try {
                                if (document.querySelector('#NewServer-Icon').files.length > 0) {
                                    fs.copyFileSync(document.querySelector('#NewServer-Icon').files[0].path, `${newServerPath}server-icon-original.png`);
                                }
                                (async () => {
                                    const image = await resizeImg(fs.readFileSync(`${newServerPath}server-icon-original.png`), {
                                        width: 64,
                                        height: 64
                                    });
                                 
                                    fs.writeFileSync(`${newServerPath}server-icon.png`, image);
                                    showLoad('Saving Data');
                                    try {
                                        fs.writeFileSync(`${newServerPath}minecraftservershell.json`, JSON.stringify({
                                            server: {
                                                version: document.querySelector('#NewServer-VersionSelect').value,
                                                build: document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]
                                            },
                                            memory: '2G'
                                        }));
                                        showLoad();
                                        showTab('Servers');
                                        retrieveLocalServers();
                                    } catch (err5) {
                                        errBox(`An unknown error occured creating the json data.\n\n${err5}`);
                                        showLoad();
                                        showTab('Servers');
                                    }
                                })();
                            } catch (err4) {
                                errBox(`An uknown error occured copying the icon.\n\n${err4}`);
                                showLoad();
                                showTab('Servers');
                            }
                        } catch (err3) {
                            errBox(`An unknown error occured creating the start server task.\n\n${err3}`);
                            showLoad();
                            showTab('Servers');
                        }
                    } catch (err2) {
                        errBox(`An unknown error occured accepting the EULA.\n\n${err2}`);
                        showLoad();
                        showTab('Servers');
                    }
                } catch (err1) {
                    errBox(`An unknown error occurred downloading the server jar.\n\n${err1}`);
                    showLoad();
                    showTab('Servers');
                }
            } else {
                if (document.querySelector('#NewServer-ServerName').value === '') {
                    warnBox('Server name cannot be empty!');
                } else {
                    errBox(`An unknown error occurred creating the folder.\n\n${err}`);
                    showLoad();
                    showTab('Servers');
                }
            }
        });
    };
};
const loadServerProperties = () => {
    showLoad('Fetching Options');
    if (!fs.existsSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\server.properties`)) {
        warnBox('You must run the server once before you change settings!');
        showLoad();
        showTab('Console');
        for(let c of document.querySelector('#Navbar').querySelector('ul').children) c.classList.remove('Selected');
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
        try {
            fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\server.properties`, document.querySelector('#Options-Textbox').value);
            t = true;
        }
        catch(e) {
            errBox('There was an error saving the options.\n\n'+e);
            t = false;
        }
        if (t) {
            if (SERVER_ONLINE) {
                infoBox('Options saved! Restarting server...');
                ipc.send('terminal.toTerminal', 'reload confirm\r');
            }
            else { infoBox('Options saved!'); }
        }
        showLoad();

    }
};
const runTab = tab => {
    switch(tab) {
        case 'Servers':
            retrieveLocalServers();
            break;
        case 'Console':
            if (document.querySelector('.terminal') !== null) return;
            
            term = new Terminal({ cursorBlink: true });
            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(document.querySelector('#Console-Terminal'));

            window.addEventListener('resize', () => fitAddon.fit());
            fitAddon.fit();            
            
            term.inJar = false;
            document.querySelector('#Console-Start').disabled = term.inJar;
            document.querySelector('#Console-Stop').disabled = !term.inJar;
            term.chars = '';
            term.lastCMD = null;
            ipc.send('terminal.toTerminal', 'cls\r');
            term.onData(e => {
                ipc.send('terminal.toTerminal', e);
                if (e === '\r') {
                    term.lastCMD = term.chars;
                    term.chars = '';
                }else{
                    term.chars += e;
                }
                if (term.lastCMD === './start.bat' || term.lastCMD === './start') term.inJar = true;
                if (term.lastCMD === 'stop') term.inJar = false;
                document.querySelector('#Console-Start').disabled = term.inJar;
                document.querySelector('#Console-Stop').disabled = !term.inJar;
            });
            ipc.on('terminal.incomingData', (event, data) => {
                if (!term.disabled) term.write(data);
                term.inJar = data.includes(']: ');
            });
            ipc.send('terminal.toTerminal', `cd ${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${SERVER_NAME}\\\r`);
            ipc.send('terminal.toTerminal', 'cls\r');
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
