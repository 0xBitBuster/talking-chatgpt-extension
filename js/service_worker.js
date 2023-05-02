const defaultSettings = {
    stt: {
        language_code: "en-US",
        auto_send: false,
    },
    tts: {
        enabled: false,
        language_code: "en-US",
        speed: 1
    }
}

const getStorageData = (key) =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.get(key, (result) =>
            chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve(result)
        )
    );

const setStorageData = (data) =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.set(data, () =>
            chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve()
        )
    );

async function processRequest(req) {
    const payload = req.payload || {};

    let response = false;
    if (req.mode === "set") await setStorageData({ [payload.name]: payload.value })
    if (req.mode === "get") response = await getStorageData(payload.name)
    return response;
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    processRequest(req).then(sendResponse);
    return true;
});

chrome.runtime.onInstalled.addListener(async function() {
    await setStorageData({ "settings": defaultSettings })
});
