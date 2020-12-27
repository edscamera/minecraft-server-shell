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

class MinecraftServerShell extends React.Component {
    constructor(props) {
        super(props);

        if (!fs.existsSync(dir.root)) fs.mkdirSync(dir.root);
        if (!fs.existsSync(dir.servers)) fs.mkdirSync(dir.servers);
    }
    render() {
        return (<PanelContainer panel="Servers"></PanelContainer>);
    }
}

class PanelContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            panel: props.panel,
        };
    }
    render() {
        let screen = null;
        switch (this.state.panel) {
            case "Servers":
                screen = <ServerSelect></ServerSelect>;
                break;
            default:
                screen = <h1>Invalid Panel State</h1>;
                break;
        }
        return (screen);
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
                <div style={{ textAlign: "center", }}>
                    <div className="ServerSelect_Button"
                        id="ServerSelect_Button_OpenFolder"
                        onClick={this.openFolder}
                    >Open Folder</div>
                    <div className="ServerSelect_Button"
                        id="ServerSelect_Button_CreateServer"
                    >Create Server</div>
                </div>
            </div>
        );
    }
    openFolder() {
        require('child_process').exec(`start "" "${dir.servers}"`);
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