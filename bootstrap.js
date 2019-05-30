let files = new Map();
let links = new Map();
let components = [];
let parser = new DOMParser();

window.request = (imports) => {

    for (let link of imports) {

        if (files.has(link.href)) {

            let searchElement = files.get(link.href);

            let indexOf = Array.from(components).indexOf(searchElement);
            if (indexOf > -1) {
                components.splice(indexOf, 1);
            }

            components.push(searchElement);

            let imports = searchElement.querySelectorAll("link[rel=component], link[rel=view]");

            if (imports) {
                request(imports);
            }

        } else {

            let httpRequest = new XMLHttpRequest();

            httpRequest.addEventListener("load", (event) => {

                let response = event.target.responseText;
                let component = parser.parseFromString(response, "text/html");

                let imports = component.querySelectorAll("link[rel=component]");

                files.set(link.href, component);
                links.set(link.href, link);

                components.push(component);

                if (imports) {
                    request(imports);
                }

            });

            httpRequest.open("GET", link.href, false);
            httpRequest.send();

        }


    }



};

request(document.querySelectorAll("link[rel=component], link[rel=view]"));

window.componentProcessor = (component) => {

    if (! component.ready) {
        let head = document.querySelector("head");
        let style = component.querySelector("style");
        if (style) {
            head.appendChild(style);
        }

        let script = component.querySelector("script");
        let template = component.querySelector("template");
        if (template) {
            template.setAttribute("viewtemplate", "");
        }

        window.define = (callback) => {
            callback(template);
            component.ready = true;
        };

        eval(script.innerText);
    }
};

components.reverse().forEach(componentProcessor);

customServices.get("router")
    .loader(links, components);