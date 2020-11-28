import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class PanelContainer extends React.Component {
    render() {
        return (
            <h1>test</h1>
        );
    }
}
ReactDOM.render(
    <PanelContainer render="Servers"></PanelContainer>,
    document.getElementById('root')
);