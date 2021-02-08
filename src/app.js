const fs = require("fs");
const os = require("os");
const path = require("path");
const dialog = require("electron").remote.dialog;
const resizeImg = require("resize-img");

const DIR = {
    HOME: path.join(os.homedir(), "./MinecraftServerShell/"),
    SERVERS: path.join(os.homedir(), "./MinecraftServerShell/servers/"),
    SERVER: null,
};

if (!fs.existsSync(DIR.HOME)) fs.mkdirSync(DIR.HOME);
if (!fs.existsSync(DIR.SERVERS)) fs.mkdirSync(DIR.SERVERS);

const updateServerList = (dir) => {
    let subdirs = fs.readdirSync(dir, { withFileTypes: true, })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    document.querySelector("#ServerSelect_Label").innerText = `${subdirs.length} Server${subdirs.length === 1 ? "" : "s"} Found`;

    let layout = new Array(subdirs.length).fill(null);
    for (let i = 0; i < layout.length; i++) layout[i] = {
        tag: "div",
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
                style: { marginLeft: "15px", },
            }
        ],
    };

    while (document.querySelector("#ServerSelect_List").children.length > 0) document.querySelector("#ServerSelect_List").children[0].remove();
    createLayout(layout, document.querySelector("#ServerSelect_List"));
};
fs.watch(DIR.SERVERS, () => updateServerList(DIR.SERVERS));
updateServerList(DIR.SERVERS);

const createServer = () => {
    const serverName = document.querySelector("#AddServer_Name").value;

    if (/\/|\\|:|\*|\?|<|>|\|/g.test(serverName)) {
        dialog.showMessageBoxSync(null, {
            type: "error",
            title: "Minecraft Server Shell",
            message: "A server name can't contain any of the following characters: \n\n/ \\ : * ? < > |",
        });
        return;
    }
    if ([null, undefined, ""].includes(serverName) || serverName.replace(/\s/g, "").length === 0) {
        dialog.showMessageBoxSync(null, {
            type: "error",
            title: "Minecraft Server Shell",
            message: "A server name can't be empty.",
        });
        return;
    }

    if (dialog.showMessageBoxSync(null, {
        type: "question",
        title: "Minecraft Server Shell",
        buttons: ["Yes", "Cancel"],
        message: `Do you really want to create the server "${serverName}" with these settings? The settings can be changed afterwards.`,
    }) === 1) return;

    try {
        fs.mkdirSync(path.join(DIR.SERVERS, serverName));
    } catch (e) {
        return reportErr("create the server folder", e);
    }
    DIR.SERVER = path.join(DIR.SERVERS, serverName);

    try {
        fs.writeFileSync(path.join(DIR.SERVER, "./eula.txt"), "eula=true");
    } catch (e) {
        DIR.SERVER = null;
        return reportErr("accepting the EULA", e);
    }
    try {
        fs.writeFileSync(path.join(DIR.SERVER, "./start.bat"), "java -Xms512M -Xmx2G -jar server.jar nogui");
    } catch (e) {
        DIR.SERVER = null;
        return reportErr("creating the start script", e);
    }
    try {
        (async () => {
            if (document.querySelector("#AddServer_Image").files.length > 0) {
                const image = document.querySelector("#AddServer_Image").files[0];
                fs.copyFileSync(image.path, path.join(DIR.SERVER, "./server-icon-0.png"));

                let pathi = fs.readFileSync(path.join(DIR.SERVER, "./server-icon-0.png"));
                const img2 = await resizeImg(Buffer(pathi), {
                    width: 64,
                    height: 64,
                    format: "png",
                });

                fs.writeFileSync(path.join(DIR.SERVER, "server-icon.png"), img2)
            }
        })();
    } catch (e) {
        DIR.SERVER = null;
        return reportErr("resizing the server image", e);
    }
    showPanel("ServerSelect");
};

const showPanel = (panel) => {
    Array.from(document.querySelector("#Panels").children).forEach(pan => {
        pan.style.display = pan.id === `Panel_${panel}` ? "block" : "none";
    });
};
showPanel("ServerSelect");

const openExternal = (url) => require("electron").shell.openExternal(url);
const switchDesc = () => {
    let dropval = document.querySelector("#AddServer_JAR").value;
    Array.from(document.getElementsByClassName("AddServer_PaperDesc")).forEach(c => c.style.display = (dropval === "Paper" ? "block" : "none"));
    Array.from(document.getElementsByClassName("AddServer_VanillaDesc")).forEach(c => c.style.display = (dropval === "Vanilla" ? "block" : "none"));
    Array.from(document.getElementsByClassName("AddServer_CustomDesc")).forEach(c => c.style.display = (dropval === "Custom" ? "block" : "none"));
};
switchDesc();
const disableBtn = () => document.querySelector("#AddServer_CreateButton").disabled = !document.querySelector("#AddServer_EULA").checked;
const reportErr = (tag, e) => {
    if (dialog.showMessageBoxSync(null, {
        type: "error",
        title: "Minecraft Server Shell",
        message: `An unexpected error occurred${tag === "" ? "" : ` while trying to ${tag}`}.\n\n${e}\n\nPlease report the bug at the GitHub repository.`,
        buttons: ["Open GitHub Repository", "Close"],
    }) === 0) openExternal("https://github.com/edwardscamera/MinecraftServerShell/issues");
}

window.fetch("https://papermc.io/api/v2/projects/paper").then(r => r.json()).then(data => {
    data.versions.reverse().forEach(ver => {
        let c = Object.assign(document.createElement("option"), {
            innerText: ver,
        });
        document.querySelector("#AddServer_PaperVerDrop").appendChild(c);
    });
    let latestver = document.querySelector("#AddServer_PaperVerDrop").children[0].innerText;
    window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${latestver}`).then(r => r.json()).then(data2 => {
        data2.builds.reverse().forEach(bui => {
            let c = Object.assign(document.createElement("option"), {
                innerText: bui,
            });
            document.querySelector("#AddServer_PaperBuiDrop").appendChild(c);
        });
        document.querySelector("#AddServer_PaperVerDrop").children[0].innerText += " (Latest)";
        document.querySelector("#AddServer_PaperBuiDrop").children[0].innerText += " (Latest)";
    });
});
document.querySelector("#AddServer_PaperVerDrop").addEventListener("change", () => {
    let sererver = document.querySelector("#AddServer_PaperVerDrop").value.split(" ")[0];
    while (document.querySelector("#AddServer_PaperBuiDrop").children.length > 0) document.querySelector("#AddServer_PaperBuiDrop").children[0].remove();
    window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${sererver}`).then(r => r.json()).then(data2 => {
        data2.builds.reverse().forEach(bui => {
            let c = Object.assign(document.createElement("option"), {
                innerText: bui,
            });
            document.querySelector("#AddServer_PaperBuiDrop").appendChild(c);
        });
    });
});