// Create a panel in the DevTools Network panel
chrome.devtools.panels.network.createSidebarPane("Copy Headers", function(sidebar) {
    // Load the sidebar page
    sidebar.setPage("sidebar.html");

    // Create a connection to the background page
    const backgroundPageConnection = chrome.runtime.connect({
        name: "devtools-page"
    });

    // Set up a listener for messages from the background page
    backgroundPageConnection.onMessage.addListener(function(message) {
        // Handle any messages from the background page if needed
    });

    // Store information about network requests
    let requestData = [];

    // Listen for network requests
    chrome.devtools.network.onRequestFinished.addListener(function(request) {
        // Store the request information
        const url = request.request.url;
        const headers = request.request.headers;

        // Save request information in an object
        const requestInfo = {
            url: url,
            headers: headers,
            isNepse: url.includes('tms44.nepsetms.com.np/tmsapi/dnaApi/exchange/sessionCheck')
        };

        // Add to request data array
        requestData.push(requestInfo);

        // Keep only the last 50 requests to avoid memory issues
        if (requestData.length > 50) {
            requestData.shift();
        }

        // Send request data to sidebar
        sidebar.setObject({
            requests: requestData,
            selectedRequest: null
        }, "Network Requests");
    });

    // When a network request is selected
    chrome.devtools.network.onRequestSelected.addListener(function(request) {
        // Send the selected request to the sidebar
        sidebar.setObject({
            requests: requestData,
            selectedRequest: {
                url: request.request.url,
                headers: request.request.headers
            }
        }, "Network Requests");
    });
});