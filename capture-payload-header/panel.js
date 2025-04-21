let capturedRequests = [];
let selectedRequestId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load requests when panel opens
    loadRequests();

    // Set up event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadRequests);
    document.getElementById('clearBtn').addEventListener('click', clearRequests);

    // Auto-refresh data every 3 seconds
    setInterval(loadRequests, 3000);
});

// Load requests from background script
function loadRequests() {
    chrome.runtime.sendMessage({action: "getRequests"}, function(response) {
        if (response && response.requests) {
            capturedRequests = response.requests;
            updateRequestList();

            // If we have a selected request, update its details
            if (selectedRequestId) {
                const request = capturedRequests.find(r => r.id === selectedRequestId);
                if (request) {
                    displayRequestDetails(request);
                } else {
                    // Our selected request was removed, clear selection
                    selectedRequestId = null;
                    document.getElementById('requestDetails').innerHTML = `
            <div class="no-selection">
              Select a request to view details
            </div>
          `;
                }
            }
        }
    });
}

// Clear all captured requests
function clearRequests() {
    chrome.runtime.sendMessage({action: "clearRequests"}, function(response) {
        if (response.success) {
            capturedRequests = [];
            updateRequestList();
            selectedRequestId = null;
            document.getElementById('requestDetails').innerHTML = `
        <div class="no-selection">
          Select a request to view details
        </div>
      `;
        }
    });
}

// Update the request list UI
function updateRequestList() {
    const requestListEl = document.getElementById('requestList');

    if (capturedRequests.length === 0) {
        requestListEl.innerHTML = `
      <div class="empty-state">
        <p>Waiting for POST requests...</p>
      </div>
    `;
        return;
    }

    let html = '';
    capturedRequests.forEach(request => {
        const isSelected = selectedRequestId === request.id;
        html += `
      <div class="request-item ${isSelected ? 'selected' : ''}" data-id="${request.id}">
        <div class="request-url">
          <span class="request-method">${request.method}</span>
          ${formatUrl(request.url)}
        </div>
        <div class="request-time">${formatTime(request.timestamp)}</div>
      </div>
    `;
    });

    requestListEl.innerHTML = html;

    // Add click event listeners to request items
    document.querySelectorAll('.request-item').forEach(item => {
        item.addEventListener('click', function() {
            const requestId = parseInt(this.getAttribute('data-id'));
            const request = capturedRequests.find(r => r.id === requestId);

            if (request) {
                // Update selected state
                document.querySelectorAll('.request-item').forEach(el => {
                    el.classList.remove('selected');
                });
                this.classList.add('selected');

                selectedRequestId = requestId;
                displayRequestDetails(request);
            }
        });
    });
}

// Display details for a selected request
function displayRequestDetails(request) {
    const detailsEl = document.getElementById('requestDetails');

    let html = `
    <div class="detail-section">
      <div class="detail-header">
        <h2>General Information</h2>
      </div>
      <div class="detail-content">
        <div class="headers-display">
          <span class="header-line"><strong>URL:</strong> ${request.url}</span>
          <span class="header-line"><strong>Method:</strong> ${request.method}</span>
          <span class="header-line"><strong>Time:</strong> ${request.timestamp}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <div class="detail-header">
        <h2>Request Headers</h2>
        <button class="copy-headers-btn" data-id="${request.id}">Copy Headers</button>
      </div>
      <div class="detail-content">
        <div class="headers-display">
          ${formatHeadersForDisplay(request.headers)}
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <div class="detail-header">
        <h2>Request Payload</h2>
        <button class="copy-payload-btn" data-id="${request.id}">Copy Payload</button>
      </div>
      <div class="detail-content">
        <div class="payload-display">
          ${formatPayload(request.requestBody)}
        </div>
      </div>
    </div>
  `;

    detailsEl.innerHTML = html;

    // Add event listeners to copy buttons
    document.querySelector('.copy-headers-btn').addEventListener('click', function() {
        const requestId = parseInt(this.getAttribute('data-id'));
        const request = capturedRequests.find(r => r.id === requestId);

        if (request && request.headers) {
            const headerText = formatHeadersForCopy(request.headers);
            copyToClipboard(headerText, this);
        }
    });

    document.querySelector('.copy-payload-btn').addEventListener('click', function() {
        const requestId = parseInt(this.getAttribute('data-id'));
        const request = capturedRequests.find(r => r.id === requestId);

        if (request && request.requestBody) {
            const payloadText = typeof request.requestBody === 'object'
                ? JSON.stringify(request.requestBody, null, 2)
                : request.requestBody;
            copyToClipboard(payloadText, this);
        }
    });
}

// Format headers for display in UI
function formatHeadersForDisplay(headers) {
    if (!headers || headers.length === 0) {
        return '<span class="header-line">No headers captured</span>';
    }

    let html = '';
    headers.forEach(header => {
        html += `<span class="header-line"><strong>${header.name}:</strong> ${header.value}</span>`;
    });

    return html;
}

// Format headers for copying to clipboard (in the format you requested)
function formatHeadersForCopy(headers) {
    if (!headers || headers.length === 0) {
        return 'No headers captured';
    }

    // Sort headers alphabetically for consistency
    headers.sort((a, b) => a.name.localeCompare(b.name));

    return headers.map(header => `${header.name}: ${header.value}`).join('\n');
}

// Format request payload
function formatPayload(payload) {
    if (!payload) {
        return 'No payload data captured';
    }

    return typeof payload === 'object'
        ? JSON.stringify(payload, null, 2)
        : payload;
}

// Format URL to show only the path
function formatUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname + urlObj.search;
    } catch (e) {
        return url;
    }
}

// Format timestamp
function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    } catch (e) {
        return timestamp;
    }
}

// Copy text to clipboard
function copyToClipboard(text, buttonEl) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);

    // Select the text and copy it
    textarea.select();
    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Failed to copy text:', err);
    }

    // Clean up
    document.body.removeChild(textarea);

    // Update button text to provide feedback
    if (success) {
        const originalText = buttonEl.textContent;
        buttonEl.textContent = 'Copied!';

        setTimeout(() => {
            buttonEl.textContent = originalText;
        }, 1500);
    } else {
        buttonEl.textContent = 'Copy failed';

        setTimeout(() => {
            buttonEl.textContent = originalText;
        }, 1500);
    }
}