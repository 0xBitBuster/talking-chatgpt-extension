/*************/
/* FUNCTIONS */
/*************/
function importScript(src) {
    let s = document.createElement("script");
    s.src = chrome.runtime.getURL(src);
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

function sendWorkerMessage(mode, payload) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage({ mode, payload }, (data) => resolve(data));
        } catch (error) {
            reject(error)
        }
    })
}

async function handleWindowMessage(event) {
    const { source, data } = event

    // We only accept messages from ourselves
    if (source !== window) return;
    if (!data.type || data.type !== "chatgpt-stt-client") return;

    if (data.name === "settings") {
        const savedSettings = await sendWorkerMessage('get', { name: 'settings' })

        window.postMessage({ 
            type: "chatgpt-stt-server", 
            name: "settings",
            value: savedSettings.settings
        }, "*");
    }
}

/*******************/
/* EVENT LISTENERS */
/*******************/
window.addEventListener("message", handleWindowMessage, false);

/***********/
/* IMPORTS */
/***********/
importScript("js/chatgpt-stt.js");
