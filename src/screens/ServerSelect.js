import React from 'react';

import Loading from "../components/Loading.js";
import "./ServerSelect.css";

const fs = require("fs");
const path = require("path");
const { dialog } = require("electron").remote;

class ServerSelect extends React.Component {
    constructor(props) {
        super(props);
        fs.watch(this.props.dir.servers, () => this.forceUpdate());
    }
    render = () => {
        let servers = fs.readdirSync(this.props.dir.servers, { withFileTypes: true });
        servers = servers.filter(dir => dir.isDirectory());
        servers = servers.map(dir => <ServerSelectListIndex
            name={dir.name}
            key={dir.name}
            dir={this.props.dir.servers}
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
    openFolder = () => {
        require('child_process').exec(`start "" "${this.props.dir.servers}"`);
    }
    createServer = () => {
        this.props.switchPanel("CreateServer");
    }
}

class ServerSelectListIndex extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            directory: path.join(this.props.dir, this.props.name),
        };

        this.deleteServer = this.deleteServer.bind(this);
    }
    render = () => {
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
    deleteServer = () => {
        dialog.showMessageBox({
            buttons: ["Yes", "No"],
            message: `Are you sure you want to delete your server "${this.props.name}"? This cannot be reversed!`,
            title: "Minecraft Server Shell",
        }).then(value => {
            if (value.response === 0) {
                Loading.show("Deleting Server");
                fs.rmdirSync(this.state.directory, { recursive: true });
                Loading.hide();
                this.props.rerender();
            }
        });
    }
}

export default ServerSelect;