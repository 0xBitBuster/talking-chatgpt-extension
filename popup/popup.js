const stt_container = document.getElementById("stt-container")
const all_tab_buttons = document.querySelectorAll("#tabs-container button")
const select_stt_language = document.getElementById("select_stt-language");
const checkbox_stt_autosend = document.getElementById("checkbox_stt-autosend")

const languages = [
    ["Afrikaans", "af-ZA"],
    ["عربي", "ar"],
    ["Bahasa Indonesia", "id-ID"],
    ["Bahasa Melayu", "ms-MY"],
    ["Català", "ca-ES"],
    ["Čeština", "cs-CZ"],
    ["Deutsch", "de-DE"],
    ["English (Australia)", "en-AU"],
    ["English (Canada)", "en-CA"],
    ["English (India)", "en-IN"],
    ["English (New Zealand)", "en-NZ"],
    ["English (South Africa)", "en-ZA"],
    ["English (United Kingdom)", "en-GB"],
    ["English (United States)", "en-US"],
    ["Español (Argentina)", "es-AR"],
    ["Español (Bolivia)", "es-BO"],
    ["Español (Chile)", "es-CL"],
    ["Español (Columbia)", "es-CO"],
    ["Español (Costa Rica)", "es-CR"],
    ["Español (Ecuador)", "es-EC"],
    ["Español (El Salvador)", "es-SV"],
    ["Español (España)", "es-ES"],
    ["Español (Estados Unidos)", "es-US"],
    ["Español (Guatemala)", "es-GT"],
    ["Español (Honduras)", "es-HN"],
    ["Español (México)", "es-MX"],
    ["Español (Nicaragua)", "es-NI"],
    ["Español (Panamá)", "es-PA"],
    ["Español (Paraguay)", "es-PY"],
    ["Español (Perú)", "es-PE"],
    ["Español (Puerto Rico)", "es-PR"],
    ["Español (República Dominicana)", "es-DO"],
    ["Español (Uruguay)", "es-UY"],
    ["Español (Venezuela)", "es-VE"],
    ["Euskara", "eu-ES"],
    ["Français", "fr-FR"],
    ["Galego", "gl-ES"],
    ["Hrvatski", "hr_HR"],
    ["IsiZulu", "zu-ZA"],
    ["Íslenska", "is-IS"],
    ["Italiano (Italia)", "is-IT"],
    ["Italiano (Svizzeria)", "is-CH"],
    ["Magyar", "hu-HU"],
    ["Nederlands", "nl-NL"],
    ["Norsk bokmål", "nb-NO"],
    ["Polski", "pl-PL"],
    ["Português (Brasil)", "pt-BR"],
    ["Português (Portugal)", "pt-PT"],
    ["Română", "ro-RO"],
    ["Slovenčina", "sk-SK"],
    ["Suomi", "fi-FI"],
    ["Svenska", "sv-SE"],
    ["Türkçe", "tr-TR"],
    ["български", "bg-BG"],
    ["Pусский", "ru-RU"],
    ["Српски", "sr-RS"],
    ["한국어", "ko-KR"],
    ["中文 (普通话 (中国大陆))", "cmn-Hans-CN"],
    ["中文 (普通话 (香港))", "cmn-Hans-HK"],
    ["中文 (中文 (台灣))", "cmn-Hans-TW"],
    ["中文 (粵語 (香港))", "yue-Hant-HK"],
    ["日本語", "ja-JP"],
    ["Lingua latīna", "la"],
];
let selectedTabIndex = 0;
let appSettings = {
    stt: {
        language_code: "en-US",
        auto_send: false,
    }
}

/*************/
/* FUNCTIONS */
/*************/
function sendWorkerMessage(mode, payload) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage({ mode, payload }, (data) => resolve(data));
        } catch (error) {
            reject(error)
        }
    })
}

async function loadSettings() {
    const { settings } = await sendWorkerMessage('get', { name: 'settings' })
    appSettings = { ...appSettings, ...settings }

    select_stt_language.selectedIndex = languages.findIndex(arr => arr[1] === settings.stt.language_code);
    checkbox_stt_autosend.checked = settings.stt.auto_send
}

async function changeSettings(newSettings) {
    appSettings = {
        ...appSettings,
        ...newSettings
    }

    await sendWorkerMessage('set', { 
        name: 'settings', 
        value: appSettings
    })
}

/*****************/
/* INITALIZATION */
/*****************/
for (let i = 0; i < languages.length; i++) {
    select_stt_language.options[i] = new Option(languages[i][0], i);
}

loadSettings()

/*******************/
/* EVENT LISTENERS */
/*******************/
select_stt_language.addEventListener("change", async() => {
    const selectedLanguage = languages[select_stt_language.selectedIndex][1]

    await changeSettings({
        stt: {
            ...appSettings.stt,
            language_code: selectedLanguage,
        }
    })
});

checkbox_stt_autosend.addEventListener("change", async(e) => {
    const checkedAutoSend = e.currentTarget.checked

    await changeSettings({
        stt: {
            ...appSettings.stt,
            auto_send: checkedAutoSend,
        }
    })
});

all_tab_buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
        if (selectedTabIndex === i) return;
        
        all_tab_buttons[selectedTabIndex].classList.remove("selected")
        document.querySelector(`div[data-id="container-${selectedTabIndex}"]`).classList.add("hidden")

        all_tab_buttons[i].classList.add("selected")
        document.querySelector(`div[data-id="container-${i}"]`).classList.remove("hidden")

        selectedTabIndex = i
    })
})
