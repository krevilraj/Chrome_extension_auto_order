// No background logic needed for now
let sessionCheckHeaders = null;

// Intercept sessionCheck API calls
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.url.includes('/tmsapi/dnaApi/exchange/sessionCheck')) {
            sessionCheckHeaders = details.requestHeaders;
            // Notify the content script that we have the headers
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "sessionCheckHeaders",
                        headers: sessionCheckHeaders
                    });
                }
            });
        }
    },
    { urls: ['*://tms44.nepsetms.com.np/*'] },
    ['requestHeaders', 'extraHeaders']
);

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureSessionCheckHeaders") {
        sessionCheckHeaders = null; // Reset
        sendResponse({success: true});
        return true;
    }

    if (request.action === "getSessionCheckHeaders") {
        sendResponse({headers: sessionCheckHeaders});
        return true;
    }
});