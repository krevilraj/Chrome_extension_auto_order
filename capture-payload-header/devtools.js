// Create a panel in Chrome DevTools
chrome.devtools.panels.create(
    "Network Capture",           // Panel title
    "images/icon16.png",         // Panel icon
    "panel.html",                // Panel HTML page
    function(panel) {
// Panel created callback (optional)
        console.log("Network Capture panel created");
    }
);