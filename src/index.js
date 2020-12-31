import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { dialog, shell } = require("electron").remote;
const download = require("download");

const dir = {
    root: path.join(os.homedir(), "\\MinecraftServerShell\\"),
    servers: path.join(os.homedir(), "\\MinecraftServerShell\\servers"),
    server: null,
};
const global = {
    switchPanel: () => { },
    showLoading: () => { },
    hideLoading: () => { },
}

class MinecraftServerShell extends React.Component {
    constructor(props) {
        super(props);
        if (!fs.existsSync(dir.root)) fs.mkdirSync(dir.root);
        if (!fs.existsSync(dir.servers)) fs.mkdirSync(dir.servers);
    }
    render() {
        return (
            <div>
                <PanelContainer panel="ServerList"></PanelContainer>
                <Loading></Loading>
            </div>
        );
    }
}

class Loading extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            loadingText: ""
        };
        global.showLoading = this.showLoading;
        global.hideLoading = this.hideLoading;
    }
    render() {
        return (<div id="Loading_Background" className={!this.state.loading ? "Loading_Background_0" : ""}>
            <div id="Loading_Container">
                <div id="Loading_Loader" />
                <div id="Loading_Text">{this.state.loadingText}</div>
            </div>
        </div>);
    }
    showLoading = (text) => {
        this.setState({
            loading: true,
            loadingText: text,
        });
    }
    hideLoading = () => {
        this.setState({
            loading: false,
            loadingText: ""
        });
    }
}

class PanelContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { panel: this.props.panel, };
        global.switchPanel = this.switchPanel;
    }
    switchPanel = (panel) => { this.setState({ panel: panel, }) }
    render() {
        let screen = null;
        switch (this.state.panel) {
            case "ServerList":
                screen = <ServerSelect></ServerSelect>;
                break;
            case "CreateServer":
                screen = <CreateServer></CreateServer>;
                break;
            default:
                screen = <h1>Invalid Panel State</h1>;
                break;
        }
        return (screen);
    }
}

class CreateServer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            jar: "Paper",
            description: {
                "Vanilla": <div><div>
                    <span className="ExternalLink" onClick={() => shell.openExternal("https://minecraft.net")}>Vanilla Minecraft</span> is the base version of Minecraft,
                    developed by Mojang. If you want the true, original
                    Minecraft expierience, this is the choice for you.
                    </div>
                    <ul>
                        <li>New Server JAR/Core releases at the same time as new versions of Minecraft.</li>
                        <li>Option to use snapshots which include in development versions of the game.</li>
                    </ul>
                </div>,
                "Paper": <div><div>
                    <span className="ExternalLink" onClick={() => shell.openExternal("https://papermc.io")}>Paper</span> gives you the base expierience of Vanilla
                    Minecraft, with various bug fixes and numerous
                    improvements and optimizations.
                    </div>
                    <ul>
                        <li>Optional plugin support which adds community-made extra fun to your game.</li>
                        <li>Optimized and improved, faster Minecraft server.</li>
                        <li>Little slower to update than vanilla Minecraft servers.</li>
                    </ul>
                </div>,
                "Custom": <div>
                    Use a custom JAR file as a core.
                </div>
            },
            apidat: {
                vanilla: {
                    data: null,
                    version: "",
                    latest: "",
                },
                paper: {
                    versions: null,
                    build: null,
                    version: null,
                },
                custom: null,
            },
        };
        global.showLoading("Updating Server Data");
        window.fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json").then(r => r.json()).then(data => {
            this.state.apidat.vanilla = {
                latest: data.latest,
                version: data.latest.release + " (Stable)",
                data: data.versions.map(ver => {
                    let suffix = "";
                    if (ver.id === data.latest.release) suffix += " (Stable)";
                    if (ver.id === data.latest.snapshot) suffix += " (Latest)";
                    return (<option key={ver.id} selected={ver.id === data.latest.release ? "selected" : ""}>
                        {ver.id + suffix}
                    </option>);
                }),
            };
        }).then(() => {
            window.fetch("https://papermc.io/api/v2/projects/paper/").then(r => r.json()).then(data2 => {
                this.state.apidat.paper.versions = data2.versions.reverse().map(ver => <option key={ver}>{ver}</option>);
                this.state.apidat.paper.version = data2.versions[0];
                window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${data2.versions[0]}`).then(r => r.json()).then(data3 => {
                    this.state.apidat.paper.builds = data3.builds.reverse().map(build => <option key={build}>{build}</option>);
                    this.state.apidat.paper.build = data3.builds[0];
                    this.forceUpdate();
                    global.hideLoading();
                });
            });
        });
    }
    render() {
        return (
            // TODO: Vanilla, Paper, Tuinity JAR support
            <div>
                <div className="ServerSelect_Header">
                    Create A Server
                </div>
                <div id="CreateServer_TableParent">
                    <div className="LeftRight">
                        <span>Server Name</span>
                        <input type="text" placeholder="Server Name" onChange={(a) => this.setState({ name: a.target.value, })}></input>
                    </div>
                    <ul>
                        <li>Your server name will not be represented in-game.</li>
                        <li>Your server name will be the name of the folder your server is in and a name only used by Minecraft Server Shell.</li>
                    </ul>
                    <div className="LeftRight">
                        <span>Server JAR/Core</span>
                        <select onChange={(a) => this.setState({ jar: a.target.value, })}>
                            <option key="Paper">Paper</option>
                            <option key="Vanilla">Vanilla</option>
                            <option key="Custom">Custom</option>
                        </select>
                    </div>
                    <br />
                    {this.state.description[this.state.jar]}
                    {
                        (this.state.jar === "Vanilla" ?
                            <div className="LeftRight">
                                <span>Minecraft Version</span>
                                <select>
                                    {this.state.apidat.vanilla.data}
                                </select>
                            </div>
                            : null)
                    }
                    {
                        (this.state.jar === "Paper" ?
                            <div>
                                <div className="LeftRight">
                                    <span>Paper Version</span>
                                    <select onChange={(a) => this.setPVer(a.target.value)}>
                                        {this.state.apidat.paper.versions}
                                    </select>
                                </div>
                                <div className="LeftRight">
                                    <span>Paper Build</span>
                                    <select onChange={(a) => this.setPBuild(a.target.value)}>
                                        {this.state.apidat.paper.builds}
                                    </select>
                                </div>
                            </div>
                            : null)
                    }
                    {
                        (this.state.jar === "Custom" ?
                            <div className="LeftRight">
                                <span>Upload Custom JAR File</span>
                                <input type="file" onChange={(a) => this.setjar(a)}></input>
                            </div>
                            : null)
                    }
                    <ul>
                        {this.state.jar === "Paper" ? <li><b>It is recommended you use the latest build.</b></li> : null}
                        <li>Any issues during gameplay, more specifically issues generated by the JAR file itself, is not a problem with Minecraft Server Shell, as Minecraft Server Shell only executes the JAR file provided.</li>
                        {this.state.jar === "Paper" ? <li>Paper is not officially affiliated with Minecraft and issues should be reported on their <span className="ExternalLink" onClick={() => shell.openExternal("https://github.com/PaperMC/Paper/issues")}>GitHub page</span>.</li> : null}
                        {this.state.jar === "Vanilla" ? <li>Issues with Vanilla Minecraft are to be reported on their <span className="ExternalLink" onClick={() => shell.openExternal("https://bugs.mojang.com/secure/Dashboard.jspa")}>bug tracker</span>.</li> : null}
                        <li><span className="ExternalLink" onClick={() => shell.openExternal("https://www.java.com/en/download/")}>Java</span> is required to run Minecraft servers.</li>
                        <li>Server JARs/Cores can be changed after server creation.</li>
                    </ul>
                    <div className="LeftRight">
                        <span>Upload Server Icon</span>
                        <input type="file" onChange={(a) => this.checkUpload(a, ".png")}></input>
                    </div>
                    <ul>
                        <li>The image provided will be used as the server icon in both Minecraft Server Shell and Minecraft. The server icon is visible in the Multiplayer menu in Minecraft.</li>
                        <li>The image provided must be 64 pixels wide and 64 pixels long. It will automatically be resized if it is not.</li>
                        <li>This image can be changed after server creation.</li>
                    </ul>
                    <div className="LeftRight">
                        <span>I have read and agreed to the <span className="ExternalLink" onClick={() => shell.openExternal("https://account.mojang.com/documents/minecraft_eula")}>Minecraft End User License Agreement.</span></span>
                        <input type="checkbox" onChange={(a) => this.setState({ eula: a.target.checked })}></input>
                    </div>
                    <br />
                    <div style={{ textAlign: "center" }}>
                        <button id="CreateServer_GoBack" onClick={() => global.switchPanel("ServerList")}>
                            Back
                        </button>
                        <button disabled={!this.state.eula} id="CreateServer_CreateButton" onClick={this.createServer}>
                            Create Server
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    createServer = () => {
        let confirmed = () => {
            global.showLoading("Creating Folder");
            // Check for empty name
            if (!this.state.name || this.state.name.length <= 0) {
                dialog.showErrorBox("Minecraft Server Shell", `Your server name cannot be empty.`);
                global.hideLoading();
                return;
            }
            // Check for invalid characters
            let prohibitChar = ["/", "\\", ".", ":", "*", "?", '"', "'", "<", ">", "|"];
            for (let i = 0; i < prohibitChar.length; i++) {
                if (this.state.name.includes(prohibitChar[i])) {
                    dialog.showErrorBox("Minecraft Server Shell", `Your server name cannot contain any of the following characters:\n\n${prohibitChar.reduce((a, b) => a + ' ' + b)}`);
                    global.hideLoading();
                    return;
                }
            };
            // Check for existing server
            if (fs.existsSync(path.join(dir.servers, this.state.name))) {
                dialog.showErrorBox("Minecraft Server Shell", `A server already exists by the name "${this.state.name}".`);
                global.hideLoading();
                return;
            }
            // Attempt to make directory
            try {
                fs.mkdirSync(path.join(dir.servers, this.state.name));
            } catch (e) {
                dialog.showErrorBox("Minecraft Server Shell", `An unexpected error occurred while creating the folder.\n\n${e}`);
                global.hideLoading();
                return;
            }
            dir.server = path.join(dir.servers, this.state.name);

            let downloadComplete = () => {
                global.showLoading("Writing Additional Files");

            };

            // Download JAR/Core
            global.showLoading("Downloading JAR/Core");
            switch (this.state.jar) {
                case "Vanilla":

                    break;
                case "Paper":
                    let url = `https://papermc.io/api/v2/projects/paper/versions/`;
                    url += this.state.apidat.paper.version;
                    url += "/builds/";
                    url += this.state.apidat.paper.build;
                    url += "/downloads/paper-"
                    url += `${this.state.apidat.paper.version}-${this.state.apidat.paper.build}.jar`;
                    (async () => {
                        fs.writeFileSync(path.join(dir.server, "server.jar"), await download(url));
                        downloadComplete();
                    })();
                    break;
                case "Custom":
                    global.showLoading("Copying JAR/Core");
                    fs.copyFileSync(this.state.apidat.custom, path.join(dir.server, "server.jar"));
                    downloadComplete();
                    break;
                default:
                    dialog.showErrorBox("Minecraft Server Shell", "Unkown JAR option was set.");
                    fs.rmdirSync(dir.server, { recursive: true });
                    dir.server = null;
                    global.hideLoading();
                    break;
            }
        };
        dialog.showMessageBox({
            buttons: ["Yes", "No"],
            message: `Are you sure you want to create a server with these settings?`,
            title: "Minecraft Server Shell",
        }).then(value => {
            if (value.response === 0) {
                confirmed();
            }
        });
    }
    setjar(a) {
        if (!this.checkUpload(a, ".jar")) return;
        let mutate = this.state;
        mutate.apidat.custom = a.target.files[0].path;
        this.setState({ apidat: mutate.apidat, });
    }
    setPBuild(ver) {
        let mutate = this.state;
        mutate.apidat.paper.build = ver;
        this.setState({ apidat: mutate.apidat, });
    }
    setPVer(ver) {
        let mutate = this.state;
        mutate.apidat.paper.version = ver;
        this.setState({ apidat: mutate.apidat, });

        this.updateBuilds(ver);
    }
    updateBuilds(ver) {
        global.showLoading("Updating Server Data");
        window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${ver}`).then(r => r.json()).then(data => {
            let mutate = this.state;
            mutate.apidat.paper.builds = data.builds.reverse().map(build => <option key={build}>{build}</option>);
            this.setState(mutate, () => global.hideLoading());
        });
    }
    checkUpload(obj, ext) {
        if (!obj.target.files[0].name.toString().endsWith(ext)) {
            dialog.showErrorBox("Minecraft Server Shell", `File must be a ${ext} file!`);
            obj.target.value = "";
            return false;
        }
        return true;
    }
}

class ServerSelect extends React.Component {
    constructor(props) {
        super(props);
        fs.watch(dir.servers, () => this.forceUpdate());
    }
    render() {
        let servers = fs.readdirSync(dir.servers, { withFileTypes: true });
        servers = servers.filter(dir => dir.isDirectory());
        servers = servers.map(dir => <ServerSelectListIndex
            name={dir.name}
            key={dir.name}
            rerender={() => this.forceUpdate()}
        />);

        return (
            <div>
                <div className="ServerSelect_Header">
                    {servers.length} Server{servers.length === 1 ? "" : "s"} Found
                </div>
                <table className="ServerSelect_List">
                    <tbody>{servers}</tbody>
                </table>
                <div id="ServerSelect_ButtonParent">
                    <div className="ServerSelect_Button"
                        id="ServerSelect_Button_OpenFolder"
                        onClick={this.openFolder}
                    >Open Folder</div>
                    <div className="ServerSelect_Button"
                        id="ServerSelect_Button_CreateServer"
                        onClick={this.createServer}
                    >Create Server</div>
                </div>
            </div>
        );
    }
    openFolder() {
        require('child_process').exec(`start "" "${dir.servers}"`);
    }
    createServer() {
        global.switchPanel("CreateServer");
    }
}

class ServerSelectListIndex extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            directory: path.join(dir.servers, this.props.name),
        };

        this.deleteServer = this.deleteServer.bind(this);
    }
    render() {
        return (
            <tr className="ServerSelect_ListIndex">
                <td>{this.state.name}</td>
                <td style={{ width: "1%" }} className="ServerSelect_ListIndex_Button" id="ServerSelect_ListIndex_Open">
                    Open
                </td>
                <td style={{ width: "1%" }} className="ServerSelect_ListIndex_Button" onClick={this.deleteServer} id="ServerSelect_ListIndex_Delete">
                    Delete
                </td>
            </tr>
        );
    }
    deleteServer() {
        dialog.showMessageBox({
            buttons: ["Yes", "No"],
            message: `Are you sure you want to delete your server "${this.props.name}"? This cannot be reversed!`,
            title: "Minecraft Server Shell",
        }).then(value => {
            if (value.response === 0) {
                global.showLoading("Deleting Server");
                fs.rmdirSync(this.state.directory, { recursive: true });
                global.hideLoading();
                this.props.rerender();
            }
        });
    }
}

ReactDOM.render(
    <MinecraftServerShell></MinecraftServerShell>,
    document.getElementById('root')
);