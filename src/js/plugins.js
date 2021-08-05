const clickPlugins = () => {
    setLoad(true, "Loading Plugins");

    if (!fs.existsSync(path.join(DIR.SERVER, "./plugins/"))) fs.mkdirSync(path.join(DIR.SERVER, "./plugins/"));

    let plugins = fs.readdirSync(path.join(DIR.SERVER, "./plugins/"), { withFileTypes: true, })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => name.endsWith(".jar"));

    const pluginsTable = document.querySelector("#Plugins_PluginTable");
    while (pluginsTable.children.length > 0) pluginsTable.children[0].remove();

    if (plugins.length === 0) {
        pluginsTable.innerHTML = "<div>There are no plugins installed!</div>";
    }

    createLayout(plugins.map(plugin => ({
        tag: "tr",
        children: [
            {
                tag: "td",
                content: "📄",
                style: { float: "left", },
            },
            {
                tag: "td",
                content: plugin.replace(/\.jar/g, ""),
                style: { float: "left", },
            },
            {
                tag: "div",
                style: { float: "right", },
                children: [
                    {
                        tag: "td",
                        content: "Deactivate",
                        style: { paddingRight: "10px", },
                        class: ["ServerSelect_DeleteAction"],
                        onclick: () => toggleActive(plugin, true),
                    },
                    {
                        tag: "td",
                        content: "Delete",
                        class: ["ServerSelect_DeleteAction"],
                        onclick: () => deleteActive(dir.name, true),
                    }
                ],
            }
        ],
    })), pluginsTable);
    setLoad(false);
};

const toggleActive = (plugin, active) => {

};
const deleteActive = (plugin, active) => {

};