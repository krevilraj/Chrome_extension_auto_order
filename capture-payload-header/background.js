// Store captured requests
let capturedRequests = [];
const MAX_REQUESTS = 100; // Limit storage

// Listen for web requests
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.method === "POST") {
            try {
                // Capture request body if available
                let requestBody = null;
                if (details.requestBody) {
                    if (details.requestBody.raw) {
                        // Handle raw binary data
                        const rawData = details.requestBody.raw[0].bytes;
                        const decoder = new TextDecoder("utf-8");
                        requestBody = decoder.decode(rawData);
                        try {
                            // Try to parse it as JSON
                            requestBody = JSON.parse(requestBody);
                        } catch (e) {
                            // Keep as string if not valid JSON
                        }
                    } else if (details.requestBody.formData) {
                        // Handle form data
                        requestBody = details.requestBody.formData;
                    }
                }

                // Store request details
                const request = {
                    id: Date.now(),
                    url: details.url,
                    method: details.method,
                    timestamp: new Date().toISOString(),
                    requestBody: requestBody
                };

                capturedRequests.unshift(request);

                // Limit the number of stored requests
                if (capturedRequests.length > MAX_REQUESTS) {
                    capturedRequests = capturedRequests.slice(0, MAX_REQUESTS);
                }

                // Store in Chrome storage
                chrome.storage.local.set({ "capturedRequests": capturedRequests });
            } catch (error) {
                console.error("Error capturing request:", error);
            }
        }
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
);

// Listen for headers
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.method === "POST") {
            try {
                // Find the request we just stored and add headers
                const index = capturedRequests.findIndex(req =>
                    req.url === details.url && !req.headers);

                if (index !== -1) {
                    capturedRequests[index].headers = details.requestHeaders;

                    // Update storage
                    chrome.storage.local.set({ "capturedRequests": capturedRequests });
                }
            } catch (error) {
                console.error("Error capturing headers:", error);
            }
        }
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);

// Listen for messages from devtools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getRequests") {
        sendResponse({ requests: capturedRequests });
    } else if (message.action === "clearRequests") {
        capturedRequests = [];
        chrome.storage.local.set({ "capturedRequests": [] });
        sendResponse({ success: true });
    }
    return true;
});