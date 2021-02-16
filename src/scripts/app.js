/* IMPORTS */
const fs = require("fs");
const os = require("os");
const path = require("path");
const dialog = require("electron").remote.dialog;

/* SETUP DIRECTORIES
// Located at "~/MinecraftServerShell"
*/
const DIR = {
    HOME: path.join(os.homedir(), "./MinecraftServerShell/"),
    SERVERS: path.join(os.homedir(), "./MinecraftServerShell/servers/"),
    SERVER: null,
};
if (!fs.existsSync(DIR.HOME)) fs.mkdirSync(DIR.HOME);
if (!fs.existsSync(DIR.SERVERS)) fs.mkdirSync(DIR.SERVERS);

/* SHOW PANEL
// Switches screen that is being shown to the user
*/
const showPanel = (panel) => {
    Array.from(document.querySelector("#Panels").children).forEach(pan => {
        pan.style.display = pan.id === `Panel_${panel}` ? "block" : "none";
    });
};
showPanel("ServerSelect");

/* REPORT ERROR
// Creates error box with error code and option to open GitHub
*/
const reportErr = (tag, e) => {
    if (dialog.showMessageBoxSync(null, {
        type: "error",
        title: "Minecraft Server Shell",
        message: `An unexpected error occurred${tag === "" ? "" : ` while trying to ${tag}`}.\n\n${e}\n\nPlease report the bug at the GitHub repository.`,
        buttons: ["Open GitHub Repository", "Close"],
    }) === 0) openExternal("https://github.com/edwardscamera/MinecraftServerShell/issues");
}

/* SET LOAD
// Sets status of loading screen
*/
const setLoad = (value, text) => {
    if (text) document.querySelector("#Loading_Text").innerText = text;
    if (!value) document.querySelector("#Loading").classList.add("Loading_Toggle");
    if (value) document.querySelector("#Loading").classList.remove("Loading_Toggle");
};

/* CREATE LAYOUT
// Dynamically converts JSON tree to HTML structure
*/
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

// Setup for .ExternalLink
const openExternal = (url) => require("electron").shell.openExternal(url);
Array.from(document.getElementsByClassName("ExternalLink")).forEach(c => { c.onclick = () => openExternal(c.getAttribute("url")) });