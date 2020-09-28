// Imports
const fs = require("fs");
const electron = require("electron");
const { loadavg } = require("os");
const http = require("follow-redirects").http;
// Navbar Setup
for (let c of document.querySelector('#Navbar').querySelector('ul').children) {
    c.onclick = () => {
        for (let c of document.querySelector('#Navbar').querySelector('ul').children) c.classList.remove('Selected');
        c.classList.toggle('Selected');
        showTab(c.innerText);
        retrieveLocalServers();
    }
}
// Content Setup
document.querySelector('#Content').style.marginLeft = document.querySelector('#Navbar').offsetWidth + 'px';
// Function Declaration
const removeChildren = parent => { while (parent.firstChild) parent.removeChild(parent.firstChild); }
const showLoad = text => {
    document.querySelector('#Loading').style.display = 'block';
    document.querySelector('#Loading-Text').innerText = text;
    if (text === undefined) document.querySelector('#Loading').style.display = 'none';
};
const showTab = tab => {
    for (let t of document.querySelector('#Content').children) {
        t.style.display = 'none';
        if (t.id === tab) t.style.display = 'block';
    }
}
showTab('Servers');
const getDirectories = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
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
        el.innerText = s;
        document.querySelector('#Servers-List').appendChild(el);
    });
    showLoad();
};
retrieveLocalServers();
const newServer = () => {
    showTab('NewServer');
    showLoad('Fetching Data');
    window.fetch("https://papermc.io/api/v1/paper").then(response => response.json()).then(data => {
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
                    showLoad('Accepting EULA');
                    try {
                        fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\eula.txt`, 'eula=true');
                        showLoad('Creating Start Task');
                        try {
                            fs.writeFileSync(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\start.bat`, 'java -jar server.jar -Xms 512M -Xmx 2G');
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
                            } catch(err4) {
                                alert(`An unknown error occured creating the json data.\n\n${err3}`);
                            }
                        }catch(err3) {
                            alert(`An unknown error occured creating the start server task.\n\n${err3}`);
                        }
                    } catch (err2) {
                        alert(`An unknown error occured accepting the EULA.\n\n${err2}`);
                    }
                } catch (err1) {
                    alert(`An unknown error occurred downloading the server jar.\n\n${err1}`);
                }
            } else {
                if (document.querySelector('#NewServer-ServerName').value === '') {
                    alert('Server name cannot be empty!');
                } else {
                    alert(`An unknown error occurred creating the folder.\n\n${err}`);
                }
            }
        });
    };
};