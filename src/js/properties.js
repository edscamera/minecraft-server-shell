String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};
const openProps = () => {
    let props = fs.readFileSync(path.join(DIR.SERVER, "./server.properties"), "utf-8").split("\n");
    props = props.filter(val => val[0] !== "#");
    let dict = {};
    props.forEach(prop => {
        if (prop.split("=")[0] !== "") dict[prop.split("=")[0]] = prop.split("=")[1];
    });

    fs.readFile(path.join(process.cwd(), "./src/properties_info.json"), "utf-8", (err, text) => {
        let p = JSON.parse(text).props;
        let omit = JSON.parse(text).omit;
        let layout = [];

        Object.keys(dict).forEach(key => {
            if (!omit.includes(key)) layout.push({
                tag: "div",
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
                        if (p[key].type.includes("boolean")) return {
                            tag: "input",
                            type: "checkbox",
                            checked: dict[key],
                            class: ["PropCheckbox"],
                        };
                        if (p[key].type.includes("string")) return {
                            tag: "input",
                            type: "text",
                            value: dict[key],
                        }
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
        });
        createLayout(layout, document.querySelector("#Properties_Container"));
    });
};