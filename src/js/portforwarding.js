const network = require("network");
const clickPortForwarding = () => {
    network.get_gateway_ip((err, ip) => {
        if (err) {
            console.log(err);
            document.querySelector("#PortForwarding_DefaultGateway").innerText = `Error`;
            document.querySelector("#PortForwarding_DefaultGateway").onclick = () => { };
            return;
        }
        document.querySelector("#PortForwarding_DefaultGateway").innerText = `${ip} (Default Gateway)`;
        document.querySelector("#PortForwarding_DefaultGateway").onclick = () => {
            openExternal(`http://${ip}`);
        };
    });
    network.get_private_ip((err, ip) => {
        if (err) console.log(err);
        document.querySelector("#PortForwarding_Private").innerText = err ? "Error" : ip;
    });
    network.get_public_ip((err, ip) => {
        if (err) console.log(err);
        document.querySelector("#PortForwarding_Public").innerText = err ? "Error" : ip;
    });
};