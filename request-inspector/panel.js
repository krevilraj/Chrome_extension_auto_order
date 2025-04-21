const requests = [];
let recording = true;
let inspectedTabId;

// Connect to background script
const port = chrome.runtime.connect({
    name: "devtools-page"
});

// Get the inspected tab ID
chrome.devtools.inspectedWindow.getTabId((tabId) => {
    inspectedTabId = tabId;
    port.postMessage({
        name: "init",
        tabId: tabId
    });
});

// Handle messages from background
port.onMessage.addListener((message) => {
    if (message.tabId !== inspectedTabId) return;

    if (message.type === "request") {
        if (recording) {
            requests.push(message.data);
            renderRequest(message.data);
        }
    }
});

// UI Controls
document.getElementById("clear").addEventListener("click", () => {
    requests.length = 0;
    document.getElementById("requests").innerHTML = "";
});

document.getElementById("record").addEventListener("click", (e) => {
    recording = !recording;
    e.target.textContent = recording ? "Pause" : "Record";
});

// Render a single request
function renderRequest(request) {
    const container = document.getElementById("requests");
    const requestEl = document.createElement("div");
    requestEl.className = "request";

    const statusClass = request.status >= 400 ? "error" :
        request.status >= 200 ? "success" : "";

    requestEl.innerHTML = `
    <div class="request-header">
      <div class="method ${request.method.toLowerCase()}">
        ${request.method}
      </div>
      <div class="url" title="${request.url}">
        ${request.url}
      </div>
      <div class="status ${statusClass}">
        ${request.status || ''}
      </div>
    </div>
    <div class="details">
      ${request.payload ? `
        <div><strong>Request Payload:</strong></div>
        <pre>${JSON.stringify(JSON.parse(request.payload), null, 2)}</pre>
      ` : ''}
    </div>
  `;

    // Toggle details
    requestEl.querySelector(".request-header").addEventListener("click", () => {
        const details = requestEl.querySelector(".details");
        details.style.display = details.style.display === "block" ? "none" : "block";
    });

    container.prepend(requestEl);
}