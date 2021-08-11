const clickPlugins = () => {
    setLoad(true, "Loading Plugins");

    if (!fs.existsSync(path.join(DIR.SERVER, "./plugins/"))) fs.mkdirSync(path.join(DIR.SERVER, "./plugins/"));

    let plugins = fs.readdirSync(path.join(DIR.SERVER, "./plugins/"), { withFileTypes: true, })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => name.endsWith(".jar"));

    const pluginsTable = document.querySelector("#Plugins_PluginTable");
    while (pluginsTable.children.length > 0) pluginsTable.children[0].remove();

    if (plugins.length === 0) pluginsTable.innerHTML = "<div>There are no plugins installed!</div>";

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
                        content: "Delete",
                        class: ["ServerSelect_DeleteAction"],
                        onclick: () => deletePlugin(plugin),
                    },
                ],
            }
        ],
    })), pluginsTable);
    setLoad(false);
};

const deletePlugin = (plugin) => {
    Opened.file(path.join(DIR.SERVER, "./server.jar"), (err, result) => {
        if (err) throw err;
        if (!result) {
            dialog.showMessageBox(null, {
                type: "question",
                title: "Minecraft Server Shell",
                buttons: ["Yes", "Cancel"],
                message: `Do you really want to delete the plugin "${plugin}"? All backups and data will be gone forever. This action cannot be reversed!`,
            }).then(response => {
                if (response.response === 0) fs.unlink(path.join(DIR.SERVER, "./plugins/", plugin), err => {
                    if (err) console.error(err);
                    clickPlugins();
                });
            });
        } else {
            dialog.showMessageBox(null, {
                type: "error",
                title: "Minecraft Server Shell",
                buttons: ["Ok"],
                message: "You cannot delete a plugin when the server is running!",
            });
        }
    });
};

document.querySelector("#Plugins_Add").onclick = () => {
    Opened.file(path.join(DIR.SERVER, "./server.jar"), (err, result) => {
        if (err) throw err;
        if (!result) {
            let file = dialog.showOpenDialogSync();
            if (!file) return;
            if (!file[0].endsWith(".jar")) return dialog.showMessageBox(null, {
                type: "error",
                title: "Minecraft Server Shell",
                buttons: ["Ok"],
                message: "Plugin files must be .jar files!",
            });
            if (fs.existsSync(path.join(DIR.SERVER, "./plugins/", path.basename(file[0])))) {
                dialog.showMessageBox(null, {
                    type: "question",
                    title: "Minecraft Server Shell",
                    buttons: ["Yes", "Cancel"],
                    message: `A plugin already exists by that name! Do you want to overwrite it?`,
                }).then(response => {
                    if (response.response === 0) {
                        fs.copyFileSync(file[0], path.join(DIR.SERVER, "./plugins/", path.basename(file[0])));
                        clickPlugins();
                    }
                });
            } else {
                fs.copyFileSync(file[0], path.join(DIR.SERVER, "./plugins/", path.basename(file[0])));
                clickPlugins();
            }
        } else {
            dialog.showMessageBox(null, {
                type: "error",
                title: "Minecraft Server Shell",
                buttons: ["Ok"],
                message: "You cannot add a plugin when the server is running!",
            });
        }
    });
}