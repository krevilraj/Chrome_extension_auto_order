const checkbox = document.getElementById("toggleInject");

// Load saved value on open
chrome.storage.local.get("injectToggle", (data) => {
  checkbox.checked = data.injectToggle || false;
});

// On change, update tab and save value
checkbox.addEventListener("change", async (e) => {
  const checked = e.target.checked;

  // Save state
  chrome.storage.local.set({ injectToggle: checked });

  // Inject content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["injector.js"]
  });

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    type: "toggle_form",
    show: checked
  });
});
