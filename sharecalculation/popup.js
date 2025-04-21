document.addEventListener("DOMContentLoaded", () => {
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

    // Percentage calculator logic
    const input = document.getElementById("numberInput");
    const btn = document.getElementById("calculateBtn");
    const res1 = document.getElementById("result1");
    const res2 = document.getElementById("result2");

    btn.addEventListener("click", function () {
        const x = parseFloat(input.value);

        if (!isNaN(x)) {
            const result1 = x * 1.02;
            const result2 = x * 1.10;
            res1.textContent = `x + 2% of x = ${result1.toFixed(2)}`;
            res2.textContent = `x + 10% of x = ${result2.toFixed(2)}`;
        } else {
            res1.textContent = "Please enter a valid number.";
            res2.textContent = "";
        }
    });
});
