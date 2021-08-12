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
                src: fs.existsSync(path.join(DIR.SERVERS, subdirs[i], "./server-icon.png")) ? path.join(DIR.SERVERS, subdirs[i], "./server-icon.png") : "./img/default.png",
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
    document.querySelector("#Navbar_HeaderText").innerText = server;
    document.querySelector("#Navbar_HeaderImg").src = fs.existsSync(path.join(DIR.SERVER, "./server-icon.png")) ? path.join(DIR.SERVER, "./server-icon.png") : "./img/default.png";
    openTerminal(server);
    openProps();
    const a = JSON.parse(fs.readFileSync(path.join(DIR.SERVER, "meta.json"), "utf-8"));
    Array.from(document.querySelector("#Navbar_TopOption").children).forEach(c => {
        c.classList.remove("Navbar_OptionActive");
        c.style.display = "block";
        if (a.core === "Vanilla") c.style.display = c.getAttribute("modOnly") == "true" ? "none" : "block";
    });
    document.querySelector("#Navbar_TopOption").children[0].classList.add("Navbar_OptionActive");
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
document.querySelector("#ServerSelect_OpenServerFolder").onclick = () => {
    switch (os.platform()) {
        case "win32":
            require("child_process").exec(`explorer" ${DIR.SERVERS}"`);
            break;
        case "linux":
            require("child_process").exec(`xdg-open "${DIR.SERVERS}"`);
            break;
        default:
            require("child_process").exec(`open "${DIR.SERVERS}"`);
            dialog.showMessageBox(null, {
                type: "info",
                title: "Minecraft Server Shell",
                buttons: ["Ok", "Open GitHub Repository"],
                message: `Your operating system is not supported! Please report details in a GitHub issue.\n\n${os.platform()}`,
            }).then(response => {
                if (response.response === 1) openExternal("https://github.com/edwardscamera/MinecraftServerShell/issues");
            });
            break;
    }
}