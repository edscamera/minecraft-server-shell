import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


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
                <div className="PanelSwitcher_Option">
                    {button.display}
                </div>
            );
        });
        return (
            <div className="PanelSwitcher_Container">{options}</div>
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
                    <PanelSwitcher></PanelSwitcher>
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