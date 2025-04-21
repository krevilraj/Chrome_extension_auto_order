document.addEventListener("DOMContentLoaded", () => {
    // Calculator + data-value logic
    const input = document.getElementById("numberInput");
    const btn = document.getElementById("calculateBtn");
    const res1 = document.getElementById("result1");
    const res2 = document.getElementById("result2");
    const priceInput = document.getElementById("price");
    const quantityInput = document.getElementById("quantity");

    // 🔁 Restore values from localStorage
    input.value = localStorage.getItem("popup_numberInput") || "";
    priceInput.value = localStorage.getItem("popup_price") || "";
    quantityInput.value = localStorage.getItem("popup_quantity") || "";

    // 🔄 Save to localStorage on input change
    input.addEventListener("input", () => {
        localStorage.setItem("popup_numberInput", input.value);
    });

    priceInput.addEventListener("input", () => {
        localStorage.setItem("popup_price", priceInput.value);
    });

    quantityInput.addEventListener("input", () => {
        localStorage.setItem("popup_quantity", quantityInput.value);
    });

    // Load saved values from localStorage
    const savedNumber = localStorage.getItem("popup_numberInput");
    const savedPrice = localStorage.getItem("popup_price");
    const savedQuantity = localStorage.getItem("popup_quantity");

    if (savedNumber !== null) input.value = savedNumber;
    if (savedPrice !== null) priceInput.value = savedPrice;
    if (savedQuantity !== null) quantityInput.value = savedQuantity;

    // Inject style
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) return;

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                const style = document.createElement("style");
                style.textContent = `
          .box-order-entry.blur__options {
            filter: unset !important;
          }
        `;
                document.head.appendChild(style);
                console.log("✅ Style injected by popup");
            },
        });
    });

    // Remove disabled from BUY button
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) return;

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                const buttons = document.querySelectorAll("button");
                const buyBtn = Array.from(buttons).find(
                    (btn) => btn.textContent.trim().toUpperCase() === "BUY"
                );
                if (buyBtn) {
                    buyBtn.removeAttribute("disabled");
                    buyBtn.disabled = false;
                    console.log("✅ BUY button enabled");
                } else {
                    console.log("❌ BUY button not found");
                }
            },
        });
    });

    function truncateToOneDecimal(num) {
        return Math.floor(num * 10) / 10;
    }


    btn.addEventListener("click", function () {
        const x = parseFloat(input.value);

        if (!isNaN(x)) {
            const result1 = truncateToOneDecimal(x * 1.02);
            const result2 = truncateToOneDecimal(x * 1.10);

            res1.textContent = `x + 2% of x = ${result1}`;
            res2.textContent = `x + 10% of x = ${result2}`;

            res1.setAttribute("data-value", result1);
            res2.setAttribute("data-value", result2);
        } else {
            res1.textContent = "Please enter a valid number.";
            res2.textContent = "";
            res1.setAttribute("data-value", "");
            res2.setAttribute("data-value", "");
        }
    });


    res1.addEventListener("click", () => {
        const value = res1.getAttribute("data-value");
        if (value) {
            priceInput.value = value;
            localStorage.setItem("popup_price", priceInput.value);

            // Inject into active tab input[formcontrolname="price"]
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    args: [value],
                    func: (val) => {
                        const priceField = document.querySelector('input[formcontrolname="price"]');
                        if (priceField) {
                            priceField.value = val;
                            priceField.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    },
                });
            });
        }
    });

    res2.addEventListener("click", () => {
        const value = res2.getAttribute("data-value");
        if (value) {
            priceInput.value = value;
            localStorage.setItem("popup_price", priceInput.value);
            // Inject into active tab input[formcontrolname="quantity"]
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    args: [value],
                    func: (val) => {
                        const qtyField = document.querySelector('input[formcontrolname="price"]');
                        if (qtyField) {
                            qtyField.value = val;
                            qtyField.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    },
                });
            });
        }
    });

    document.getElementById("fill_inputs").addEventListener("click", () => {
        const priceVal = document.getElementById("price").value.trim();
        const quantityVal = document.getElementById("quantity").value.trim();

        if (!priceVal && !quantityVal) {
            console.log("No values to fill.");
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;

            chrome.scripting.executeScript({
                target: { tabId },
                args: [priceVal, quantityVal],
                func: (price, qty) => {
                    const priceInput = document.querySelector('input[formcontrolname="price"]');
                    const qtyInput = document.querySelector('input[formcontrolname="quantity"]');

                    if (priceInput && price) {
                        priceInput.value = price;
                        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    if (qtyInput && qty) {
                        qtyInput.value = qty;
                        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });
        });
    });


    let clickInterval = null;

    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");
    const status = document.getElementById("status");

    startBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;

            if (clickInterval) clearInterval(clickInterval); // in case already running

            clickInterval = setInterval(() => {
                chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                        const buttons = document.querySelectorAll("button");
                        const buyBtn = Array.from(buttons).find(
                            btn => btn.textContent.trim().toUpperCase() === "BUY"
                        );
                        if (buyBtn && !buyBtn.disabled) {
                            buyBtn.click();
                            console.log("BUY clicked");
                        }
                    }
                });
            }, 10); // 100 clicks per second (10ms interval)
        });

        status.textContent = "🚀 Clicking BUY every 10ms (100/sec)";
    });


    stopBtn.addEventListener("click", () => {
        clearInterval(clickInterval);
        clickInterval = null;
        status.textContent = "Stopped clicking.";
    });





});
