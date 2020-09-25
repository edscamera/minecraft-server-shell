// Imports
const fs = require("fs");
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
    document.querySelector('#Servers-DisplayText').innerText = 'Retrieving Local Servers...';
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
};
retrieveLocalServers();
const newServer = () => {
    showTab('NewServer');
    document.querySelector('#NewServer-DisplayText').style.display = 'block';
    document.querySelector('#NewServer-FetchVersion').style.display = 'none';
    window.fetch("https://papermc.io/api/v1/paper").then(response => response.json()).then(data => {
        data.versions.forEach(version => {
            let elm = document.createElement('OPTION');
            elm.innerText = version;
            document.querySelector('#NewServer-VersionSelect').appendChild(elm);
        });
        document.querySelector('#NewServer-VersionSelect').onchange = () => {
            removeChildren(document.querySelector('#NewServer-BuildSelect'));
            document.querySelector('#NewServer-DisplayText').style.display = 'block';
            document.querySelector('#NewServer-FetchVersion').style.display = 'none';
            window.fetch(`https://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}`).then(response => response.json()).then(data => {
                data.builds.all.forEach(build => {
                    let elm = document.createElement('OPTION');
                    elm.innerText = build === data.builds.latest ? `${build} (Latest)` : build;
                    document.querySelector('#NewServer-BuildSelect').appendChild(elm);
                });
                document.querySelector('#NewServer-DisplayText').style.display = 'none';
                document.querySelector('#NewServer-FetchVersion').style.display = 'block';
            });
        };
        document.querySelector('#NewServer-VersionSelect').onchange();
        document.querySelector('#NewServer-DisplayText').style.display = 'none';
        document.querySelector('#NewServer-FetchVersion').style.display = 'block';
    });
    document.querySelector('#NewServer-JarDownload').onclick = () => {
        let serverName = document.querySelector('#NewServer-ServerName').value.replace(/\/||\\||\||\|||./g, '')
        fs.mkdir(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}`, err => {
            if (err === null) {
                try {
                    let file = fs.createWriteStream(`${process.env.LOCALAPPDATA}\\MinecraftServerShell\\Servers\\${serverName}\\server.jar`);
                    let request = http.get(`http://papermc.io/api/v1/paper/${document.querySelector('#NewServer-VersionSelect').value}/${document.querySelector('#NewServer-BuildSelect').value.split(' ')[0]}/download`, response => {
                        response.pipe(file);
                    });
                } catch (error) {
                    alert(`An error occurred downloading the server jar.\n\n${error}`)
                }
            } else {
                alert(`An error occurred creating the folder.\n\n${error}`);
            }
        });
    };
};