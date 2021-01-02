import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import Loading from "./components/Loading";
import ServerSelect from "./screens/ServerSelect";
import CreateServer from "./screens/CreateServer";

const fs = require("fs-extra");
const os = require("os");
const path = require("path");

class MinecraftServerShell extends React.Component {
    static dir = {
        root: path.join(os.homedir(), "\\MinecraftServerShell\\"),
        servers: path.join(os.homedir(), "\\MinecraftServerShell\\servers"),
        server: null,
        yo: "YOOOO1",
    };

    constructor(props) {
        super(props);
        if (!fs.existsSync(MinecraftServerShell.dir.root)) fs.dirSync(MinecraftServerShell.dir.root);
        if (!fs.existsSync(MinecraftServerShell.dir.servers)) fs.mkdirSync(MinecraftServerShell.dir.servers);
    }

    render = () => <div>
        <PanelContainer panel="ServerList"></PanelContainer>
        <Loading></Loading>
    </div>

}

class PanelContainer extends React.Component {
    static instance = null;
    constructor(props) {
        super(props);
        PanelContainer.instance = this;
        this.state = { panel: this.props.panel, };
    }

    static switchPanel = (panel) => { PanelContainer.instance.localSwitchPanel(panel); }

    localSwitchPanel = (panel) => this.setState({ panel: panel, });

    render = () => {
        let screen = null;
        switch (this.state.panel) {
            case "ServerList":
                screen = <ServerSelect switchPanel={PanelContainer.switchPanel}></ServerSelect>;
                break;
            case "CreateServer":
                screen = <CreateServer switchPanel={PanelContainer.switchPanel}></CreateServer>;
                break;
            default:
                screen = <h1>Invalid Panel State</h1>;
                break;
        }
        return (screen);
    }
}

ReactDOM.render(
    <MinecraftServerShell></MinecraftServerShell>,
    document.getElementById('root')
);

export default MinecraftServerShell;