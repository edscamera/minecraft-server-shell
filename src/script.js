// Imports
const fs = require('fs');
const electron = require('electron');
const { Terminal } = require('xterm');
const ipc = require('electron').ipcRenderer;
const http = require("follow-redirects").http;
const sharp = require('sharp');
const { exec } = require('child_process');

let term = null;
// Navbar Setup
for (let c of document.querySelector('#Navbar').querySelector('ul').children) {
    c.onclick = () => {
        if (c.classList.contains('Selected')) return;
        for (let c of document.querySelector('#Navbar').querySelector('ul').children) c.classList.remove('Selected');
        c.classList.toggle('Selected');
        showTab(c.innerText);
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
showTab('Servers');
window.server = null;
const getDirectories = source => fs.readdirSync(source, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
const retrieveLocalServers = () => {
    showLoad('Locating Servers')
    removeChildren(document.querySelector('#Servers-List'));
    if (!fs.existsSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\`)) {
        fs.mkdirSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\`);
    }
    if (!fs.existsSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\`)) {
        fs.mkdirSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\`);
    }
    let serverNames = getDirectories(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\`);
    document.querySelector('#Servers-DisplayText').innerText = `${serverNames.length} server${serverNames.length !== 1 ? 's' : ''} found!`;
    serverNames.forEach(s => {
        let el = document.createElement('DIV');
        if (s === window.server) el.classList.add('SelectedServer');
        el.onclick = () => {
            window.server = s;
            for(let c of document.querySelector('#Servers-List').children) c.classList.remove('SelectedServer');
            el.classList.add('SelectedServer');
        };
        let el2 = document.createElement('SPAN');
        el2.innerText = s;
        let IMG = document.createElement('IMG');
        if (fs.existsSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${s}\\server-icon.png`)) {
            IMG.src = `${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${s}\\server-icon.png`;
        }
        IMG.style.float = 'left';
        IMG.style.paddingRight = '15px';
        
        el.append(IMG, el2);
        document.querySelector('#Servers-List').appendChild(el);

        IMG.style.height = '50px';
        IMG.style.width = '50px';
    });
    showLoad();
};
retrieveLocalServers();
const serverFolder = () => {
    const expl = exec(`start "" "${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\"`)
};
document.querySelector('#Servers-GotoConsole').onclick = () => {
    if (window.server === null) { alert('PIck a server!'); }
    else {
        showTab("Console");
        runTab("Console");
    }
};
const newServer = () => {
    showTab('NewServer');
    showLoad('Fetching Data');
    let timeout = window.setTimeout(() => {
        alert('Timed out!');
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
        fs.mkdir(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}`, err => {
            if (err === null) {
                try {
                    let file = fs.createWriteStream(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\server.jar`);
                    let request = http.get(`http://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}/${document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]}/download`, response => {
                        response.pipe(file);
                    });
                    console.log(`http://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}/${document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]}/download`);
                    showLoad('Accepting EULA');
                    try {
                        fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\eula.txt`, 'eula=true');
                        showLoad('Creating Start Task');
                        try {
                            fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\start.bat`, 'java -Xms512M -Xmx2G -jar server.jar nogui');
                            showLoad('Copying Icon');
                            try {
                                if (document.querySelector('#NewServer-Icon').files.length > 0) {
                                    fs.copyFileSync(document.querySelector('#NewServer-Icon').files[0].path, `${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\server-icon-original.png`);
                                }
                                sharp(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\server-icon-original.png`).resize(64, 64).toFile(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\server-icon.png`);
                                showLoad('Saving Data');
                                try {
                                    fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\minecraftservershell.json`, JSON.stringify({
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
                                    alert(`An unknown error occured creating the json data.\n\n${err5}`);
                                    showLoad();
                                    showTab('Servers');
                                }
                            } catch (err4) {
                                alert(`An uknown error occured copying the icon.\n\n${err4}`);
                                showLoad();
                                showTab('Servers');
                            }
                        } catch (err3) {
                            alert(`An unknown error occured creating the start server task.\n\n${err3}`);
                            showLoad();
                            showTab('Servers');
                        }
                    } catch (err2) {
                        alert(`An unknown error occured accepting the EULA.\n\n${err2}`);
                        showLoad();
                        showTab('Servers');
                    }
                } catch (err1) {
                    alert(`An unknown error occurred downloading the server jar.\n\n${err1}`);
                    showLoad();
                    showTab('Servers');
                }
            } else {
                if (document.querySelector('#NewServer-ServerName').value === '') {
                    alert('Server name cannot be empty!');
                } else {
                    alert(`An unknown error occurred creating the folder.\n\n${err}`);
                    showLoad();
                    showTab('Servers');
                }
            }
        });
    };
};
const runTab = tab => {
    switch(tab) {
        case 'Servers':
            retrieveLocalServers();
            break;
        case 'Console':
            if (document.querySelector('.terminal') !== null) return;
            
            term = new Terminal({
                cursorBlink: true,
                onTitleChange: event => {
                    console.log(event);
                }
            });
            term.open(document.querySelector('#Console-Terminal'));
            ipc.send('terminal.toTerminal', 'cls\r');
            term.onData(e => {
                ipc.send('terminal.toTerminal', e);
            });
            ipc.on('terminal.incomingData', (event, data) => {
                if (!term.disabled) term.write(data);
            });
            term.clear();
            ipc.send('terminal.toTerminal', `cd ${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${window.server}\\\r`);
            ipc.send('terminal.toTerminal', 'cls\r');
            break;
    }
};
const startServer = () => ipc.send('terminal.toTerminal', './start.bat\r');
const stopServer = () => ipc.send('terminal.toTerminal', 'stop\r');

ipc.on('returnPTY', (event, data) => console.log(data));