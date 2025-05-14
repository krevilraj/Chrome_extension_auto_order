document.addEventListener('DOMContentLoaded', function() {
    const copyAllHeadersBtn = document.getElementById('copyAllHeaders');
    const copyNepseHeadersBtn = document.getElementById('copyNepseHeaders');
    const statusDiv = document.getElementById('status');

    // Storage for data from DevTools panel
    let requestsData = [];
    let selectedRequest = null;

    // Function to show success message
    function showSuccess() {
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 2000);
    }

    // Function to show error message
    function showError(message) {
        statusDiv.textContent = message || 'Error!';
        statusDiv.style.color = 'red';
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
            statusDiv.textContent = 'Headers copied to clipboard!';
            statusDiv.style.color = 'green';
        }, 2000);
    }

    // Copy headers to clipboard
    function copyHeaders(headers) {
        if (!headers || headers.length === 0) {
            showError('No headers found!');
            return;
        }

        // Format headers
        let headerText = '';
        for (const header of headers) {
            headerText += `${header.name}: ${header.value}\n`;
        }

        // Copy to clipboard using background page
        chrome.runtime.sendMessage(
            { action: 'copyToClipboard', text: headerText },
            function(response) {
                if (response && response.success) {
                    showSuccess();
                } else {
                    showError('Failed to copy headers!');
                    console.error('Copy failed:', response ? response.error : 'unknown error');
                }
            }
        );
    }

    // Copy All Headers button click
    copyAllHeadersBtn.addEventListener('click', function() {
        // Directly interact with the inspected page's Network panel
        chrome.devtools.inspectedWindow.eval(
            `(function() {
        const selectedRow = document.querySelector('.data-grid-data-grid-node.selected');
        if (selectedRow) {
          return selectedRow.getAttribute('data-request-id');
        }
        return null;
      })()`,
            function(result, isException) {
                if (isException || !result) {
                    // If no selected request, show error
                    showError('No request selected! Please select a request in the Network panel.');
                    return;
                }

                // Get request details
                chrome.devtools.network.getHAR(function(harLog) {
                    const entries = harLog.entries;
                    if (!entries || entries.length === 0) {
                        showError('No network requests found!');
                        return;
                    }

                    // Find the selected request
                    for (const entry of entries) {
                        if (entry._requestId === result) {
                            copyHeaders(entry.request.headers);
                            return;
                        }
                    }

                    // If we got here, we couldn't find the selected request
                    showError('Could not find the selected request!');
                });
            }
        );
    });

    // Copy NEPSE Headers button click
    copyNepseHeadersBtn.addEventListener('click', function() {
        // Get HAR data
        chrome.devtools.network.getHAR(function(harLog) {
            const entries = harLog.entries;
            if (!entries || entries.length === 0) {
                showError('No network requests found!');
                return;
            }

            // Find NEPSE requests
            const nepseRequests = entries.filter(entry =>
                entry.request.url.includes('tms44.nepsetms.com.np/tmsapi/dnaApi/exchange/sessionCheck')
            );

            if (nepseRequests.length > 0) {
                // Use the most recent NEPSE request
                copyHeaders(nepseRequests[nepseRequests.length - 1].request.headers);
            } else {
                showError('No NEPSE TMS requests found!');
            }
        });
    });

    // Listen for updates from the devtools.js
    window.addEventListener('message', function(event) {
        const message = event.data;
        if (message && message.requests) {
            requestsData = message.requests;
            selectedRequest = message.selectedRequest;
        }
    });
});