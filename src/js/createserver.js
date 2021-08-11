const download = require("download");
const resizeImg = require("resize-img");

document.querySelector("#CreateServer_JAR").onchange = () => {
    let dropval = document.querySelector("#CreateServer_JAR").value;
    Array.from(document.getElementsByClassName("CreateServer_PaperDesc")).forEach(c => c.style.display = (dropval === "Paper" ? "block" : "none"));
    Array.from(document.getElementsByClassName("CreateServer_VanillaDesc")).forEach(c => c.style.display = (dropval === "Vanilla" ? "block" : "none"));
    Array.from(document.getElementsByClassName("CreateServer_CustomDesc")).forEach(c => c.style.display = (dropval === "Custom" ? "block" : "none"));
};
document.querySelector("#CreateServer_JAR").onchange();

document.querySelector("#CreateServer_PaperVerDrop").addEventListener("change", () => {
    setLoad(true, "Fetching Data");
    let sererver = document.querySelector("#CreateServer_PaperVerDrop").value.split(" ")[0];
    while (document.querySelector("#CreateServer_PaperBuiDrop").children.length > 0) document.querySelector("#CreateServer_PaperBuiDrop").children[0].remove();
    window.fetch(`https://papermc.io/api/v2/projects/paper/versions/${sererver}`).then(r => r.json()).then(data2 => {
        data2.builds.reverse().forEach(bui => {
            let c = Object.assign(document.createElement("option"), {
                innerText: bui,
            });
            document.querySelector("#CreateServer_PaperBuiDrop").appendChild(c);
        });
        setLoad(false);
    });
});

let eulaCheckBox = document.querySelector("#CreateServer_EULA");
document.querySelector("#CreateServer_EULAText").onclick = () => eulaCheckBox.click();
eulaCheckBox.onchange = () => document.querySelector("#CreateServer_CreateButton").setAttribute("disabled", !eulaCheckBox.checked);
eulaCheckBox.onchange();

const slider = document.querySelector("#CreateServer_Memory");
slider.max = Math.floor(os.totalmem() / 1024 / 1024 / 1024);
slider.oninput = () => document.querySelector("#CreateServer_MemoryIndicator").innerText = `${slider.value} GB`;

document.querySelector("#CreateServer_CreateButton").onclick = () => {
    const reterr = () => {
        setLoad(true, "Aborting");
        if (fs.existsSync(DIR.SERVER)) fs.rmdirSync(DIR.SERVER, { recursive: true, });
        DIR.SERVER = null;
        setPanel("ServerSelect");
        setLoad(false);
    };
    const serverName = document.querySelector("#CreateServer_Name").value;

    if (/\/|\\|:|\*|\?|<|>|\|/g.test(serverName)) {
        dialog.showMessageBoxSync(null, {
            type: "error",
            title: "Minecraft Server Shell",
            message: "A server name can't contain any of the following characters: \n\n/ \\ : * ? < > |",
        });
        return;
    }
    if ([null, undefined, ""].includes(serverName) || serverName.replace(/\s/g, "").length === 0) {
        dialog.showMessageBoxSync(null, {
            type: "error",
            title: "Minecraft Server Shell",
            message: "A server name can't be empty.",
        });
        return;
    }

    if (dialog.showMessageBoxSync(null, {
        type: "question",
        title: "Minecraft Server Shell",
        buttons: ["Yes", "Cancel"],
        message: `Do you really want to create the server "${serverName}" with these settings? The settings can be changed afterwards.`,
    }) === 1) return;

    setLoad(true, "Creating Your Server");

    try {
        fs.mkdirSync(path.join(DIR.SERVERS, serverName));
    } catch (e) {
        reterr();
        return reportErr("create the server folder", e);
    }
    DIR.SERVER = path.join(DIR.SERVERS, serverName);

    try {
        fs.writeFileSync(path.join(DIR.SERVER, "./eula.txt"), "eula=true");
    } catch (e) {
        reterr();
        return reportErr("accepting the EULA", e);
    }
    try {
        if (os.platform() === "win32") {
            fs.writeFileSync(path.join(DIR.SERVER, "./start.bat"), `cls\njava -Xms512M -Xmx${document.querySelector("#CreateServer_Memory").value}G -jar server.jar --nogui`);
        } else {
            fs.writeFileSync(path.join(DIR.SERVER, "./start.sh"), `clear\nexec java -Xms512M -Xmx${document.querySelector("#CreateServer_Memory").value}G -jar server.jar --nogui`);
        }
    } catch (e) {
        reterr();
        return reportErr("creating the start script", e);
    }

    try {
        if (document.querySelector("#CreateServer_JAR").value === "Paper") {

            fs.copyFileSync(path.join(__dirname, "./data/default_paper.properties"), path.join(DIR.SERVER, "server.properties"));
            fs.copyFileSync(path.join(__dirname, "./data/default_paper.properties"), path.join(DIR.SERVER, "default_server.properties"));
        }
        if (document.querySelector("#CreateServer_JAR").value === "Vanilla") {
            fs.copyFileSync(path.join(__dirname, "./data/default_vanilla.properties"), path.join(DIR.SERVER, "server.properties"));
            fs.copyFileSync(path.join(__dirname, "./data/default_vanilla.properties"), path.join(DIR.SERVER, "default_server.properties"));
        }
    } catch (e) {
        reterr();
        return reportErr("copying the default properties", e);
    }

    try {
        fs.writeFileSync(path.join(DIR.SERVER, "./meta.json"), JSON.stringify({
            name: serverName,
            core: document.querySelector("#CreateServer_JAR").value,
            memory: document.querySelector("#CreateServer_Memory").value,
        }));
    } catch (e) {
        reterr();
        return reportErr("writing metadata", e);
    }

    try {
        (async () => {
            if (document.querySelector("#CreateServer_Image").files.length > 0) {
                const image = document.querySelector("#CreateServer_Image").files[0];
                fs.copyFileSync(image.path, path.join(DIR.SERVER, "./server-icon-0.png"));

                let pathi = fs.readFileSync(path.join(DIR.SERVER, "./server-icon-0.png"));
                const img2 = await resizeImg(Buffer.from(pathi), {
                    width: 64,
                    height: 64,
                    format: "png",
                });

                fs.writeFileSync(path.join(DIR.SERVER, "server-icon.png"), img2);
            }
        })();
    } catch (e) {
        reterr();
        return reportErr("resizing the server image", e);
    }

    (async () => {
        try {
            if (document.querySelector("#CreateServer_JAR").value === "Paper") {
                const version = document.querySelector("#CreateServer_PaperVerDrop").value.split(" ")[0];
                const build = document.querySelector("#CreateServer_PaperBuiDrop").value.split(" ")[0];
                const link = `https://papermc.io/api/v2/projects/paper/versions/${version}/builds/${build}/downloads/paper-${version}-${build}.jar`;
                fs.writeFileSync(path.join(DIR.SERVER, "./server.jar"), await download(link));

                setLoad(false);
                setPanel("ServerSelect");
                DIR.SERVER = null;
            } else if (document.querySelector("#CreateServer_JAR").value === "Vanilla") {
                const r = await (window.fetch(document.querySelector("#CreateServer_VanillaBuiDrop").value));
                data = await r.json();
                const link = data.downloads.server.url;
                fs.writeFileSync(
                    path.join(DIR.SERVER, "./server.jar"),
                    await download(link)
                );

                setLoad(false);
                setPanel("ServerSelect");
                DIR.SERVER = null;
            } else if (document.querySelector("#CreateServer_JAR").value === "Custom") {
                fs.copyFile(document.querySelector("#CreateServer_CustomJAR").files[0].path, path.join(DIR.SERVER, "./server.jar"));

                setLoad(false);
                setPanel("ServerSelect");
                DIR.SERVER = null;
            } else {
                reterr();
                return reportErr("finding JAR type", "");
            }
        } catch (e) {
            reterr();
            return reportErr("downloading the JAR", e);
        }
    })();
};

document.querySelector("#CreateServer_GoBack").onclick = () => setPanel('ServerSelect');