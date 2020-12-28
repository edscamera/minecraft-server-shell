import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const { dialog } = require("electron").remote;

const dir = {
    root: path.join(os.homedir(), "\\MinecraftServerShell\\"),
    servers: path.join(os.homedir(), "\\MinecraftServerShell\\servers"),
};
const global = {
    switchPanel: () => { },
}

class MinecraftServerShell extends React.Component {
    constructor(props) {
        super(props);

        if (!fs.existsSync(dir.root)) fs.mkdirSync(dir.root);
        if (!fs.existsSync(dir.servers)) fs.mkdirSync(dir.servers);
    }
    render() {
        return (<PanelContainer panel="ServerList"></PanelContainer>);
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
    render() {
        return (
            // TODO: Vanilla, Paper, Tuinity JAR support
            <div>
                <div className="ServerSelect_Header">
                    Create A Server
                </div>
                <div id="CreateServer_TableParent">
                    <table id="CreateServer_Table">
                        <tbody>
                            <tr>
                                <td>Server JAR/Core</td>
                                <td>
                                    <select>
                                        <option>Vanilla</option>
                                        <option>Paper</option>
                                        <option>Tuinity</option>
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
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
        console.log(this);
        dialog.showMessageBox({
            buttons: ["Yes", "No"],
            message: `Are you sure you want to delete your server "${this.props.name}"? This cannot be reversed!`,
            title: "Minecraft Server Shell",
        }).then(value => {
            if (value.response === 0) {
                fs.rmdirSync(this.state.directory);
                this.props.rerender();
            }
        });
    }
}

ReactDOM.render(
    <MinecraftServerShell></MinecraftServerShell>,
    document.getElementById('root')
);