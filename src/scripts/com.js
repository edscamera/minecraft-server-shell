const createLayout = (data, elmt) => {
    data.forEach(el => {
        if (!el.tag) return;
        let c = document.createElement(el.tag);
        Object.keys(el).forEach(prop => {
            switch (prop) {
                case 'content':
                    c.innerText = el.content;
                    break;
                case 'style':
                    Object.assign(c.style, el.style);
                    break;
                case 'class':
                    el.class.forEach(cl => c.classList.add(cl));
                    break;
                case 'children':
                    createLayout(el.children, c);
                    break;
                default:
                    c[prop] = el[prop];
                    break;
            }
        });
        elmt.appendChild(c);
    });
};


const openExternal = (url) => require("electron").shell.openExternal(url);
Array.from(document.getElementsByClassName("ExternalLink")).forEach(c => { c.onclick = () => openExternal(c.getAttribute("url")) });