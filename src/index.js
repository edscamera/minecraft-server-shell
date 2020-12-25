import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class ServerContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            directory: process.env.LOCALAPPDATA,
            servers: [],
        };
        
    }
    render() {
        return(
        <div className="ServerContainer_Title">
            There are {this.state.servers.length} server{this.state.servers.length === 1 ? '' : 's'} avalible!
        </div>
        );
    }
}

class PanelSwitcher extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            buttons: [
                {
                    display: "Console",
                    panelName: "console",
                },
                {
                    display: "Backups",
                    panelName: "backups",
                },
            ],
        }
    }
    render() {
        let options = [];
        this.state.buttons.forEach(button => {
            options.push(
                <div className="PanelSwitcher_Option" key={button.panelName}>
                    {button.display}
                </div>
            );
        });
        return (
            <div className="PanelSwitcher_Container">
                <div className="PanelSwitcher_Title">
                    Minecraft Server Shell
                </div>
                <div>{options}</div>
            </div>
        );
    }
}

class PanelContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            panel: props.initPanel,
        };
    }
    render() {
        switch (this.state.panel) {
            default:
            case 'Servers':
                return (
                    <ServerContainer></ServerContainer>
                );
            case 'Backups':
                return (
                    <PanelSwitcher></PanelSwitcher>
                );
        }
    }
}

ReactDOM.render(
    <PanelContainer initPanel="Servers"></PanelContainer>,
    document.getElementById('root')
);