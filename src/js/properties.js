String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};
updatePanel["properties"] = () => {
    setLoad(true, "Loading Properties");
    if (!fs.existsSync(path.join(DIR.SERVER, "./server.properties"))) {
        confirm(
            "The properties file could not be found. Make sure you ran the server at least once before trying to change the properties.",
            ["Ok"],
            (ans) => { },
        );
        document.querySelector("#Navbar_TopOption").children[0].click();
        setLoad(false);
        return;
    }
    while (document.querySelector("#Properties_Container").children.length > 0) document.querySelector("#Properties_Container").children[0].remove();

    if (!fs.existsSync(path.join(DIR.SERVER, "./server.properties"))) return setLoad(false);

    let props = fs.readFileSync(path.join(DIR.SERVER, "./server.properties"), "utf-8").split("\n");
    props = props.filter(val => val[0] !== "#");
    let dict = {};
    props.forEach(prop => {
        if (prop.split("=")[0] !== "") dict[prop.split("=")[0]] = prop.split("=")[1];
    });

    fs.readFile(path.join(__dirname, "./data/properties_info.json"), "utf-8", (err, text) => {
        if (err) reportErr("read the server properties", err);

        let p = JSON.parse(text).props;
        let omit = JSON.parse(text).omit;
        let layout = [];

        Object.keys(dict).sort().forEach(key => {
            try {
                if (!omit.includes(key)) layout.push({
                    tag: "div",
                    type: p[key] ? p[key].type : "string",
                    namespace: key,
                    class: ["Properties_SubContainer"],
                    children: [
                        {
                            tag: "span",
                            class: ["Properties_TitleText"],
                            content: key.replace(/\.|\-/g, " ").toProperCase(),
                        },
                        { tag: "br", },
                        {
                            tag: "span",
                            class: ["Properties_DescText"],
                            innerHTML: !p[key] ? "No Description Provided" : (() => {
                                if (p[key].desc.split("\n").length > 1) {
                                    let j = p[key].desc.split("\n");
                                    k = `<span>${p[key].desc}</span><ul>`;
                                    j.shift();
                                    j.forEach(c => {
                                        if (c !== "") k += `<li>${c}</li>`
                                    });
                                    k += `</ul>`;
                                    return k;
                                } else {
                                    return p[key].desc;
                                }
                            })(),
                        },
                        { tag: "br", },
                        (() => {
                            if (p[key] == undefined || p[key].type.includes("string")) return {
                                tag: "input",
                                type: "text",
                                value: dict[key],
                            }
                            if (p[key].type.includes("boolean")) return {
                                tag: "input",
                                type: "checkbox",
                                checked: dict[key] == "true",
                                class: ["PropCheckbox"],
                            };

                            if (p[key].type.includes("int")) return {
                                tag: "input",
                                type: "number",
                                value: dict[key].replace(/\s/g, ""),
                                min: p[key].min ? p[key].min.toString() : null,
                                max: p[key].max ? p[key].max.toString() : null,
                                id: `__${key}`,
                                oninput: () => {
                                    if (p[key].max != undefined && window.parseInt(document.querySelector(`#__${key}`).value) > p[key].max) document.querySelector(`#__${key}`).value = p[key].max;
                                    if (p[key].min != undefined && window.parseInt(document.querySelector(`#__${key}`).value) < p[key].min) document.querySelector(`#__${key}`).value = p[key].min;
                                },
                            }
                            if (p[key].type.includes("option")) return {
                                tag: "select",
                                children: p[key].options.map(j => ({
                                    tag: "option",
                                    content: j,
                                    selected: j.toLowerCase().replace(/\s/g, "") === dict[key].toLowerCase().replace(/\s/g, ""),
                                })),
                            }
                            return {
                                tag: "input",
                                type: "text",
                            };
                        })(),
                    ],
                });
            } catch (e) {
                console.log(key, e);
            }
        });
        createLayout(layout, document.querySelector("#Properties_Container"));
    });
    setLoad(false);
};
document.querySelector("#Properties_Save").onclick = () => {
    checkOpen(result => {
        if (!result) {
            confirm(
                "Are you sure you want to save these changes?",
                ["Yes", "Cancel"],
                (ans) => {
                    if (ans === 0) {
                        try {
                            setLoad(true, "Saving Changes");
                            dict = {};
                            Array.from(document.querySelector("#Properties_Container").children).forEach(c => {
                                if (c.type.includes("int")) {
                                    dict[c.namespace] = c.querySelector("input").value.toString();
                                } else if (c.type.includes("boolean")) {
                                    dict[c.namespace] = c.querySelector("input").checked.toString();
                                } else if (c.type.includes("option")) {
                                    dict[c.namespace] = c.querySelector("select").value.toLowerCase();
                                } else {
                                    dict[c.namespace] = c.querySelector("input").value.toString();
                                }
                            });

                            let props = fs.readFileSync(path.join(DIR.SERVER, "./server.properties"), "utf-8").split("\n");
                            let dict2 = {};
                            props.forEach(prop => {
                                if (prop.split("=")[0] !== "") dict2[prop.split("=")[0]] = prop.split("=")[1];
                            });

                            let comb = Object.assign(dict2, dict);
                            let output = "";
                            Object.keys(comb).forEach(key => {
                                if (comb[key] === undefined) output += `${key}\n`;
                                else output += `${key}=${comb[key]}\n`;
                            });

                            fs.writeFileSync(path.join(DIR.SERVER, "./server.properties"), output);
                        } catch (e) {
                            document.querySelector("#Navbar_TopOption").children[0].click();
                            reportErr("saving property changes", e);
                        }
                        setLoad(false);
                    }
                }
            );
        } else {
            confirm(
                "You cannot save new properties while the server is running!",
                ["Ok"],
                (ans) => { },
            );
        }
    });
};
document.querySelector("#Properties_Reset").onclick = () => {
    checkOpen(result => {
        if (!result) {
            confirm(
                "Are you sure you want to reset your server properties?",
                ["Yes", "Cancel"],
                (ans) => {
                    if (ans === 0) {
                        setLoad(true, "Saving Changes");
                        if (!fs.existsSync(path.join(DIR.SERVER, "default_server.properties"))) {
                            confirm("The default properties file is missing.", ["Ok"], (ans) => { });
                        } else {
                            fs.copyFileSync(path.join(DIR.SERVER, "default_server.properties"), path.join(DIR.SERVER, "server.properties"));
                        }
                        setLoad(false);
                    }
                }
            );
        } else {
            confirm(
                "You cannot reset the properties while the server is running!",
                ["Ok"],
                (ans) => { },
            );
        }
    });
};