const script = document.createElement('script');
script.src = chrome.runtime.getURL('interception.js');
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === "REQUEST_CAPTURED") {
        chrome.runtime.sendMessage({
            action: "recordRequest",
            data: event.data.data
        });
    }
});