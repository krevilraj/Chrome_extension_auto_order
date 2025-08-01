// Wrap entire script in initialization check
if (typeof window.injectorLoaded === 'undefined') {
    window.injectorLoaded = true;

    // Your original code starts here (paste ALL your original code below)
    let allPrices = [];
    let successPrices = [];
    let keepRetrying = true;
    let successCount = 0;
    // Define how many successes are required
    const REQUIRED_SUCCESS_COUNT = 2;
    if (typeof window.formDiv === "undefined") {
        window.formDiv = null;
        window.interval = null;
        window.randomInterval = null;
        window.requestHistory = [];
        window.requestCounters = {
            success: 0,
            fail: 0,
            pending: 0
        };
        window.successOrderNumbers = [];
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
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999999;
  background: #fff;
  border-top: 1px solid #ccc;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
  width: 100%;
  height: 496px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
}

#tab-navigation {
  display: flex;
  border-bottom: 1px solid #ddd;
  background: #f5f5f5;
}

.tab-button {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  border-bottom: 3px solid transparent;
}

.tab-button.active {
  border-bottom: 3px solid #007bff;
  color: #007bff;
  background: #fff;
}

.tab-content {
  display: none;
  padding: 15px;
  height: calc(496px - 46px);
  overflow-y: auto;
}

.tab-content.active {
  display: block;
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
  margin-bottom: 16px;
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

.button-group-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.current-order-info {
  display: flex;
  gap: 15px;
  
}

.current-order-info span {
  white-space: nowrap;
  font-size: 19px;
}

/* New counter styles */
.request-counters {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  gap: 20px;
  font-size: 16px;
  text-align: center;
}

.counter-box {
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.counter-value {
  font-size: 26px;
  font-weight: bold;
  margin-top: 5px;
}

.counter-success {
  background-color: #e6f7ed;
  border: 1px solid #28a745;
  color: #28a745;
}

.counter-fail {
  background-color: #fbeae5;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.counter-pending {
  background-color: #e8f4ff;
  border: 1px solid #007bff;
  color: #007bff;
}

/* Success alert */
#success-global-alert {
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
}

/* Reset button */
.reset-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  align-self: center;
}

.reset-button:hover {
  background-color: #5a6268;
}
.box-order-entry.blur__options{
    filter:unset !important;
}
.d-flex{
display: flex;
gap:10px;
}
.d-flex > .col{
width:50%;
}
#custom-injector #tab-navigation button{
    border-radius: unset;
    margin-right: 4px;
    margin-top:4px;
    margin-bottom: 0;
    background: unset;
    color: #000;
}
#custom-injector #tab-navigation button.active{
    border:1px solid #000;
    font-weight: 600;
}
#custom-injector .tab-content{
    border-top: 1px solid #000;
    margin-top: -2px;
}
#custom-injector #tab-navigation button:hover{
    background: #00000070;
}

button[data-quantity].active {
    background-color: #007bff;
    color: white;
    font-weight: bold;
}
#price-table tbody tr:first-child{
    background:#007bff;
    color:#fff
}
.highlight-green {
  background-color: #4CAF50 !important;
  color: white !important;
  font-weight: bold;
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
  transform: scale(1.05);
  transition: all 0.3s ease;
}
</style>

<div id="custom-injector">
  <div id="tab-navigation">
    <button class="tab-button active" data-tab="calculation">First Task</button>
    <button class="tab-button" data-tab="order">Order</button>
    <button class="tab-button" data-tab="request">Request and Response</button>
    <button class="tab-button" data-tab="placed">Order Complete</button>

  </div>
  
  <div id="calculation-tab" class="tab-content active">
    
  </div>
  
  <div id="order-tab" class="tab-content">
    <div class="two-column">
      
      
      <div class="column">
        <div class="section">
          <h4>Request Configuration</h4>
          <div class="d-flex">
          <div class="col">
           <label>Headers:</label>
          <textarea id="inject-header" rows="3"></textarea>
          <button id="format-header" type="button">Format Header</button>
</div>
<div class="col">
 <label>Payload:</label>
          <textarea id="inject-body" rows="5"></textarea>
</div>
</div>



<label>Headers:</label>
          <textarea id="inject-header1" rows="3"></textarea>
          
          <button id="format-header1" type="button">Format Header</button>
<h4>Get all the information</h4>
    <label>Symbol id<input type="number" id="symbol__id" placeholder="First Price"></label>
    <button id="get__it">Get it</button>
          
         
          
         
        </div>
      </div>
    </div>
  </div>
  
  <div id="request-tab" class="tab-content">
   <div class="button-group-wrapper">
  <div class="button-group">
    <button id="inject-start">Start</button>
    <button id="inject-stop" class="danger">Stop</button>
    <button id="start-random" class="success">Start Random</button>
    <button id="stop-random" class="danger">Stop Random</button>
    
    <label style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="stop-on-success" checked />
            Stop on success
          </label>
          
    
    <span id="random-status"></span>
  </div>
  <div>
  <label>Requests per second: <input type="number" id="per_sec_request" placeholder="Requests/sec" value="1"></label>
</div>
  <div class="current-order-info">
    <span><strong>Symbol:</strong> <span id="display-symbol">-</span></span>
    <span><strong>Quantity:</strong> <span id="display-quantity">-</span></span>
    <span><strong>Price:</strong> <span id="display-price">-</span></span>
  </div>
</div>
    <div class="d-flex">
        
    <!-- Replace table with counters -->
    <div  style="width: 33.33%">
    <div class="request-counters">
      <div class="counter-box counter-success">
        <div>SUCCESS</div>
        <div class="counter-value" id="success-counter">0</div>
      </div>
      <div class="counter-box counter-fail">
        <div>FAILED</div>
        <div class="counter-value" id="fail-counter">0</div>
      </div>
      <div class="counter-box counter-pending">
        <div>PENDING</div>
        <div class="counter-value" id="pending-counter">0</div>
      </div>
    </div>
</div>
    
    
    <div class="order__parameter"  style="width: 33.33%">
            <div class="column">
                <div class="section">
                  <h4>Order Parameters</h4>
                  <label>LTP<input type="number" id="ltp" placeholder="LTP"></label>
                  <label>Symbol: <input type="number" id="symbol" placeholder="Symbol ID"></label>
                  <label>Price: <input type="number" id="price" step="0.1" placeholder="Price"></label>
                  <label>Quantity: <input type="number" id="quantity" placeholder="Quantity"></label>
                  
                  <label style="display:flex;align-items:center;gap:6px;margin-bottom:0px;justify-content: left">
                    <input type="checkbox" id="use-ltp-checkbox" />
                    Use LTP + 2%
        <!--            <button id="correct-fields" type="button">Update Payload</button>-->
                  </label>
                </div>
          </div>
    </div>
    
    <div class="table_calculation" style="width: 33.33%">
    <h4>Auto Price Steps</h4>
    <input id="percent-seed" type="number" placeholder="Enter base price..." style="width: 100%; margin-bottom: 6px;" />
    <button id="add-percent-row" type="button">Add Price Row</button>
     <button id="use-preclose-btn" type="button" class="reset-button">Use Pre Close</button> <!-- ✅ Add Here -->
    <div class="quantity__btn">
    Quantity: <button data-quantity="10">10</button> <button data-quantity="500">500</button> <button data-quantity="1000">1000</button>
</div>
    <table id="price-table" border="1" style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
        <thead>
            <tr>
                <th>Base</th>
                <th>+2%</th>
                <th>+2%</th>
                <th>+2%</th>
                <th>+2%</th>
                <th>+2%</th>
                <th>+10%</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>


</div>


    
    <button id="delete-pending-prices" class="reset-button danger">Delete All Pending Prices</button>
    <button id="download-logs" class="reset-button">Download Logs</button>
    <button id="first-order-btn" class="reset-button">First Order</button>


  </div>
  
  <div id="placed-tab" class="tab-content">
  <h4>Order Placed Records</h4>
  <table id="order-records-table" border="1" style="width:100%; text-align:center; border-collapse:collapse;">
    <thead>
      <tr style="background: #007bff; color: white;">
        <th>Price</th>
        <th>Quantity</th>
        <th>Recorded Order Number</th>
      </tr>
    </thead>
    <tbody>
      <!-- Dynamically added rows -->
    </tbody>
  </table>
</div>

</div>
`;

        document.body.appendChild(formDiv);

        // Setup tab navigation
        setupTabs();

        // Initialize features
        watchLTPPrice();
        //setupCalculationButton();
        setupButtonHandlers();

        // Set up state persistence
        restoreFormState();
        persistFormState();



        document.getElementById("download-logs").addEventListener("click", () => {
            if (!window.requestHistory || window.requestHistory.length === 0) {
                alert("No request history to download.");
                return;
            }

            const blob = new Blob([JSON.stringify(window.requestHistory, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "request_history.json";
            a.click();
            URL.revokeObjectURL(url);
        });



        // Initialize counter display
        updateCountersDisplay();

        document.getElementById("ltp").addEventListener("input", () => {
            const ltpVal = parseFloat(document.getElementById("ltp").value);
            if (!isNaN(ltpVal)) {
                document.getElementById("price").value = Math.floor((ltpVal + ltpVal * 0.02) * 10) / 10;
                correctInjectFields();
            }
        });

        // document.getElementById("format-header").addEventListener("click", () => {
        //     const input = document.getElementById("inject-header").value;
        //     const lines = input.split(/\r?\n/);
        //     const output = [];
        //
        //     for (let i = 0; i < lines.length; i++) {
        //         const line = lines[i].trim();
        //
        //         if (!line) continue;
        //
        //         // Handle ":key\nvalue" pattern
        //         if (line.endsWith(":")) {
        //             const key = line.slice(0, -1).trim();
        //             const value = (lines[i + 1] || "").trim();
        //             output.push(`${key}: ${value}`);
        //             i++;
        //         } else if (!line.includes(":")) {
        //             const key = line;
        //             const value = (lines[i + 1] || "").trim();
        //             output.push(`${key}: ${value}`);
        //             i++;
        //         } else {
        //             output.push(line);
        //         }
        //     }
        //
        //     document.getElementById("inject-header").value = output.join("\n");
        // });

        // 1. Format button for inject-header1
        document.getElementById("format-header").addEventListener("click", () => {
            formatHeaders("inject-header");
        });

        // 1. Format button for inject-header1
        document.getElementById("format-header1").addEventListener("click", () => {
            formatHeaders("inject-header1");
        });

        // Add reset counters button handler
        // document.getElementById("reset-counters").addEventListener("click", resetCounters);

        // 2. Auto-format for inject-header (with anti-recursion protection)
        let isProgrammaticChange = false;
        document.getElementById("inject-header").addEventListener("input", function() {
            if (isProgrammaticChange) {
                isProgrammaticChange = false;
                return;
            }
            formatHeaders("inject-header");
        });

        let isProgrammaticChange1 = false;
        document.getElementById("inject-header1").addEventListener("input", function() {
            if (isProgrammaticChange1) {
                isProgrammaticChange1 = false;
                return;
            }
            formatHeaders("inject-header1");
        });

// Shared formatting function
        function formatHeaders(textareaId) {
            const textarea = document.getElementById(textareaId);
            const input = textarea.value;
            const lines = input.split(/\r?\n/);
            const output = [];
            let i = 0;

            while (i < lines.length) {
                let line = lines[i].trim();

                if (!line) {
                    i++;
                    continue;
                }

                // Handle HTTP/2 pseudo-headers (starting with :)
                if (line.startsWith(":")) {
                    const key = line;
                    const value = (lines[i + 1] || "").trim();
                    output.push(`${key} ${value}`);
                    i += 2;
                }
                // Handle already formatted headers
                else if (line.includes(":")) {
                    output.push(line);
                    i++;
                }
                // Handle unformatted key-value pairs
                else {
                    const key = line;
                    const value = (lines[i + 1] || "").trim();
                    output.push(`${key}: ${value}`);
                    i += 2;
                }
            }

            const newValue = output.join("\n");
            if (textarea.value !== newValue) {
                isProgrammaticChange = true;
                textarea.value = newValue;
            }

            // Update content length if function exists
            if (typeof updateContentLengthInHeader === 'function') {
                updateContentLengthInHeader();
            }
        }


        ["symbol", "price", "quantity"].forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener("input", () => {
                correctInjectFields();
            });
        });

        document.getElementById("inject-body").addEventListener("input", updateContentLengthInHeader);

        // ✅ Handle Price Table Row Insertion
        const percentSeedInput = document.getElementById("percent-seed");
        const addRowBtn = document.getElementById("add-percent-row");
        const priceTableBody = document.querySelector("#price-table tbody");

        addRowBtn.addEventListener("click", () => {
            const base = parseFloat(percentSeedInput.value);
            if (isNaN(base)) {
                alert("Enter a valid number");
                return;
            }

            const row = document.createElement("tr");
            const percentages = [2, 2, 2, 2, 2]; // 5 times +2%
            let current = base;

            function truncate1Decimal(val) {
                return Math.floor(val * 10) / 10;
            }

            // First column - base
            const baseCell = document.createElement("td");
            const baseTruncated = truncate1Decimal(base);
            baseCell.textContent = baseTruncated.toFixed(1);
            baseCell.style.cursor = "pointer";
            baseCell.onclick = () => {
                document.getElementById("price").value = baseTruncated;
                correctInjectFields();
            };
            row.appendChild(baseCell);

            // Now 5 times +2%
            percentages.forEach(percent => {
                const plus = current * (percent / 100);
                const next = current + plus;
                const truncated = truncate1Decimal(next);

                const td = document.createElement("td");
                td.textContent = truncated.toFixed(1);
                td.style.cursor = "pointer";
                td.onclick = () => {
                    document.getElementById("price").value = truncated;
                    correctInjectFields();
                };
                row.appendChild(td);

                current = truncated; // IMPORTANT: next step from here
            });

            // Last: +10% of BASE
            const finalPlus = base * 0.10;
            const finalValue = base + finalPlus;
            const finalTruncated = truncate1Decimal(finalValue);

            const td = document.createElement("td");
            td.textContent = finalTruncated.toFixed(1);
            td.style.cursor = "pointer";
            td.onclick = () => {
                document.getElementById("price").value = finalTruncated;
                correctInjectFields();
            };
            row.appendChild(td);

            priceTableBody.appendChild(row);
            percentSeedInput.value = "";
        });


        percentSeedInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); // Prevent form submission or reload
                addRowBtn.click(); // Trigger the same function as button
            }
        });


        document.querySelectorAll('[data-quantity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const qty = btn.getAttribute('data-quantity');
                document.getElementById('quantity').value = qty;
                correctInjectFields();

                // Remove active class from all
                document.querySelectorAll('[data-quantity]').forEach(b => b.classList.remove('active'));

                // Add active to clicked one
                btn.classList.add('active');
            });
        });

        // After injecting the form
        document.getElementById("delete-pending-prices").addEventListener("click", () => {
            if (confirm("⚠️ Are you sure you want to delete ALL pending prices?")) {
                localStorage.removeItem("pending_prices");
                allPrices = [];
                successPrices = [];
                console.log("✅ All pending prices deleted.");
                alert("All pending prices cleared!");
            }
        });


        document.getElementById("first-order-btn").addEventListener("click", () => {
            try {
                // ✅ Always regenerate fresh prices
                localStorage.removeItem("pending_prices");
                generatePricePoints();

                let ltp = null;
                let high = null;
                let preClose = null;

                const blocks = document.querySelectorAll(".order__form--prodtype");

                blocks.forEach(block => {
                    const label = block.querySelector("label")?.innerText?.trim().toLowerCase();
                    if (!label) return;

                    if (label === "ltp") {
                        const rawText = block.textContent || "";
                        const matches = rawText.match(/([\d,]+\.\d+)/);
                        if (matches && matches[1]) {
                            ltp = parseFloat(matches[1].replace(/,/g, ""));
                        }
                    }

                    if (label === "high") {
                        const bTag = block.querySelector("b");
                        if (bTag) {
                            high = parseFloat(bTag.innerText.replace(/,/g, ""));
                        } else {
                            const rawText = block.textContent || "";
                            const matches = rawText.match(/([\d,]+\.\d+)/);
                            if (matches && matches[1]) {
                                high = parseFloat(matches[1].replace(/,/g, ""));
                            }
                        }
                    }

                    if (label === "pre close") {
                        const rawText = block.textContent || "";
                        const match = rawText.match(/([\d,]+\.\d+)/);
                        if (match && match[1]) {
                            preClose = parseFloat(match[1].replace(/,/g, ""));
                        }
                    }
                });

                if (ltp !== null && high !== null) {
                    console.log("✅ Captured LTP:", ltp, "| HIGH:", high);

                    // Update floating panel
                    document.getElementById("ltp").value = ltp;
                    document.getElementById("price").value = high;
                    document.getElementById("quantity").value = 10;

                    if (preClose !== null) {
                        document.getElementById("percent-seed").value = preClose;
                        document.getElementById("add-percent-row").click();
                        console.log("✅ Pre Close used:", preClose);
                    } else {
                        alert("❌ Pre Close not found.");
                    }

                    correctInjectFields();

                    // Update real page form inputs
                    const priceInput = document.querySelector('input[formcontrolname="price"]');
                    const qtyInput = document.querySelector('input[formcontrolname="quantity"]');

                    if (priceInput) {
                        priceInput.value = high;
                        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    if (qtyInput) {
                        qtyInput.value = 10;
                        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    // ✅ Auto-click BUY button
                    const buttons = document.querySelectorAll("button.btn-primary");
                    const buyButton = Array.from(buttons).find(btn => btn.textContent.trim().toUpperCase() === "BUY");

                    if (buyButton && !buyButton.disabled) {
                        buyButton.click();
                        console.log("✅ BUY button clicked automatically");
                    } else {
                        console.error("❌ BUY button not found or disabled");
                        alert("❌ BUY button not found or disabled");
                    }

                } else {
                    console.error("❌ Could not capture LTP or HIGH");
                    alert("❌ Could not capture LTP or HIGH values. Please refresh or check structure.");
                }

            } catch (error) {
                console.error("❌ Fatal error in First Order button:", error);
                alert("❌ Error capturing LTP / HIGH");
            }
        });





        document.getElementById("use-preclose-btn").addEventListener("click", () => {
            const blocks = document.querySelectorAll(".order__form--prodtype");
            let preClose = null;

            blocks.forEach(block => {
                const label = block.querySelector("label")?.innerText?.trim().toLowerCase();
                if (label === "pre close") {
                    const raw = block.textContent || "";
                    const match = raw.match(/([\d,]+\.\d+)/);
                    if (match && match[1]) {
                        preClose = parseFloat(match[1].replace(/,/g, ""));
                    }
                }
            });

            if (preClose !== null) {
                document.getElementById("percent-seed").value = preClose;
                document.getElementById("add-percent-row").click();
                console.log("✅ Pre Close used:", preClose);
            } else {
                alert("❌ Could not find 'Pre Close' value.");
            }
        });


        // Add this after document.body.appendChild(formDiv)
        document.getElementById("get__it").addEventListener("click", () => {
            const symbolId = document.getElementById("symbol__id").value;
            if (!symbolId) {
                alert("Please enter a Symbol ID");
                return;
            }

            fetchStockQuote(symbolId);
        });


    }

//end of inject form

    function fetchStockQuote(symbolId) {
        const url = `https://tms44.nepsetms.com.np/tmsapi/rtApi/ws/stockQuote/${symbolId}`;

        // Get headers from textarea and parse them
        const rawHeaders = document.getElementById("inject-header1").value;
        const headers = parseHeaders(rawHeaders);

        console.log(`Fetching stock quote for symbol ID: ${symbolId}`);
        console.log("Using headers:", headers);

        fetch(url, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Stock Quote Data:", data);

                // Extract the first item from payload.data array
                const stockData = data.payload.data[0];

                // Update LTP field
                if (stockData.ltp) {
                    document.getElementById("ltp").value = stockData.ltp;

                    // Calculate and set price as LTP + 2%
                    const priceWith2Percent = stockData.ltp * 1.02;
                    document.getElementById("price").value = Math.floor(priceWith2Percent * 10) / 10;
                }

                // Update symbol field if available
                if (stockData.security?.id) {
                    document.getElementById("symbol").value = stockData.security.id;
                }

                // Handle percent-seed based on closePrice and openPrice
                if (stockData.closePrice) {
                    const percentSeed = document.getElementById("percent-seed");
                    percentSeed.value = stockData.closePrice;
                    // Trigger click on add-percent-row button
                    document.getElementById("add-percent-row").click();

                    // Check if openPrice is different from closePrice
                    if (stockData.openPrice && stockData.openPrice !== stockData.closePrice) {
                        percentSeed.value = stockData.openPrice;
                        // Trigger click on add-percent-row button
                        document.getElementById("add-percent-row").click();
                    }


                }

                // Update all form fields
                correctInjectFields();


            })
            .catch(error => {
                console.error("Error fetching stock quote:", error);
                alert(`Error fetching data: ${error.message}`);
            });
    }

// Your existing parseHeaders function will be used
    function parseHeaders(raw) {
        const lines = raw.trim().split(/\r?\n/);
        const headers = {};

        for (const line of lines) {
            const [key, ...vals] = line.split(":");
            const name = key?.trim();
            const value = vals.join(":").trim();

            // Reject invalid keys (empty or start with ':')
            if (
                !name ||
                name.startsWith(":") ||
                !/^[\w!#$%&'*+.^_`|~-]+$/.test(name)
            ) {
                continue;
            }

            headers[name] = value;
        }

        return headers;
    }

    function loadPendingPrices() {
        const saved = localStorage.getItem("pending_prices");
        if (saved) {
            allPrices = JSON.parse(saved);
            console.log("✅ Restored saved pending prices:", allPrices);
        } else {
            generatePricePoints();
        }
    }

    function savePendingPrices() {
        localStorage.setItem("pending_prices", JSON.stringify(allPrices));
    }



    function generatePricePoints() {
        const ltp = parseFloat(document.getElementById("ltp").value);
        const up = ltp + (ltp * 0.02);
        const down = ltp - (ltp * 0.02);
        const step = 0.1;

        // allPrices = [];

        const upperLimit = Math.floor(up * 10) / 10;
        let lowerLimit = Math.ceil(down * 10) / 10;

        // 🔒 Ensure lowerLimit is not mistakenly rounded down due to floating-point precision
        if (lowerLimit <= down) {
            lowerLimit += 0.1;
            lowerLimit = Math.round(lowerLimit * 10) / 10;
        }

        for (let p = lowerLimit; p <= upperLimit + 0.001; p += step) {
            const price = Math.round(p * 10) / 10;
            allPrices.push(price);
        }

        console.log(`✅ Final Range: ${lowerLimit} → ${upperLimit}`);
        console.log("✅ Final Price List:", allPrices);
        savePendingPrices();
    }





    function addOrderRecord(price, quantity, orderNumber) {
        const table = document.getElementById('order-records-table').querySelector('tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${price}</td>
      <td>${quantity}</td>
      <td>${orderNumber}</td>
    `;
        table.appendChild(row);
    }


    function updateContentLengthInHeader() {
        const headerTextarea = document.getElementById("inject-header");
        const bodyTextarea = document.getElementById("inject-body");
        const body = bodyTextarea.value || "";

        // Calculate actual byte length
        const encoder = new TextEncoder();
        const contentLength = encoder.encode(body).length;

        // Parse headers while preserving original structure
        const lines = headerTextarea.value.split('\n');
        let foundContentLength = false;

        // Update or add content-length header
        const updatedLines = lines.map(line => {
            const trimmed = line.trim();

            // Skip empty lines
            if (!trimmed) return line;

            // Handle HTTP/2 pseudo-headers (start with :)
            if (trimmed.startsWith(':')) return line;

            // Check if this is the content-length line
            if (trimmed.toLowerCase().startsWith('content-length:')) {
                foundContentLength = true;
                return `content-length: ${contentLength}`;
            }

            return line;
        });

        // Add content-length if it didn't exist
        if (!foundContentLength) {
            updatedLines.push(`content-length: ${contentLength}`);
        }

        // Update the textarea (only if changed)
        const newValue = updatedLines.join('\n');
        if (headerTextarea.value !== newValue) {
            headerTextarea.value = newValue;
        }
    }

    function resetCounters() {
        // Ensure requestCounters exists
        if (!window.requestCounters) {
            window.requestCounters = {
                success: 0,
                fail: 0,
                pending: 0
            };
        } else {
            window.requestCounters.success = 0;
            window.requestCounters.fail = 0;
            window.requestCounters.pending = 0;
        }
        updateCountersDisplay();
    }

    function updateCountersDisplay() {
        // Ensure requestCounters exists
        if (!window.requestCounters) {
            window.requestCounters = {
                success: 0,
                fail: 0,
                pending: 0
            };
        }

        // Update the DOM elements
        document.getElementById("success-counter").textContent = window.requestCounters.success;
        document.getElementById("fail-counter").textContent = window.requestCounters.fail;
        document.getElementById("pending-counter").textContent = window.requestCounters.pending;
    }

    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and content
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
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
                    // Switch to the Order tab
                    document.querySelector('.tab-button[data-tab="order"]').click();
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


    }

    function startRegularRequests() {
        stopAllRequests(); // Safety: stop any existing intervals
        successCount = 0; // Reset the success counter when starting new requests

        const rawHeader = document.getElementById("inject-header").value;
        const body = document.getElementById("inject-body").value;
        const headers = parseHeaders(rawHeader);

        const price = parseFloat(document.getElementById("price").value);
        const quantity = parseInt(document.getElementById("quantity").value);

        const perSec = parseInt(document.getElementById("per_sec_request")?.value || "1");
        const delay = perSec > 0 ? Math.floor(1000 / perSec) : 1000;

        interval = setInterval(() => {
            sendTradeRequest(headers, body, price, quantity, null, true);
        }, delay);
    }

    function stopRegularRequests() {
        clearInterval(interval);
        interval = null;
    }

    function startRandomPriceRequests() {
        stopAllRequests(); // Clear previous runs
        const ltp = parseFloat(document.getElementById("ltp").value);
        const upper = parseFloat(document.getElementById("price").value);
        const statusDiv = document.getElementById("random-status");

        if (isNaN(ltp) || isNaN(upper)) {
            alert("Invalid LTP or Price");
            return;
        }

        loadPendingPrices(); // Load or generate allPrices
        successPrices = []; // Reset success tracking

        // ✅ Split into two batches
        const lowerToLTP = allPrices.filter(p => p <= ltp);
        const LTPToUpper = allPrices.filter(p => p > ltp);

        // Send both batches with 1-second delay between them
        sendAllPrices(lowerToLTP, "lowerToLTP");
        setTimeout(() => sendAllPrices(LTPToUpper, "LTPToUpper"), 1000);

        // Start retry loop from second 2 onward
        setTimeout(() => retryUntilSuccess(), 2000);

        statusDiv.textContent = `📤 Sending ${allPrices.length} prices in batches...`;
    }





    function stopRandomPriceRequests() {
        clearInterval(randomInterval);
        randomInterval = null;
        keepRetrying = false; // 🔒 Stop further retries
        document.getElementById("random-status").textContent = "";
    }


    function stopAllRequests() {
        stopRegularRequests();
        stopRandomPriceRequests();
    }

    function sendTradeRequest(headers, body, price, quantity, callback, respectStopOnSuccess = true) {


        if (!window.requestCounters) {
            window.requestCounters = { success: 0, fail: 0, pending: 0 };
        }
        if (!window.requestHistory) {
            window.requestHistory = [];
        }

        window.requestCounters.pending++;
        updateCountersDisplay();

        const logEntry = {
            timestamp: new Date().toISOString(),
            requestHeaders: headers,
            requestBody: body,
            responseStatus: null,
            responseBody: null
        };


        let safeHeaders = sanitizeHeaders(headers);
        fetch("https://tms44.nepsetms.com.np/tmsapi/orderApi/order/", {
            method: "POST",
            headers: safeHeaders, // ✅ Use sanitized headers
            body,
            credentials: "include"
        })
            .then(res => {
                logEntry.responseStatus = res.status;
                return res.text().then(text => {
                    logEntry.responseBody = text;
                    return { status: res.status, text };
                });
            })
            .then(({ status, text }) => {
                window.requestHistory.push(logEntry);

                const isSuccess = (() => {
                    try {
                        const responseObj = JSON.parse(text);
                        return responseObj.status === "200" || status === 200;
                    } catch {
                        return false;
                    }
                })();

                if (isSuccess) {
                    window.requestCounters.success++;
                    successCount++; // Increment the success counter
                    showSuccessAlert();

                    // Record order number
                    const firstOrderCell = document.querySelector('table.table--data tbody tr td.text-center');
                    if (firstOrderCell) {
                        const orderNumber = firstOrderCell.textContent.trim();
                        if (orderNumber) {
                            addOrderRecord(price, quantity, orderNumber);
                            if (!window.successOrderNumbers.includes(orderNumber)) {
                                window.successOrderNumbers.push(orderNumber);
                            }
                        }
                    }


                    if (respectStopOnSuccess &&
                        document.getElementById("stop-on-success")?.checked &&
                        successCount >= REQUIRED_SUCCESS_COUNT) {
                        stopRegularRequests();

                    }

                } else {
                    window.requestCounters.fail++;
                }

                window.requestCounters.pending--;
                updateCountersDisplay();

                if (typeof callback === "function") callback(isSuccess);
            })
            .catch(error => {
                console.log(error);
                logEntry.responseBody = `Request failed: ${error}`;
                window.requestHistory.push(logEntry);
                window.requestCounters.fail++;
                window.requestCounters.pending--;
                updateCountersDisplay();
                if (typeof callback === "function") callback(false);
            });
    }

    // Replace your existing sanitizeHeaders function with this improved version:
    function sanitizeHeaders(headers) {
        const clean = {};

        // List of valid header names that are allowed in fetch
        const validHeaderNames = [
            "accept", "accept-charset", "accept-encoding", "accept-language",
            "accept-ranges", "access-control-allow-credentials", "access-control-allow-headers",
            "access-control-allow-methods", "access-control-allow-origin",
            "access-control-expose-headers", "access-control-max-age",
            "access-control-request-headers", "access-control-request-method",
            "age", "allow", "authorization", "cache-control", "connection",
            "content-disposition", "content-encoding", "content-language",
            "content-length", "content-location", "content-range", "content-type",
            "cookie", "date", "etag", "expect", "expires", "from", "host",
            "if-match", "if-modified-since", "if-none-match", "if-range",
            "if-unmodified-since", "last-modified", "location", "max-forwards",
            "pragma", "proxy-authenticate", "proxy-authorization", "range", "referer",
            "retry-after", "sec-websocket-extensions", "sec-websocket-key",
            "sec-websocket-origin", "sec-websocket-protocol", "sec-websocket-version",
            "server", "set-cookie", "set-cookie2", "te", "trailer", "transfer-encoding",
            "upgrade", "user-agent", "vary", "via", "warning", "www-authenticate",
            // Custom headers commonly used
            "x-requested-with", "x-csrf-token", "x-xsrf-token"
        ];

        // Process each header
        for (let key in headers) {
            // Skip pseudo headers (starting with :) and empty keys
            if (key.startsWith(":") || !key.trim()) {
                continue;
            }

            // Normalize key to lowercase
            const normalizedKey = key.toLowerCase().trim();

            // Skip if it's not in our whitelist (for safety)
            // You can comment this out if you need custom headers
            // if (!validHeaderNames.includes(normalizedKey)) {
            //     console.warn(`Skipping non-standard header: ${normalizedKey}`);
            //     continue;
            // }

            // Make sure value is a string
            let value = headers[key];
            if (value === null || value === undefined) {
                continue; // Skip null/undefined values
            }

            // Convert value to string if it's not already
            if (typeof value !== 'string') {
                value = String(value);
            }

            // Add to clean headers
            clean[normalizedKey] = value;
        }

        return clean;
    }

    function sendAllPrices(prices, batchName = "batch") {
        console.log(`🚀 Sending ${prices.length} prices for batch: ${batchName}`);

        const rawHeader = document.getElementById("inject-header").value;
        const headers = parseHeaders(rawHeader);
        const baseBody = document.getElementById("inject-body").value;
        const quantity = parseInt(document.getElementById("quantity").value);
        const symbol = parseInt(document.getElementById("symbol").value);

        prices.forEach((price) => {
            if (successPrices.includes(price)) return;

            const payload = JSON.parse(baseBody);
            if (payload.orderBook) {
                payload.orderBook.orderBookExtensions?.forEach(ext => {
                    ext.orderPrice = price;
                    ext.orderQuantity = quantity;
                });
                if (payload.orderBook.security) {
                    payload.orderBook.security.id = symbol;
                }
            }

            sendTradeRequest(headers, JSON.stringify(payload), price, quantity, (success) => {
                if (success && !successPrices.includes(price)) {
                    successPrices.push(price);
                    allPrices = allPrices.filter(p => p !== price);
                    savePendingPrices();
                }
            }, false);
        });
    }

    function retryUntilSuccess() {
        const remaining = allPrices.filter(p => !successPrices.includes(p));
        if (remaining.length === 0) {
            console.log("✅ All prices placed successfully!");
            document.getElementById("random-status").textContent = "✅ All requests completed!";
            return;
        }

        console.log(`🔁 Retrying ${remaining.length} prices...`);
        sendAllPrices(remaining, "retry");

        if (keepRetrying) {
            setTimeout(retryUntilSuccess, 1000);
        }
    }







    function showSuccessAlert() {
        if (!document.getElementById("success-global-alert")) {
            const alertBox = document.createElement("div");
            alertBox.id = "success-global-alert";
            alertBox.style = `
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
            alertBox.textContent = "Order Success!";
            document.body.appendChild(alertBox);
        }

        const alert = document.getElementById("success-global-alert");
        if (!alert) return;
        alert.style.display = "block";

        clearTimeout(window.successAlertTimeout);
        window.successAlertTimeout = setTimeout(() => {
            alert.style.display = "none";
        }, 5000);
    }

    // Add this CSS for highlighting
    const highlightStyle = document.createElement('style');
    highlightStyle.textContent = `
  .highlight-green {
    background-color: #4CAF50 !important;
    color: white !important;
    font-weight: bold;
  }
`;
    document.head.appendChild(highlightStyle);

// Modified watchLTPPrice function
    function watchLTPPrice() {
        const target = document.querySelector(".order__form--prodtype.price-display");
        if (!target) return;

        const observer = new MutationObserver(() => {
            const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
            let priceText;
            let node;

            while (node = walker.nextNode()) {
                if (node.parentNode === target && /\d/.test(node.textContent)) {
                    priceText = node.textContent.trim();
                    break;
                }
            }

            if (priceText) {
                const numberText = priceText.replace(/,/g, '');
                const ltp = parseFloat(numberText);

                if (!isNaN(ltp)) {
                    document.getElementById("ltp").value = ltp;
                    showLtpAlert();
                    correctInjectFields();
                    highlightPriceTable(ltp); // Add this line
                }
            }
        });

        observer.observe(target, {childList: true, subtree: true, characterData: true});
    }

// New function to highlight the table
    function highlightPriceTable(ltp) {
        const needCheck = ltp + (ltp * 0.02);
        const table = document.getElementById("price-table");
        const cells = table.querySelectorAll("td");

        cells.forEach(cell => {
            // First remove the class to reset animation
            cell.classList.remove("highlight-green");
            void cell.offsetWidth; // Trigger reflow

            const cellValue = parseFloat(cell.textContent);
            if (!isNaN(cellValue) && needCheck <= cellValue) {
                cell.classList.add("highlight-green");
            }
        });
    }

// Initialize the highlighting when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we already have an LTP value
        const initialLtp = parseFloat(document.getElementById("ltp").value);
        if (!isNaN(initialLtp)) {
            highlightPriceTable(initialLtp);
        }
    });

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

        // Update displayed info in request tab
        document.getElementById("display-symbol").textContent = symbol_id;
        document.getElementById("display-quantity").textContent = quantity;
        document.getElementById("display-price").textContent = price;

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

            // Set updated and minified JSON
            textarea.value = JSON.stringify(payload); // minified, no spacing
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
}




