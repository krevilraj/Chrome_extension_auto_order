// Storage for DevTools connections
const connections = {};

// Handle connections from DevTools pages
chrome.runtime.onConnect.addListener(function(port) {
    // Register the connection
    if (port.name === "devtools-page") {
        const extensionListener = function(message, sender, sendResponse) {
            // Handle messages from the DevTools page if needed
        };

        // Listen to messages from the DevTools page
        port.onMessage.addListener(extensionListener);

        // Handle disconnection
        port.onDisconnect.addListener(function(port) {
            port.onMessage.removeListener(extensionListener);
        });
    }
});

// Listen for messages from the sidebar script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Handle clipboard operations
    if (message.action === "copyToClipboard") {
        navigator.clipboard.writeText(message.text)
            .then(() => {
                console.log("Headers copied to clipboard");
                sendResponse({ success: true });
            })
            .catch(err => {
                console.error("Failed to copy headers: ", err);
                sendResponse({ success: false, error: err.toString() });
            });
        return true; // Required for async sendResponse
    }
});