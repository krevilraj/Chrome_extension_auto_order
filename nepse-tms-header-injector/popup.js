document.addEventListener('DOMContentLoaded', function() {
    const injectButton = document.getElementById('inject-button');
    const viewHeadersButton = document.getElementById('view-headers');
    const headerIndexSelect = document.getElementById('header-index');
    const headersPreview = document.getElementById('headers-preview');
    const statusElement = document.getElementById('status');

    let capturedHeaders = [];

    // Load headers when popup opens
    loadHeaders();

    // Button to inject headers
    injectButton.addEventListener('click', function() {
        const selectedIndex = parseInt(headerIndexSelect.value);

        if (capturedHeaders.length === 0) {
            showStatus('No headers captured yet. Please visit the NEPSE TMS website first.', 'error');
            return;
        }

        if (selectedIndex >= capturedHeaders.length) {
            showStatus('Selected header index is not available', 'error');
            return;
        }

        const selectedHeaders = capturedHeaders[selectedIndex];

        // Send message to background script to inject headers
        chrome.runtime.sendMessage(
            { action: 'injectHeaders', headers: selectedHeaders },
            function(response) {
                if (response && response.status) {
                    showStatus('Headers injected successfully!', 'success');
                }
            }
        );
    });

    // Button to view headers
    viewHeadersButton.addEventListener('click', function() {
        const selectedIndex = parseInt(headerIndexSelect.value);

        if (capturedHeaders.length === 0) {
            showStatus('No headers captured yet. Please visit the NEPSE TMS website first.', 'error');
            return;
        }

        if (selectedIndex >= capturedHeaders.length) {
            showStatus('Selected header index is not available', 'error');
            return;
        }

        const selectedHeaders = capturedHeaders[selectedIndex];
        const headerText = selectedHeaders.map(header => `${header.name}: ${header.value}`).join('\n');

        headersPreview.textContent = headerText;
        headersPreview.style.display = 'block';
    });

    // Function to load headers from background script
    function loadHeaders() {
        chrome.runtime.sendMessage({ action: 'getLatestHeaders' }, function(response) {
            if (response && response.headers) {
                capturedHeaders = response.headers;

                // Update the select options based on available headers
                headerIndexSelect.innerHTML = '';

                if (capturedHeaders.length === 0) {
                    const option = document.createElement('option');
                    option.value = '-1';
                    option.textContent = 'No headers captured yet';
                    headerIndexSelect.appendChild(option);
                    injectButton.disabled = true;
                    viewHeadersButton.disabled = true;
                } else {
                    const labels = ['Most recent request', 'Second most recent', 'Third most recent'];

                    for (let i = 0; i < capturedHeaders.length; i++) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = labels[i] || `Request #${i+1}`;
                        headerIndexSelect.appendChild(option);
                    }

                    injectButton.disabled = false;
                    viewHeadersButton.disabled = false;
                }
            }
        });
    }

    // Helper function to show status messages
    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = 'status ' + type;
        statusElement.style.display = 'block';

        // Hide the status after 3 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
});