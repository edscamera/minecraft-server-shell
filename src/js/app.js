/* IMPORTS */
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const dialog = require("electron").remote.dialog;
const Opened = require("@ronomon/opened");
const getSize = require("get-folder-size");
const download = require("download");
const resizeImg = require("resize-img");
const network = require("network");
const { Terminal } = require("xterm");
const { FitAddon } = require("xterm-addon-fit");
const pty = require("node-pty");

// CHECK FOR UPDATES
// Compares version with json "server"
const application_version = require(path.join(__dirname, "../package.json")).version;

console.log(`%c MINECRAFT SERVER SHELL VERSION ${application_version} `, 'background: #ff0; color: #000;');
fetch("https://edwardscamera.com/application_data.json")
    .then(raw => raw.json())
    .then(data => {
        if (application_version !== data["minecraft-server-shell"].version) {
            confirm(
                "A new update is available! Download the new version on GitHub.",
                ["Open GitHub", "Ok"],
                (ans) => {
                    if (ans === 0) openExternal("https://github.com/edwardscamera/minecraft-server-shell/releases");
                },
            );
        }
    });

// SETUP DIRECTORIES
// Located at "~/MinecraftServerShell"
const DIR = {
    HOME: path.join(os.homedir(), "./MinecraftServerShell/"),
    SERVERS: path.join(os.homedir(), "./MinecraftServerShell/servers/"),
    SERVER: null,
};
if (!fs.existsSync(DIR.HOME)) fs.mkdirSync(DIR.HOME);
if (!fs.existsSync(DIR.SERVERS)) fs.mkdirSync(DIR.SERVERS);

// SHOW PANEL
// Switches screen that is being shown to the user
const setPanel = (panel) => {
    Array.from(document.querySelector("#Panels").children).forEach(pan => {
        pan.style.display = pan.id === `Panel_${panel}` ? "block" : "none";
    });
    if (document.querySelector(`#Panel_${panel}`) && document.querySelector(`#Panel_${panel}`).getAttribute("navbar") === "true") {
        document.querySelector("#Panels").style.marginLeft = "250px";
        document.querySelector("#Navbar").classList.add("Navbar_Animation");
    } else {
        document.querySelector("#Panels").style.marginLeft = "0px";
        document.querySelector("#Navbar").classList.remove("Navbar_Animation");
    }
    if (window.onresize) window.onresize();
};
setPanel("ServerSelect");

// REPORT ERROR
// Creates error box with error code and option to open GitHub
const reportErr = (tag, e) => {
    if (dialog.showMessageBoxSync(null, {
        type: "error",
        title: "Minecraft Server Shell",
        message: `An unexpected error occurred${tag === "" ? "" : ` while trying to ${tag}`}.\n\n${e}\n\nPlease report the bug at the GitHub repository.`,
        buttons: ["Open GitHub Repository", "Close"],
    }) === 0) openExternal("https://github.com/edwardscamera/MinecraftServerShell/issues");
}

// SET LOAD
// Sets status of loading screen
const setLoad = (value, text) => {
    if (text) document.querySelector("#Loading_Text").innerText = text;
    if (!value) document.querySelector("#Loading").classList.add("Loading_Toggle");
    if (value) document.querySelector("#Loading").classList.remove("Loading_Toggle");
};

// CONFIRM
// Confirm GUI
const confirm = (question, buttons, callback) => {
    document.querySelector("#ConfirmBox_Question").innerText = question;
    const buttonParent = document.querySelector("#ConfirmBox_Buttons");
    while (buttonParent.children.length > 0) buttonParent.children[0].remove();

    buttons.forEach(btn => {
        let myBtn = document.createElement("div");
        Object.assign(myBtn, {
            innerText: btn,
            onclick: () => {
                document.querySelector("#ConfirmBox").classList.add("ConfirmBox_Toggle");
                callback(buttons.indexOf(btn));
            },
        });
        myBtn.classList.add("Button", "Border");
        myBtn.style.width = "90px";
        buttonParent.appendChild(myBtn);
    });

    document.querySelector("#ConfirmBox").classList.remove("ConfirmBox_Toggle");
};

// NAVBAR SETUP
// Initalizes and gives navbar functionality
const updatePanel = {};
Array.from(document.querySelector("#Navbar_TopOption").children)
    .filter(c => c.classList.contains("Navbar_Option"))
    .forEach(op => {
        op.addEventListener("click", () => {
            Array.from(document.querySelector("#Navbar_TopOption").children)
                .filter(c => c.classList.contains("Navbar_Option"))
                .forEach(op2 => {
                    op2.classList.remove("Navbar_OptionActive");
                });
            op.classList.add("Navbar_OptionActive");
            setPanel(op.innerText.replace(/\s/g, ""));
            if (op.innerText !== "Terminal") updatePanel[op.innerText.replace(/\s/g, "").toLowerCase()]();
        });
    });
document.querySelector("#Navbar_Open").onclick = () => {
    switch (os.platform()) {
        case "win32":
            require("child_process").exec(`explorer "${DIR.SERVER}"`);
            break;
        case "linux":
            require("child_process").exec(`xdg-open "${DIR.SERVER}"`);
            break;
        default:
            confirm(
                `Your operating system is not supported! Please report details in a GitHub issue.\n\n${os.platform()}`,
                ["Open GitHub", "Ok"],
                (ans) => {
                    if (ans === 0) openExternal("https://github.com/edwardscamera/MinecraftServerShell/issues");
                }
            );
            require("child_process").exec(`open "${DIR.SERVER}"`);
            break;
    }
}
document.querySelector("#Navbar_Exit").onclick = () => {
    const exit = () => {
        while (document.querySelector("#Terminal_Terminal").children.length > 0) document.querySelector("#Terminal_Terminal").children[0].remove();
        ptyProcess.kill();
        ptyProcess.killed = true;
        DIR.SERVER = null;
        if (checkInt) window.clearInterval(checkInt);
        setPanel("ServerSelect");
    };
    Opened.file(path.join(DIR.SERVER, "./server.jar"), (err, result) => {
        if (err) throw err;
        if (!result) {
            exit();
        } else {
            confirm(
                "Do you really want to exit? A running server may be corrupted during a forced shut down.",
                ["Yes", "Cancel"],
                (ans) => {
                    if (ans === 0) exit();
                }
            );
        }
    });
};

// CREATE LAYOUT
// Dynamically converts JSON tree to HTML structure
const createLayout = (data, elmt) => {
    data.forEach(el => {
        if (!el.tag) return;
        let c = document.createElement(el.tag);
        Object.keys(el).forEach(prop => {
            switch (prop) {
                case 'content':
                    c.innerText = el.content;
                    break;
                case 'style':
                    Object.assign(c.style, el.style);
                    break;
                case 'class':
                    el.class.forEach(cl => c.classList.add(cl));
                    break;
                case 'children':
                    createLayout(el.children, c);
                    break;
                default:
                    c[prop] = el[prop];
                    break;
            }
        });
        elmt.appendChild(c);
    });
};

// On Window Load
window.addEventListener("load", () => {
    document.querySelector("#Panels").style.display = "block";
    setLoad(true, "Fetching Data");
    window.fetch("https://papermc.io/api/v2/projects/paper").then(r => r.json()).then(data => {
        data.versions.reverse().forEach(ver => {
            let c = Object.assign(document.createElement("option"), { innerText: ver, });
            document.querySelector("#CreateServer_PaperVerDrop").appendChild(c);
        });
        let latestver = document.querySelector("#CreateServer_PaperVerDrop").children[0].innerText;
        window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${latestver}`).then(r => r.json()).then(data2 => {
            data2.builds.reverse().forEach(bui => {
                let c = Object.assign(document.createElement("option"), { innerText: bui, });
                document.querySelector("#CreateServer_PaperBuiDrop").appendChild(c);
            });
            document.querySelector("#CreateServer_PaperVerDrop").children[0].innerText += " (Latest)";
            document.querySelector("#CreateServer_PaperBuiDrop").children[0].innerText += " (Latest)";
            window.fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json").then(r => r.json()).then(data3 => {
                data3.versions.forEach(bui2 => {
                    let c = Object.assign(document.createElement("option"), {
                        innerText: bui2.id,
                        value: bui2.url,
                    });
                    if (c.innerText === data3.latest.release) {
                        c.innerText += " (Stable)";
                        c.selected = true;
                    }
                    document.querySelector("#CreateServer_VanillaBuiDrop").appendChild(c);
                });
                document.querySelector("#CreateServer_VanillaBuiDrop").children[0].innerText += " (Latest)";
                setLoad(false);
            });
        });
    });
});

// Setup for .ExternalLink
const openExternal = (url) => require("electron").shell.openExternal(url);
Array.from(document.getElementsByTagName("a")).forEach(elm => {
    elm.addEventListener("click", evt => {
        evt.preventDefault();
        openExternal(elm.href);
    });
});

let ptyProcess = null;
let checkInt = null;