if (typeof window.formDiv === "undefined") {
    window.formDiv = null;
    window.interval = null;
    window.randomInterval = null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "toggle_form") {
        if (msg.show) {
            injectForm();
        } else {
            removeForm();
        }
    }
});

function injectForm() {
    if (formDiv) return;

    formDiv = document.createElement("div");
    formDiv.innerHTML = `
<style>
#custom-injector {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 999999;
  background: #fff;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  width: 320px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

#custom-injector h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

#custom-injector textarea {
  width: 100%;
  margin-bottom: 8px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

#custom-injector label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #444;
}

#custom-injector label input[type="number"] {
  width: 70%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

#custom-injector input[type="checkbox"] {
  margin: 0;
  width: auto;
}

#calc-output {
  background: #f5f8ff;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  max-height: 150px;
  overflow-y: auto;
}

#calc-output button {
  margin-top: 2px;
  margin-right: 5px;
}

#custom-injector button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s ease;
}

#custom-injector button:hover {
  background-color: #0056b3;
}

#custom-injector button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

#custom-injector button.danger {
  background-color: #dc3545;
}

#custom-injector button.danger:hover {
  background-color: #bd2130;
}

#custom-injector button.success {
  background-color: #28a745;
}

#custom-injector button.success:hover {
  background-color: #218838;
}

.button-group {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.section {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

#random-status {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}
</style>

<div id="custom-injector">
  <div class="section">
    <h4>Price Calculation</h4>
    <label>First Price<input type="number" id="initial_price" placeholder="First Price"></label>
    <button id="calculate">Calculate</button>
    <div id="calc-output"></div>
  </div>

  <div class="section">
    <h4>Order Parameters</h4>
     <label>LTP<input type="number" id="ltp" placeholder="LTP"></label>
    <label>Symbol: <input type="number" id="symbol" placeholder="Symbol ID"></label>
    <label>Price: <input type="number" id="price" step="0.1" placeholder="Price"></label>
    <label>Quantity: <input type="number" id="quantity" placeholder="Quantity"></label>
    
    <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
      <input type="checkbox" id="use-ltp-checkbox" checked />
      Use LTP + 2%
      <button id="correct-fields" type="button">Update Payload</button>
    </label>
  </div>
  
  <div class="section">
    <h4>Request Configuration</h4>
    <label>Headers:</label>
    <textarea id="inject-header" rows="3"></textarea>
    <button id="format-header" type="button">Format Header</button>
    <label>Requests per second: <input type="number" id="per_sec_request" placeholder="Requests/sec" value="1"></label>
    <label>Payload:</label>
    <textarea id="inject-body" rows="5"></textarea>
    
    <div class="button-group">
      <button id="inject-start">Start</button>
      <button id="inject-stop" class="danger">Stop</button>
    </div>
    
    <div class="button-group">
      <button id="start-random" class="success">Start Random</button>
      <button id="stop-random" class="danger">Stop Random</button>
    </div>
    <div id="random-status"></div>
  </div>
</div>
`;

    document.body.appendChild(formDiv);

    // Initialize features
    watchLTPPrice();
    setupCalculationButton();
    setupButtonHandlers();

    // Set up state persistence
    restoreFormState();
    persistFormState();

    document.getElementById("ltp").addEventListener("input", () => {
        const ltpVal = parseFloat(document.getElementById("ltp").value);
        if (!isNaN(ltpVal)) {
            document.getElementById("price").value = Math.floor((ltpVal + ltpVal * 0.02) * 10) / 10;
            correctInjectFields();
        }
    });

    document.getElementById("format-header").addEventListener("click", () => {
        const input = document.getElementById("inject-header").value;
        const lines = input.split(/\r?\n/);
        const output = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) continue;

            // Handle ":key\nvalue" pattern
            if (line.endsWith(":")) {
                const key = line.slice(0, -1).trim();
                const value = (lines[i + 1] || "").trim();
                output.push(`${key}: ${value}`);
                i++;
            } else if (!line.includes(":")) {
                const key = line;
                const value = (lines[i + 1] || "").trim();
                output.push(`${key}: ${value}`);
                i++;
            } else {
                output.push(line);
            }
        }

        document.getElementById("inject-header").value = output.join("\n");
    });


}

function setupCalculationButton() {
    document.getElementById("calculate").onclick = () => {
        const initialPrice = parseFloat(document.getElementById("initial_price").value);
        if (isNaN(initialPrice)) {
            alert("Please enter a valid initial price");
            return;
        }

        const percentages = [2, 2, 2, 2, 2, 10];
        const outputDiv = document.getElementById("calc-output");
        outputDiv.innerHTML = "";

        let current = initialPrice;

        percentages.forEach((percent, index) => {
            let base, value;

            if (index === percentages.length - 1 && percent === 10) {
                // Final step: 10% of initial price
                base = initialPrice;
                value = +(base + (10 / 100) * base).toFixed(5);
            } else {
                // Chain calculation with 2%
                base = current;
                value = +(base + (2 / 100) * base).toFixed(5);
                current = value;
            }

            const buttonValue = Math.floor(value * 10) / 10; // Truncate to 1 decimal
            const row = document.createElement("div");
            row.innerHTML = `${base.toFixed(4)} + ${percent}% = ${value.toFixed(4)} <button data-value="${buttonValue}" id="btn${index + 1}">${buttonValue}</button>`;
            outputDiv.appendChild(row);
        });

        // Attach button click events
        outputDiv.querySelectorAll("button").forEach(btn => {
            btn.onclick = () => {
                document.getElementById("price").value = btn.dataset.value;
                correctInjectFields(); // Auto update payload with new price
            };
        });
    };
}

function setupButtonHandlers() {
    // Regular request handling
    document.getElementById("inject-start").onclick = startRegularRequests;
    document.getElementById("inject-stop").onclick = stopRegularRequests;

    // Random price request handling
    document.getElementById("start-random").onclick = startRandomPriceRequests;
    document.getElementById("stop-random").onclick = stopRandomPriceRequests;

    // Field correction
    document.getElementById("correct-fields").onclick = correctInjectFields;
}

function startRegularRequests() {
    stopAllRequests(); // Safety: stop any existing intervals

    const rawHeader = document.getElementById("inject-header").value;
    const body = document.getElementById("inject-body").value;
    const headers = parseHeaders(rawHeader);

    const perSec = parseInt(document.getElementById("per_sec_request")?.value || "1");
    const delay = perSec > 0 ? Math.floor(1000 / perSec) : 1000;

    interval = setInterval(() => {
        sendTradeRequest(headers, body);
    }, delay);
}

function stopRegularRequests() {
    clearInterval(interval);
    interval = null;
}

function startRandomPriceRequests() {
    stopAllRequests(); // Safety: stop any existing intervals

    const ltp = parseFloat(document.getElementById("ltp").value);
    const upper = parseFloat(document.getElementById("price").value);
    const statusDiv = document.getElementById("random-status");

    if (isNaN(ltp) || isNaN(upper)) {
        alert("Invalid LTP or Price");
        return;
    }

    statusDiv.textContent = `Sending 2x each price every 1s: ${ltp.toFixed(1)} → ${upper.toFixed(1)}`;

    const rawHeader = document.getElementById("inject-header").value;
    const headers = parseHeaders(rawHeader);
    const baseBody = document.getElementById("inject-body").value;

    try {
        const basePayload = JSON.parse(baseBody);
        const symbolId = parseInt(document.getElementById("symbol").value);
        const quantity = parseInt(document.getElementById("quantity").value);

        // Generate price points between LTP and LTP + 2%
        const pricePoints = [];
        for (let p = ltp; p <= upper + 0.001; p += 0.1) {
            pricePoints.push(Math.floor(p * 10) / 10);
        }

        const doubleBatch = [...pricePoints, ...pricePoints]; // 2x

        randomInterval = setInterval(() => {
            doubleBatch.forEach(price => {
                const payload = JSON.parse(JSON.stringify(basePayload));

                if (payload.orderBook) {
                    payload.orderBook.orderBookExtensions?.forEach(ext => {
                        ext.orderPrice = price;
                        ext.orderQuantity = quantity;
                    });

                    if (payload.orderBook.security) {
                        payload.orderBook.security.id = symbolId;
                    }
                }

                sendTradeRequest(headers, JSON.stringify(payload));
            });
        }, 1000);

    } catch (e) {
        console.error("Payload error:", e);
        alert("❌ Invalid payload format");
        statusDiv.textContent = "❌ Invalid payload format";
    }
}



// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function stopRandomPriceRequests() {
    clearInterval(randomInterval);
    randomInterval = null;
    document.getElementById("random-status").textContent = "";
}

function stopAllRequests() {
    stopRegularRequests();
    stopRandomPriceRequests();
}

function sendTradeRequest(headers, body) {
    fetch("https://tms44.nepsetms.com.np/tmsapi/orderApi/order/", {
        method: "POST",
        headers,
        body,
        credentials: "include"
    })
        .then(res => res.text())
        .then(response => {
            console.log("Request success:", response);
        })
        .catch(error => {
            console.error("Request failed:", error);
        });
}

function watchLTPPrice() {
    const target = document.querySelector(".order__form--prodtype.price-display");
    if (!target) return;

    const observer = new MutationObserver(() => {
        const text = target.textContent.trim();
        const match = text.match(/(\d+\.\d+)/);
        if (match) {
            const ltp = parseFloat(match[1]);
            if (!isNaN(ltp)) {
                const useLtp = document.getElementById("use-ltp-checkbox")?.checked;

                if (useLtp) {
                    const raw = ltp + (ltp * 0.02);
                    const truncated = Math.floor(raw * 10) / 10; // truncate to 1 decimal
                    document.getElementById("ltp").value = ltp;
                    document.getElementById("price").value = truncated;
                    showLtpAlert();
                    correctInjectFields();
                }
            }
        }
    });

    observer.observe(target, { childList: true, subtree: true, characterData: true });
}

function showLtpAlert() {
    if (!document.getElementById("ltp-global-alert")) {
        const alertBox = document.createElement("div");
        alertBox.id = "ltp-global-alert";
        alertBox.style = `
        display: none;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 255, 61, 0.39);
        color: rgb(21, 87, 36);
        border: 1px solid rgb(195, 230, 203);
        padding: 56px 157px;
        border-radius: 5px;
        font-weight: bold;
        font-size: 14px;
        z-index: 9999999;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        `;
        alertBox.textContent = "LTP is changed";
        document.body.appendChild(alertBox);
    }

    const alert = document.getElementById("ltp-global-alert");
    if (!alert) return;
    alert.style.display = "block";

    clearTimeout(window.ltpAlertTimeout);
    window.ltpAlertTimeout = setTimeout(() => {
        alert.style.display = "none";
    }, 5000);
}

function correctInjectFields() {
    const price = parseFloat(document.getElementById("price").value);
    const symbol_id = parseInt(document.getElementById("symbol").value);
    const quantity = parseInt(document.getElementById("quantity")?.value || 0);
    const textarea = document.getElementById("inject-body");

    if (!textarea || isNaN(price) || isNaN(quantity) || isNaN(symbol_id)) {
        return alert("Invalid price, quantity, or symbol ID");
    }

    let bodyText = textarea.value;

    try {
        const payload = JSON.parse(bodyText);

        // Update values
        if (payload.orderBook) {
            payload.orderBook.orderBookExtensions?.forEach(ext => {
                ext.orderPrice = price;
                ext.orderQuantity = quantity;
            });

            if (payload.orderBook.security) {
                payload.orderBook.security.id = symbol_id;
            }
        }

        // Set updated JSON
        textarea.value = JSON.stringify(payload, null, 2);
    } catch (e) {
        console.error("Error updating payload:", e);
        alert("Error: Invalid JSON format in payload");
    }
}

function persistFormState() {
    const elements = formDiv.querySelectorAll("input, textarea");

    elements.forEach(el => {
        const key = `injector-${el.id}`;
        if (el.type === "checkbox") {
            el.addEventListener("change", () => {
                localStorage.setItem(key, el.checked ? "1" : "0");
            });
        } else {
            el.addEventListener("input", () => {
                localStorage.setItem(key, el.value);
            });
        }
    });
}

function restoreFormState() {
    const elements = formDiv.querySelectorAll("input, textarea");

    elements.forEach(el => {
        const key = `injector-${el.id}`;
        const saved = localStorage.getItem(key);

        if (saved !== null) {
            if (el.type === "checkbox") {
                el.checked = saved === "1";
            } else {
                el.value = saved;
            }
        }
    });
}

function parseHeaders(raw) {
    const lines = raw.trim().split(/\r?\n/);
    const headers = {};
    for (const line of lines) {
        const [key, ...vals] = line.split(":");
        if (key && vals.length) {
            headers[key.trim()] = vals.join(":").trim();
        }
    }
    return headers;
}

function removeForm() {
    if (formDiv) {
        formDiv.remove();
        formDiv = null;
        clearInterval(interval);
        clearInterval(randomInterval);
    }
}