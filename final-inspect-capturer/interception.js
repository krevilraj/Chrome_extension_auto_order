const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

window.fetch = async function(...args) {
    const startTime = Date.now();
    const fetchInput = args[0];
    const init = args[1] || {};

    try {
        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();
        const requestData = {
            type: 'fetch',
            url: typeof fetchInput === 'string' ? fetchInput : fetchInput.url,
            method: init.method || 'GET',
            headers: init.headers || {},
            body: init.body || null,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            status: clonedResponse.status,
            statusText: clonedResponse.statusText
        };
        try {
            const json = await clonedResponse.json();
            requestData.response = json;
        } catch (e) {}
        window.postMessage({
            type: 'REQUEST_CAPTURED',
            data: requestData
        }, '*');
        return response;
    } catch (error) {
        console.error('Fetch interception error:', error);
        throw error;
    }
};

XMLHttpRequest.prototype.open = function(method, url) {
    this._method = method;
    this._url = url;
    this._startTime = Date.now();
    return originalXHROpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
    const oldOnReadyStateChange = this.onreadystatechange;
    const oldOnLoad = this.onload;
    const oldOnError = this.onerror;

    this.onreadystatechange = this.onload = this.onerror = function() {
        if (this.readyState === 4) {
            const requestData = {
                type: 'xhr',
                url: this._url,
                method: this._method,
                body: body,
                timestamp: new Date().toISOString(),
                duration: Date.now() - this._startTime,
                status: this.status,
                statusText: this.statusText
            };
            try {
                if (this.responseText) {
                    requestData.response = JSON.parse(this.responseText);
                }
            } catch (e) {}
            window.postMessage({
                type: 'REQUEST_CAPTURED',
                data: requestData
            }, '*');
        }

        if (oldOnReadyStateChange) oldOnReadyStateChange.apply(this, arguments);
        if (oldOnLoad) oldOnLoad.apply(this, arguments);
        if (oldOnError) oldOnError.apply(this, arguments);
    };

    return originalXHRSend.apply(this, arguments);
};