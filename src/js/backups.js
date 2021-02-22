const getSize = require("get-folder-size");

const clickBackups = () => {
    setLoad(true, "Reading Directory");
    if (!fs.existsSync(path.join(DIR.SERVER, "./backups/"))) fs.mkdirSync(path.join(DIR.SERVER, "./backups/"));
    while (document.querySelector("#Backups_Table").children.length > 0) document.querySelector("#Backups_Table").children[0].remove();
    let dirs = fs.readdirSync(DIR.SERVER, { withFileTypes: true, });
    let omit = [".console_history", "backups", "bukkit.yml", "cache", "eula.txt", "help.yml", "paper.yml", "permissions.yml", "server-icon-0.png", "default_server.properties", "start.bat", "spigot.yml", "usercache.json", "version_history.json", "commands.yml"];
    let defaultsave = ["world", "world_nether", "world_the_end", "server.properties"];
    let layout = [];
    dirs.forEach(dir => {
        if (!omit.includes(dir.name)) layout.push({
            tag: "tr",
            children: [
                {
                    tag: "input",
                    type: "checkbox",
                    style: { float: "left", },
                    checked: defaultsave.includes(dir.name),
                },
                {
                    tag: "td",
                    content: dir.isDirectory() ? "📁" : "📄",
                    style: { float: "left", },
                },
                {
                    tag: "td",
                    content: dir.name,
                    style: { float: "left", },
                },
                {
                    tag: "td",
                    id: `___${dir.name}`,
                    content: (() => {
                        if (dir.isDirectory()) {
                            getSize(path.join(DIR.SERVER, dir.name), (err, size) => {
                                document.querySelector(`#___${dir.name}`).innerText = `${Math.ceil(size / 1024)}KB`;
                                if (Math.ceil(size / 1024) > 1024) document.querySelector(`#___${dir.name}`).innerText = `${Math.ceil(size / 1024 / 1024)}MB`;
                                if (Math.ceil(size / 1024 / 1024) > 1024) document.querySelector(`#___${dir.name}`).innerText = `${Math.ceil(size / 1024 / 1024 / 1024)}GB`;
                            });
                            return "";
                        } else {
                            let size = fs.statSync(path.join(DIR.SERVER, dir.name)).size;
                            if (size / 1024 > 1024) return `${Math.ceil(size / 1024 / 1024)}MB`;
                            return `${Math.ceil(size / 1024)}KB`;
                        }
                    })(),
                    style: { float: "right", },
                }
            ],
            style: {
                paddingBottom: "15px",
            }
        })
    });
    createLayout(layout, document.querySelector("#Backups_Table"));

    dirs = fs.readdirSync(path.join(DIR.SERVER, "./backups/"), { withFileTypes: true, });
    while (document.querySelector("#Backups_Table2").children.length > 0) document.querySelector("#Backups_Table2").children[0].remove();
    createLayout(dirs.map(dir => ({
        tag: "tr",
        children: [
            {
                tag: "td",
                content: dir.name,
                style: { paddingRight: "15px", },
            },
            {
                tag: "td",
                id: `____${dir.name}`,
                content: (() => {
                    getSize(path.join(DIR.SERVER, "./backups/", dir.name), (err, size) => {
                        document.querySelector(`#____${dir.name}`).innerText = `${Math.ceil(size / 1024)}KB`;
                        if (Math.ceil(size / 1024) > 1024) document.querySelector(`#____${dir.name}`).innerText = `${Math.ceil(size / 1024 / 1024)}MB`;
                        if (Math.ceil(size / 1024 / 1024) > 1024) document.querySelector(`#____${dir.name}`).innerText = `${Math.ceil(size / 1024 / 1024 / 1024)}GB`;
                    });
                    return "";
                })(),
            },
            {
                tag: "div",
                style: { float: "right", },
                children: [
                    {
                        tag: "td",
                        content: "Restore",
                        style: { paddingRight: "10px", },
                        class: ["ServerSelect_OpenAction"],
                        onclick: () => restoreBackup(dir.name),
                    },
                    {
                        tag: "td",
                        content: "Delete",
                        class: ["ServerSelect_DeleteAction"],
                        onclick: () => deleteBackup(dir.name),
                    }
                ],
            }
        ],
    })), document.querySelector("#Backups_Table2"))

    setLoad(false);
};

document.querySelector("#Backups_Backup").onclick = () => {
    setLoad(true, "Creating Backup");
    if (dialog.showMessageBoxSync(null, {
        type: "question",
        title: "Minecraft Server Shell",
        buttons: ["Yes", "Cancel"],
        message: `Do you want to create a backup with these settings?`,
    }) === 1) return;
    let subdirs = fs.readdirSync(path.join(DIR.SERVER, "./backups/"), { withFileTypes: true, })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    let a = new Date();
    let b = `${a.getDate().toString().length === 1 ? "0" + a.getDate().toString() : a.getDate()}-${a.getMonth().toString().length === 1 ? "0" + a.getMonth().toString() : a.getDate()}-${a.getFullYear()}`;


    let count = 0;
    subdirs.map(c => c.substr(0, 10)).forEach(c => {
        if (c === b) count++;
    });

    fs.mkdirSync(path.join(DIR.SERVER, "./backups/", `${b}-${count}`));

    Array.from(document.querySelector("#Backups_Table").children).forEach(c => {
        if (c.children[0].checked) fs.copySync(path.join(DIR.SERVER, c.children[2].innerText), path.join(DIR.SERVER, "./backups/", `${b}-${count}`, c.children[2].innerText));
    });
    dialog.showMessageBoxSync(null, {
        type: "info",
        title: "Minecraft Server Shell",
        message: "Backup created successfully!",
    });
    setLoad(false);
};

const deleteBackup = (backup) => {
    if (dialog.showMessageBoxSync(null, {
        type: "question",
        title: "Minecraft Server Shell",
        buttons: ["Yes", "Cancel"],
        message: `Do you want to delete the backup "${backup}"?`,
    }) === 1) return;
    fs.rmdirSync(path.join(DIR.SERVER, "./backups/", backup), { recursive: true, });
    clickBackups();
};
const restoreBackup = (backup) => {
    if (dialog.showMessageBoxSync(null, {
        type: "question",
        title: "Minecraft Server Shell",
        buttons: ["Yes", "Cancel"],
        message: `Do you want to restore the backup "${backup}"?`,
    }) === 1) return;

    fs.readdirSync(path.join(DIR.SERVER, "./backups/", backup)).forEach(file => {
        fs.copySync(path.join(DIR.SERVER, "./backups/", backup, file), path.join(DIR.SERVER, file));
    });

    clickBackups();
};