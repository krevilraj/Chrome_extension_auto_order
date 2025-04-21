const connections = {};

// Handle DevTools connections
chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "devtools-page") return;

    let tabId;

    port.onMessage.addListener((message) => {
        if (message.name === "init") {
            tabId = message.tabId;
            connections[tabId] = port;

            // Clean up when tab closes
            port.onDisconnect.addListener(() => {
                delete connections[tabId];
            });
        }
    });
});

// Capture requests
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.method === 'GET' && details.type === 'image') return;

        const tabId = details.tabId;
        if (!connections[tabId]) return;

        const request = {
            url: details.url,
            method: details.method,
            type: details.type,
            timestamp: new Date().toISOString(),
            payload: decodeRequestBody(details.requestBody),
            tabId: tabId
        };

        connections[tabId].postMessage({
            type: "request",
            tabId: tabId,
            data: request
        });
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
);

// Capture responses
chrome.webRequest.onCompleted.addListener(
    (details) => {
        const tabId = details.tabId;
        if (!connections[tabId]) return;

        connections[tabId].postMessage({
            type: "response",
            tabId: tabId,
            data: {
                requestId: details.requestId,
                status: details.statusCode,
                statusText: details.statusLine
            }
        });
    },
    { urls: ["<all_urls>"] }
);

function decodeRequestBody(requestBody) {
    if (!requestBody) return null;

    try {
        if (requestBody.raw) {
            return String.fromCharCode.apply(
                null,
                new Uint8Array(requestBody.raw[0].bytes)
            );
        }
        if (requestBody.formData) return JSON.stringify(requestBody.formData);
    } catch (e) {
        console.error("Error decoding request body:", e);
    }
    return null;
}