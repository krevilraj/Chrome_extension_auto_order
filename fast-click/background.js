chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const buyBtn = buttons.find(btn => btn.textContent.trim() === "BUY");

      if (!buyBtn) {
        console.log("BUY button not found.");
        return;
      }

      let count = 0;
      const interval = setInterval(() => {
        if (count >= 10) {
          clearInterval(interval);
          return;
        }
        buyBtn.click();
        count++;
      }, 100); // 10 clicks in 1 second (100ms apart)
    }
  });
});
