// Listen for messages from the devtools.js or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "headersCopied") {
        // Show success message
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);

        sendResponse({ received: true });
    }
});