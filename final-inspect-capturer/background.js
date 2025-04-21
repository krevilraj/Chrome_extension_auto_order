let capturedRequests = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'recordRequest') {
        capturedRequests.push(request.data);
        console.log('Captured request:', request.data);
    }
    else if (request.action === 'getRequests') {
        sendResponse(capturedRequests);
    }
    else if (request.action === 'clearRequests') {
        capturedRequests = [];
        sendResponse({ success: true });
    }
});