/**
 * Bridgehead Extension - Popup Logic
 */

const APP_URL = "https://ais-dev-ltv74vh4dv54nfbgue4s65-369435410575.asia-southeast1.run.app";

document.getElementById('extractBtn')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = "Analyzing page...";

  // 1. Initialize session with backend
  const sessionId = `ext_${Date.now()}`;
  chrome.runtime.sendMessage({
    type: "INIT_SESSION",
    appUrl: APP_URL,
    sessionId,
    website: new URL(tab.url!).hostname,
    url: tab.url
  });

  // 2. Trigger extraction in content script
  // For demo, we use a generic schema. In production, this would be auto-detected by Gemini.
  chrome.tabs.sendMessage(tab.id, {
    type: "EXTRACT_NOW",
    containerSelector: "div, section, article", // Broad for demo
    fieldSelectors: {
      title: "h1, h2, h3, .title",
      price: ".price, .amount",
      link: "a"
    }
  }, (response) => {
    if (response?.items) {
      if (statusEl) statusEl.textContent = `Extracted ${response.items.length} items`;
      const itemCountEl = document.getElementById('itemCount');
      if (itemCountEl) itemCountEl.textContent = `${response.items.length} items extracted`;

      // 3. Send data to background for backend sync
      chrome.runtime.sendMessage({
        type: "DATA_BATCH",
        sessionId,
        batchId: "batch_1",
        items: response.items
      });

      // 4. Complete session
      chrome.runtime.sendMessage({ type: "COMPLETE_SESSION", sessionId });
    }
  });
});

document.getElementById('autoScrollBtn')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = "Auto-scrolling...";

  chrome.tabs.sendMessage(tab.id, {
    type: "START_AUTO_SCROLL",
    containerSelector: "div",
    fieldSelectors: { title: "h2" }
  });
});
