const CHAT_TEXTAREA_SELECTOR = "#prompt-textarea";

let chat_textarea = document.querySelector(CHAT_TEXTAREA_SELECTOR) || null;
let chat_container = chat_textarea?.parentElement;
let chat_submitBtn = chat_container?.parentElement?.children ? [...chat_container.parentElement.children].find((el) => el.tagName === "BUTTON") : null;
let speechRecognition = null;
let speechRecognizing = false;
let checkWritingInterval = null;
let ssInstance = null; // ! Keep global instance to not get garbage collected !
let browserSupports = {
    speechToText: true
};
let appSettings = {
    stt: {
        language_code: "en-US",
        auto_send: false,
    }
};


// ! Has to be anything but button !
const sttBtnHTML = `
<a id="chatgpt-stt-btn" class="absolute rounded-md text-gray-500 hover:bg-gray-700 dark:hover:text-gray-400 dark:hover:bg-gray-900 cursor-pointer top-1/2 -translate-y-1/2" style="right: 3.2rem; padding: 6px 8px">
<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="12px" height="18px" viewBox="0 0 13 19" version="1.1"><g id="surface1"><path style=" stroke:none;fill-rule:nonzero;fill:rgb(185,179,170);fill-opacity:1;" d="M 6.5 12.902344 C 8.460938 12.902344 10.042969 11.382812 10.042969 9.5 L 10.042969 3.832031 C 10.042969 1.949219 8.460938 0.433594 6.5 0.433594 C 4.539062 0.433594 2.957031 1.949219 2.957031 3.832031 L 2.957031 9.5 C 2.957031 11.382812 4.539062 12.902344 6.5 12.902344 Z M 12.410156 7.234375 L 11.820312 7.234375 C 11.496094 7.234375 11.234375 7.484375 11.234375 7.800781 L 11.234375 9.5 C 11.234375 12.152344 8.847656 14.277344 6.03125 14.015625 C 3.574219 13.78125 1.765625 11.664062 1.765625 9.296875 L 1.765625 7.800781 C 1.765625 7.484375 1.503906 7.234375 1.179688 7.234375 L 0.589844 7.234375 C 0.265625 7.234375 0 7.484375 0 7.800781 L 0 9.214844 C 0 12.394531 2.355469 15.226562 5.617188 15.664062 L 5.617188 16.867188 L 3.542969 16.867188 C 3.21875 16.867188 2.957031 17.121094 2.957031 17.433594 L 2.957031 18 C 2.957031 18.316406 3.21875 18.566406 3.542969 18.566406 L 9.457031 18.566406 C 9.78125 18.566406 10.042969 18.316406 10.042969 18 L 10.042969 17.433594 C 10.042969 17.121094 9.78125 16.867188 9.457031 16.867188 L 7.382812 16.867188 L 7.382812 15.671875 C 10.550781 15.257812 13 12.648438 13 9.5 L 13 7.800781 C 13 7.484375 12.734375 7.234375 12.410156 7.234375 Z M 12.410156 7.234375 "/></g></svg>
</a>
`;


/*************/
/* FUNCTIONS */
/*************/
/**
 * Starts or stops STT
 */
function toggleSTT() {
    if (speechRecognizing) {
        speechRecognition.stop();
        return;
    }

    let final_translation = "";
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = appSettings.stt.language_code;
    speechRecognition.interimResults = true;

    speechRecognition.onstart = () => {
        speechRecognizing = true;
        toggleIcon();
    };

    speechRecognition.onspeechend = () => {
        speechRecognition.stop();
    };

    speechRecognition.onend = () => {
        chat_textarea.textContent = final_translation;
        speechRecognizing = false;
        toggleIcon();

        if (final_translation !== "") 
            chat_submitBtn.disabled = false;
        if (appSettings.stt.auto_send) 
            chat_submitBtn.click();
    };

    speechRecognition.onresult = (event) => {
        let interim_translation = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_translation += event.results[i][0].transcript;
            } else {
                interim_translation += event.results[i][0].transcript;
                chat_textarea.textContent = interim_translation;
            }
        }
    };

    speechRecognition.start();
}

/**
 * Toggles the extension's STT button
 */
function toggleIcon() {
    const btn = document.getElementById("chatgpt-stt-btn");

    btn.innerHTML = speechRecognizing
        ? '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="16" height="16"><path d="M445.098 382.67c0-8.71-2.903-15.97-8.711-22.502l-100.9-103.079L438.566 156.19c6.532-5.807 9.435-13.792 9.435-22.503s-2.901-15.971-8.71-22.503L405.174 76.34c-5.808-6.533-13.792-9.437-22.504-9.437s-15.969 2.903-22.503 8.711l-103.077 100.9-100.9-103.078C150.382 66.903 142.396 64 133.687 64s-15.971 2.903-22.505 8.711L76.34 106.828c-6.533 5.808-9.437 13.792-9.437 22.503s2.903 15.97 8.711 22.504l100.899 103.078L73.436 355.812C66.903 361.62 64 369.605 64 378.315s2.903 15.97 8.71 22.502l34.119 34.844c5.806 6.534 13.79 9.438 22.502 9.438s15.971-2.903 22.504-8.712l103.077-100.9 100.9 103.08c5.808 6.532 13.792 9.434 22.503 9.434s15.971-2.901 22.503-8.71l34.843-34.116c5.807-6.535 9.437-13.794 9.437-22.505z" fill="#9d9dad"/></svg>'
        : '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="12px" height="18px" viewBox="0 0 13 19" version="1.1"><g id="surface1"><path style=" stroke:none;fill-rule:nonzero;fill:rgb(185,179,170);fill-opacity:1;" d="M 6.5 12.902344 C 8.460938 12.902344 10.042969 11.382812 10.042969 9.5 L 10.042969 3.832031 C 10.042969 1.949219 8.460938 0.433594 6.5 0.433594 C 4.539062 0.433594 2.957031 1.949219 2.957031 3.832031 L 2.957031 9.5 C 2.957031 11.382812 4.539062 12.902344 6.5 12.902344 Z M 12.410156 7.234375 L 11.820312 7.234375 C 11.496094 7.234375 11.234375 7.484375 11.234375 7.800781 L 11.234375 9.5 C 11.234375 12.152344 8.847656 14.277344 6.03125 14.015625 C 3.574219 13.78125 1.765625 11.664062 1.765625 9.296875 L 1.765625 7.800781 C 1.765625 7.484375 1.503906 7.234375 1.179688 7.234375 L 0.589844 7.234375 C 0.265625 7.234375 0 7.484375 0 7.800781 L 0 9.214844 C 0 12.394531 2.355469 15.226562 5.617188 15.664062 L 5.617188 16.867188 L 3.542969 16.867188 C 3.21875 16.867188 2.957031 17.121094 2.957031 17.433594 L 2.957031 18 C 2.957031 18.316406 3.21875 18.566406 3.542969 18.566406 L 9.457031 18.566406 C 9.78125 18.566406 10.042969 18.316406 10.042969 18 L 10.042969 17.433594 C 10.042969 17.121094 9.78125 16.867188 9.457031 16.867188 L 7.382812 16.867188 L 7.382812 15.671875 C 10.550781 15.257812 13 12.648438 13 9.5 L 13 7.800781 C 13 7.484375 12.734375 7.234375 12.410156 7.234375 Z M 12.410156 7.234375 "/></g></svg>';
}

/**
 * Check if textarea and submit button is visible, if yes, inject our button
 */
function checkIfVisible() {
    if (!document.getElementById("chatgpt-stt-btn")) {
        chat_textarea = document.querySelector(CHAT_TEXTAREA_SELECTOR) || null;
        chat_container = chat_textarea?.parentElement;
        chat_submitBtn = chat_container?.parentElement?.parentElement?.querySelector('button') || null;

        chat_textarea?.style.setProperty("padding-right", "4rem");
        chat_container?.insertAdjacentHTML("beforeend", sttBtnHTML);

        const sttBtn = document.getElementById("chatgpt-stt-btn") 
        sttBtn?.removeEventListener("click", toggleSTT)
        sttBtn?.addEventListener("click", toggleSTT)
    }
}

/**
 * Posts a message to the current window to the content script to receive the settings
 */
function sendGetSettingsMsg() {
    window.postMessage(
        {
            type: "chatgpt-client",
            name: "settings",
        },
        "*"
    );
}

/**
 * Handles any window messages from only our extension
 */
function handleWindowMessage(event) {
    const { source, data } = event;

    // We only accept messages from ourselves
    if (source !== window) return;
    if (!data.type || data.type !== "chatgpt-server") return;

    if (data.name === "settings") {
        appSettings = { ...appSettings, ...data.value };
    }
}

/**
 * Await a timeout to avoid callback mess
 */
function awaitTimeout(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

/*************************/
/* CHECK BROWSER SUPPORT */
/*************************/
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    browserSupports.speechToText = false;
    alert("ChatGPT Speech-To-Text: Your browser does not support speech recognition. Please update your browser.");
}

/*********************/
/* SETUP & LISTENERS */
/*********************/
window.addEventListener("message", handleWindowMessage, false);

if (browserSupports.speechToText) {
    setInterval(checkIfVisible, 500); // ! Has to be an interval due to next.js dynamic rerendering !
}

sendGetSettingsMsg();
