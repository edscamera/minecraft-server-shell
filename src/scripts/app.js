const fs = require("fs");
const os = require("os");
const path = require("path");
const dialog = require("electron").remote.dialog;
const download = require("download");
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

document.querySelector("#ServerSelect_CreateServer").onclick = () => showPanel("CreateServer");
document.querySelector("#ServerSelect_OpenServerFolder").onclick = () => openExternal(DIR.SERVERS);

document.querySelector("#CreateServer_GoBack").onclick = () => showPanel('ServerSelect');

document.querySelector("#CreateServer_CreateButton").onclick = () => {
    const reterr = () => {
        setLoad(false);
        DIR.SERVER = null;
        showPanel("ServerSelect");
    };
    const serverName = document.querySelector("#CreateServer_Name").value;

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

    setLoad(true, "Creating Your Server");

    try {
        fs.mkdirSync(path.join(DIR.SERVERS, serverName));
    } catch (e) {
        reterr();
        return reportErr("create the server folder", e);
    }
    DIR.SERVER = path.join(DIR.SERVERS, serverName);

    try {
        fs.writeFileSync(path.join(DIR.SERVER, "./eula.txt"), "eula=true");
    } catch (e) {
        reterr();
        return reportErr("accepting the EULA", e);
    }
    try {
        fs.writeFileSync(path.join(DIR.SERVER, "./start.bat"), "java -Xms512M -Xmx2G -jar server.jar nogui");
    } catch (e) {
        reterr();
        return reportErr("creating the start script", e);
    }
    if (document.querySelector("#CreateServer_JAR").value === "Custom") {
        try {
            fs.copyFile(document.querySelector("#CreateServer_CustomJAR").files[0].path, path.join(DIR.SERVER, "./server.jar"));
        } catch (e) {
            reterr();
            return reportErr("copying the custom JAR", e);
        }
    }
    try {
        (async () => {
            if (document.querySelector("#CreateServer_Image").files.length > 0) {
                const image = document.querySelector("#CreateServer_Image").files[0];
                fs.copyFileSync(image.path, path.join(DIR.SERVER, "./server-icon-0.png"));

                let pathi = fs.readFileSync(path.join(DIR.SERVER, "./server-icon-0.png"));
                const img2 = await resizeImg(Buffer(pathi), {
                    width: 64,
                    height: 64,
                    format: "png",
                });

                fs.writeFileSync(path.join(DIR.SERVER, "server-icon.png"), img2);
            }
        })();
    } catch (e) {
        reterr();
        return reportErr("resizing the server image", e);
    }
    (async () => {
        try {
            if (document.querySelector("#CreateServer_JAR").value === "Paper") {
                const version = document.querySelector("#CreateServer_PaperVerDrop").value.split(" ")[0];
                const build = document.querySelector("#CreateServer_PaperBuiDrop").value.split(" ")[0];
                const link = `https://papermc.io/api/v2/projects/paper/versions/${version}/builds/${build}/downloads/paper-${version}-${build}.jar`;
                fs.writeFileSync(path.join(DIR.SERVER, "./server.jar"), await download(link));

                reterr();
            }
        } catch (e) {
            reterr();
            return reportErr("downloading the JAR", e);
        }
    })();
};

const showPanel = (panel) => {
    Array.from(document.querySelector("#Panels").children).forEach(pan => {
        pan.style.display = pan.id === `Panel_${panel}` ? "block" : "none";
    });
};
showPanel("ServerSelect");

document.querySelector("#CreateServer_JAR").onchange = () => {
    let dropval = document.querySelector("#CreateServer_JAR").value;
    Array.from(document.getElementsByClassName("CreateServer_PaperDesc")).forEach(c => c.style.display = (dropval === "Paper" ? "block" : "none"));
    Array.from(document.getElementsByClassName("CreateServer_VanillaDesc")).forEach(c => c.style.display = (dropval === "Vanilla" ? "block" : "none"));
    Array.from(document.getElementsByClassName("CreateServer_CustomDesc")).forEach(c => c.style.display = (dropval === "Custom" ? "block" : "none"));
};
document.querySelector("#CreateServer_JAR").onchange();

let eulaCheckBox = document.querySelector("#CreateServer_EULA");
eulaCheckBox.onchange = () => document.querySelector("#CreateServer_CreateButton").disabled = !eulaCheckBox.checked;

const reportErr = (tag, e) => {
    if (dialog.showMessageBoxSync(null, {
        type: "error",
        title: "Minecraft Server Shell",
        message: `An unexpected error occurred${tag === "" ? "" : ` while trying to ${tag}`}.\n\n${e}\n\nPlease report the bug at the GitHub repository.`,
        buttons: ["Open GitHub Repository", "Close"],
    }) === 0) openExternal("https://github.com/edwardscamera/MinecraftServerShell/issues");
}

document.querySelector("#CreateServer_PaperVerDrop").addEventListener("change", () => {
    setLoad(true, "Fetching Data");
    let sererver = document.querySelector("#CreateServer_PaperVerDrop").value.split(" ")[0];
    while (document.querySelector("#CreateServer_PaperBuiDrop").children.length > 0) document.querySelector("#CreateServer_PaperBuiDrop").children[0].remove();
    window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${sererver}`).then(r => r.json()).then(data2 => {
        data2.builds.reverse().forEach(bui => {
            let c = Object.assign(document.createElement("option"), {
                innerText: bui,
            });
            document.querySelector("#CreateServer_PaperBuiDrop").appendChild(c);
        });
        setLoad(false);
    });
});
window.addEventListener("load", () => {
    document.querySelector("#Panels").style.display = "block";
    setLoad(true, "Fetching Data");
    window.fetch("https://papermc.io/api/v2/projects/paper").then(r => r.json()).then(data => {
        data.versions.reverse().forEach(ver => {
            let c = Object.assign(document.createElement("option"), {
                innerText: ver,
            });
            document.querySelector("#CreateServer_PaperVerDrop").appendChild(c);
        });
        let latestver = document.querySelector("#CreateServer_PaperVerDrop").children[0].innerText;
        window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${latestver}`).then(r => r.json()).then(data2 => {
            data2.builds.reverse().forEach(bui => {
                let c = Object.assign(document.createElement("option"), {
                    innerText: bui,
                });
                document.querySelector("#CreateServer_PaperBuiDrop").appendChild(c);
            });
            document.querySelector("#CreateServer_PaperVerDrop").children[0].innerText += " (Latest)";
            document.querySelector("#CreateServer_PaperBuiDrop").children[0].innerText += " (Latest)";
            setLoad(false);
        });
    });
});
const setLoad = (value, text) => {
    if (text) document.querySelector("#Loading_Text").innerText = text;
    if (!value) document.querySelector("#Loading").classList.add("Loading_Toggle");
    if (value) document.querySelector("#Loading").classList.remove("Loading_Toggle");
};