const { Terminal } = require("xterm");
const { FitAddon } = require("xterm-addon-fit");
const pty = require("node-pty");

const updateServerList = (dir) => {
    let subdirs = fs.readdirSync(dir, { withFileTypes: true, })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    document.querySelector("#ServerSelect_Label").innerText = `${subdirs.length} Server${subdirs.length === 1 ? "" : "s"} Found`;

    let layout = new Array(subdirs.length).fill(null);
    for (let i = 0; i < layout.length; i++) layout[i] = {
        tag: "div",
        class: ["ServerSelect_Server"],
        children: [
            {
                tag: "img",
                src: fs.existsSync(path.join(DIR.SERVERS, subdirs[i], "./server-icon.png")) ? path.join(DIR.SERVERS, subdirs[i], "./server-icon.png") : "./default.png",
                style: { verticalAlign: "middle", },
                draggable: false,
            },
            {
                tag: "span",
                content: subdirs[i],
                style: {
                    marginLeft: "15px",
                    verticalAlign: "middle",
                },
            },
            {
                tag: "div",
                style: {
                    position: "absolute",
                    top: "50%",
                    right: "15px",
                    transform: "translateY(-50%)",
                },
                children: [
                    {
                        tag: "span",
                        content: "Open",
                        class: ["ServerSelect_OpenAction"],
                        onclick: () => openServer(subdirs[i]),
                    },
                    {
                        tag: "span",
                        content: "Delete",
                        class: ["ServerSelect_DeleteAction"],
                        onclick: () => deleteServer(subdirs[i]),
                    }
                ]
            }
        ],
    };

    while (document.querySelector("#ServerSelect_List").children.length > 0) document.querySelector("#ServerSelect_List").children[0].remove();
    createLayout(layout, document.querySelector("#ServerSelect_List"));
};
fs.watch(DIR.SERVERS, () => updateServerList(DIR.SERVERS));
updateServerList(DIR.SERVERS);

const openServer = (server) => {
    DIR.SERVER = path.join(DIR.SERVERS, server);
    setPanel("Terminal");

    term = new Terminal();
    while (document.querySelector("#Terminal_Terminal").children.length > 0) document.querySelector("#Terminal_Terminal").children[0].remove();
    term.open(document.querySelector("#Terminal_Terminal"));

    const shell = os.platform() === "win32" ? "cmd.exe" : "bash";
    ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: DIR.SERVER,
        env: process.env,
    });

    term.onData(data => ptyProcess.write(data));
    ptyProcess.onData(data => term.write(data));


    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    window.onresize = () => {
        fitAddon.fit();
        ptyProcess.resize(term["_core"]["cols"], term["_core"]["rows"]);
    };
    window.onresize();


};

const deleteServer = (server) => {
    dialog.showMessageBox(null, {
        type: "question",
        title: "Minecraft Server Shell",
        buttons: ["Yes", "Cancel"],
        message: `Do you really want to delete your server "${server}"? All backups and data will be gone forever. This action cannot be reversed!`,
    }).then(response => {
        if (response.response === 0) fs.rmdirSync(path.join(DIR.SERVERS, server), { recursive: true, });
    });
};

document.querySelector("#ServerSelect_CreateServer").onclick = () => setPanel("CreateServer");
document.querySelector("#ServerSelect_OpenServerFolder").onclick = () => openExternal(DIR.SERVERS);