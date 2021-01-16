import React from 'react';

class Navbar extends React.Component {
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
    }
    render() {
        return (
            <div className="Navbar_Container">
                test
            </div>
        );
    }
}

export default Navbar;