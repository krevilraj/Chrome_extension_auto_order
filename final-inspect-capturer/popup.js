document.getElementById('refresh').addEventListener('click', refreshRequests);
document.getElementById('clear').addEventListener('click', clearRequests);

function refreshRequests() {
    chrome.runtime.sendMessage({action: 'getRequests'}, (requests) => {
        const container = document.getElementById('requests');
        container.innerHTML = '';
        if (!requests.length) {
            container.innerHTML = '<p>No requests captured yet.</p>';
            return;
        }
        requests.forEach(req => {
            const div = document.createElement('div');
            div.style.margin = '10px 0';
            div.style.padding = '10px';
            div.style.border = '1px solid #ccc';
            let content = `<strong>${req.method} ${req.url}</strong><br>
                           Type: ${req.type}<br>
                           Time: ${req.timestamp}<br>`;
            if (req.body) {
                content += `<pre>${JSON.stringify(req.body, null, 2)}</pre>`;
            }
            div.innerHTML = content;
            container.appendChild(div);
        });
    });
}

function clearRequests() {
    chrome.runtime.sendMessage({action: 'clearRequests'}, () => {
        document.getElementById('requests').innerHTML = '<p>All requests cleared.</p>';
    });
}
refreshRequests();