document.getElementById('refresh').addEventListener('click', refreshRequests);
document.getElementById('clear').addEventListener('click', clearRequests);

function refreshRequests() {
    chrome.runtime.sendMessage({ action: 'getRequests' }, (requests) => {
        const container = document.getElementById('requests');
        container.innerHTML = '';

        if (!requests || requests.length === 0) {
            container.innerHTML = '<p>No requests captured yet.</p>';
            return;
        }

        requests.forEach(req => {
            const div = document.createElement('div');
            div.innerHTML = `
        <strong>${req.method} ${req.url}</strong><br>
        Type: ${req.type}<br>
        Time: ${req.timestamp}<br>
        ${req.payload ? `<pre>${JSON.stringify(req.payload, null, 2)}</pre>` : ''}
      `;
            container.appendChild(div);
        });
    });
}

function clearRequests() {
    chrome.runtime.sendMessage({ action: 'clearRequests' }, () => {
        document.getElementById('requests').innerHTML = '<p>All requests cleared.</p>';
    });
}

refreshRequests();
