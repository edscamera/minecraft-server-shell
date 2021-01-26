import React from 'react';
import "./Navbar.css";

class Navbar extends React.Component {
    static option = null;
    constructor(props) {
        super(props);
        let options = [
            "Console",
            "Properties",
            "Backups",
        ]
        this.state = {
            options: options,
            selected: options[0],
        };
        Navbar.option = this.state.selected;
    }
    render = () => {
        let options = this.state.options.map(op =>
            <div
                key={op}
                className={this.state.selected === op ? "Navbar_Item_Selected" : "Navbar_Item"}
                onClick={() => this.setOption(op)}
            >
                {op}
            </div>
        );
        let j = <div className="Navbar_Container">
            {options}
        </div>
        return (
            <div>
                {j}
                <div style={{ marginLeft: "250px" }}>
                    test
                </div>
            </div>

        );
    }
    setOption = (op) => {
        this.setState({ selected: op });
        Navbar.option = op;
    }
}

export default Navbar;