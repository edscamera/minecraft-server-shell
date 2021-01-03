import React from 'react';
import "./Loading.css";

class Loading extends React.Component {
    static instance = null;
    constructor(props) {
        super(props);
        Loading.instance = this;
        this.state = {
            active: false,
            text: "",
        };
    }

    render = () => <div id="Loading_Background" className={!this.state.active ? "Loading_Background_0" : ""}>
        <div id="Loading_Container">
            <div id="Loading_Loader" />
            <div id="Loading_Text">{this.state.text}</div>
        </div>
    </div>;


    static show = (text) => Loading.instance.localShow(text);
    static hide = () => Loading.instance.localHide();

    localShow = (text) => {
        this.setState({
            active: true,
            text: text,
        });
        this.forceUpdate();
    }

    localHide = () => {
        this.setState({
            active: false,
            text: "",
        });
        this.forceUpdate();
    }
}

export default Loading;