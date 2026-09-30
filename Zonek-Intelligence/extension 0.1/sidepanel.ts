/**
 * Bridgehead Sidepanel — Production Controller
 *
 * Architecture principles:
 *  1. All DOM access happens AFTER DOMContentLoaded — never at module level.
 *  2. Tab switching is direct DOM manipulation — no state machine in the middle.
 *  3. appendCard never calls render() — render() is only for button/status state.
 *  4. chrome.runtime.onMessage is registered inside DOMContentLoaded so DOM refs exist.
 */
import { DataProcessor } from "./data-processor";
import { ExportProcessor } from "./export-processor";

const APP_URL = "http://localhost:3000";

// ── Schema & session (non-DOM state, safe at module level) ───
let schema: { container: string; fields: Record<string, string> } | null = null;
let currentItems: any[] = [];
let sessionId = "";
let isExtracting = false;
let itemCount = 0;

// ── Tiny helpers ─────────────────────────────────────────────
function ts(): string {
  return new Date().toLocaleTimeString([], { hour12: false });
}

async function activeTab(): Promise<chrome.tabs.Tab | null> {
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  return t ?? null;
}

/**
 * Robustly sends a message to a tab, injecting the content script if necessary.
 */
async function sendMessageToTab(tabId: number, message: any, log?: (msg: string, level: any) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, async (response) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message || "";
        if (error.includes("Could not establish connection") || error.includes("Receiving end does not exist")) {
          if (log) log("Content script not detected. Injecting Bridgehead Engine...", "warn");
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ["content.js"]
            });
            // Brief pause for script initialization
            await new Promise(r => setTimeout(r, 100));
            // Retry the message
            chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(retryResponse);
              }
            });
          } catch (injectError: any) {
            reject(new Error(`Manual injection failed: ${injectError.message}`));
          }
        } else {
          reject(new Error(error));
        }
      } else {
        resolve(response);
      }
    });
  });
}

// ── Bootstrap: everything inside DOMContentLoaded ────────────
document.addEventListener("DOMContentLoaded", () => {

  // ── DOM refs (Safe Selection with Error Boundaries) ────────
  const get = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

  const btnExtract  = get<HTMLButtonElement>("btnExtract");
  const btnScroll   = get<HTMLButtonElement>("btnScroll");
  const btnStop     = document.getElementById("btnStop") as HTMLButtonElement | null;
  const btnSchema   = get<HTMLButtonElement>("btnSchema");
  const panelPrev   = get<HTMLElement>("panel-preview");
  const panelTerm   = get<HTMLElement>("panel-terminal");
  const emptyMsg    = get<HTMLElement>("emptyMsg");
  const dot         = get<HTMLElement>("dot");
  const statusText  = get<HTMLElement>("statusText");
  const itemCountEl = get<HTMLElement>("itemCount");

  const btnExportCsv = document.getElementById("btnExportCsv") as HTMLButtonElement;
  const btnExportJson = document.getElementById("btnExportJson") as HTMLButtonElement;
  const btnClear = document.getElementById("btnClear") as HTMLButtonElement;
  const btnReset = document.getElementById("btnReset") as HTMLButtonElement;

  // Critical check: if core UI is missing, we can't proceed but won't crash the extension
  if (!btnExtract || !panelPrev || !panelTerm) {
    console.error("Bridgehead: Fatal UI Initialization Error. Missing core elements.");
    return;
  }

  // ── Tab switching — dead-simple, no state machine ────────
  document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Update tab buttons
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.tab;

      if (target === "preview") {
        panelPrev.style.display = "flex";
        panelTerm.style.display = "none";
      } else {
        panelPrev.style.display = "none";
        panelTerm.style.display = "block";
        // Scroll terminal to bottom
        panelTerm.scrollTop = panelTerm.scrollHeight;
      }
    });
  });

  // ── Terminal logger ───────────────────────────────────────
  function log(msg: string, level: "ok" | "info" | "warn" | "err" = "info") {
    const line = document.createElement("div");
    line.innerHTML = `<span class="lg-ts">[${ts()}]</span><span class="lg-${level}">${msg}</span>`;
    panelTerm.appendChild(line);
    panelTerm.scrollTop = panelTerm.scrollHeight;
  }

  // ── Status helpers ────────────────────────────────────────
  function setExtracting(active: boolean) {
    isExtracting = active;
    btnExtract.disabled  = active;
    btnScroll.disabled   = active;
    btnSchema.disabled   = active;
    btnStop.style.display = active ? "block" : "none";
    dot.className = active ? "dot active" : "dot";
  }

  function setStatus(text: string) {
    statusText.textContent = text;
  }

  function updateCount() {
    itemCountEl.textContent = `${itemCount} items`;
  }

  // ── Append a data card to the Live Preview panel ──────────
  function appendCard(raw: any) {
    // Hide "Waiting…" placeholder on first card
    emptyMsg.style.display = "none";

    let item: any;
    try {
      item = DataProcessor.normalizeItem(raw);
    } catch (e) {
      item = { title: raw?.title || "Listing Item", _qualityScore: 0 };
    }

    // Accumulate locally for export
    currentItems.push(item);

    const card = document.createElement("div");
    card.className = "card";

    const metaChips: string[] = [];
    if (item.phone)   metaChips.push(`<span class="chip" title="Click to copy">📞 ${item.phone}</span>`);
    if (item.address) metaChips.push(`<span class="chip" title="Click to copy">📍 Adr</span>`);
    if (item.price)   metaChips.push(`<span class="chip">💰 ${item.price}</span>`);
    metaChips.push(`<span class="chip chip-green">✓ ${item._qualityScore ?? 0}%</span>`);

    card.innerHTML = `
      ${item.image ? `<img src="${item.image}" class="card-img" onerror="this.style.display='none'">` : '<div class="card-img" style="display:flex;align-items:center;justify-content:center;font-size:24px;background:#f5f5f5;color:#ccc">🏢</div>'}
      <div class="card-content">
        <div class="card-title">${item.title || "Listing Item"}</div>
        <div class="card-meta">${metaChips.join("")}</div>
        ${item.link ? `<a class="card-link" href="${item.link}" target="_blank" rel="noreferrer">Open →</a>` : ""}
      </div>
    `;

    // Click handler for copying phone/address
    card.addEventListener('click', (e) => {
      const chip = (e.target as HTMLElement).closest('.chip');
      if (chip) {
        const text = chip.textContent?.replace(/[📞📍💰✓\s%]/g, '');
        if (text && text !== 'Adr') {
          navigator.clipboard.writeText(text);
          const original = chip.innerHTML;
          chip.innerHTML = '📋 Copied!';
          setTimeout(() => { chip.innerHTML = original; }, 1000);
        } else if (item.address && chip.textContent?.includes('Adr')) {
          navigator.clipboard.writeText(item.address);
          chip.innerHTML = '📋 Copied!';
          setTimeout(() => { chip.innerHTML = `<span class="chip">📍 Adr</span>`; }, 1000);
        }
      }
    });

    panelPrev.appendChild(card);
    panelPrev.scrollTop = panelPrev.scrollHeight;

    itemCount++;
    updateCount();
  }

  // ── Schema persistence helpers ────────────────────────────
  async function saveSchema(hostname: string, data: any) {
    chrome.storage.local.get(["schemas"], (res) => {
      const schemas = res.schemas || {};
      schemas[hostname] = { data, timestamp: Date.now() };
      chrome.storage.local.set({ schemas });
    });
  }

  async function loadSchema(hostname: string): Promise<any | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["schemas"], (res) => {
        const schemas = res.schemas || {};
        const entry = schemas[hostname];
        if (entry && (Date.now() - entry.timestamp < 24 * 60 * 60 * 1000)) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      });
    });
  }

  // ── Schema detection ──────────────────────────────────────
  async function detectSchema(tabId: number, silent = false): Promise<boolean> {
    try {
      if (!silent) setStatus("Detecting…");
      const res = await sendMessageToTab(tabId, { type: "DETECT_SCHEMA" }, silent ? undefined : log);
      if (!res) return false;
      
      schema = res;
      if (!silent) {
        log(`Schema: ${res.container}`, "ok");
        log(`Fields: ${Object.keys(res.fields).join(", ")}`, "info");
      }
      
      // Save for persistence
      const tab = await activeTab();
      if (tab?.url) {
        const { hostname } = new URL(tab.url);
        saveSchema(hostname, res);
      }
      
      return true;
    } catch (err) {
      if (!silent) log(`Schema detection error: ${err}`, "err");
      return false;
    }
  }

  // ── Session helpers ───────────────────────────────────────
  function startSession(website: string, url: string) {
    sessionId = `ext_${Date.now()}`;
    chrome.runtime.sendMessage({ type: "INIT_SESSION", appUrl: APP_URL, sessionId, website, url });
    log(`Session: ${sessionId}`, "info");
  }

  function sendBatch(items: any[]) {
    if (items.length === 0) return;
    chrome.runtime.sendMessage({ type: "DATA_BATCH", sessionId, items });
  }

  function endSession() {
    chrome.runtime.sendMessage({ type: "COMPLETE_SESSION", sessionId });
    log(`Done. ${itemCount} total items.`, "ok");
  }

  // ── Button: Auto-Detect Schema ────────────────────────────
  btnSchema?.addEventListener("click", async () => {
    const tab = await activeTab();
    if (!tab?.id) { log("No active tab.", "err"); return; }

    setStatus("Detecting schema…");
    log("Running Auto-Detect Schema…", "info");

    let ok = await detectSchema(tab.id);
    if (!ok) {
      log("Retry in 1.5 s (for lazy-loaded content)…", "warn");
      await new Promise(r => setTimeout(r, 1500));
      ok = await detectSchema(tab.id);
    }

    if (ok) {
      setStatus("Schema Ready");
    } else {
      setStatus("Ready");
      log("Detection failed. Scroll the page first, then retry.", "err");
    }
  });

  // ── Button: Start Extraction ──────────────────────────────
  btnExtract.addEventListener("click", async () => {
    try {
      const tab = await activeTab();
      if (!tab?.id || !tab.url) { log("No active tab.", "err"); return; }

      if (!schema) {
        const ok = await detectSchema(tab.id, true);
        if (!ok) {
          log("No schema found. Retrying in 1.5s...", "warn");
          setStatus("Retrying…");
          await new Promise(r => setTimeout(r, 1500));
          const retryOk = await detectSchema(tab.id);
          if (!retryOk) {
            log("Could not detect schema. Click Auto-Detect Schema first.", "err");
            setStatus("Ready");
            return;
          }
        }
      }

      setExtracting(true);
      setStatus("Extracting…");
      log("Sending EXTRACT_NOW to page…", "info");

      const { hostname } = new URL(tab.url);
      startSession(hostname, tab.url);

      const response = await sendMessageToTab(tab.id, { 
        type: "EXTRACT_NOW", 
        containerSelector: schema!.container, 
        fieldSelectors: schema!.fields 
      }, log);
      
      setExtracting(false);

      const items: any[] = response?.items ?? [];
      if (items.length > 0) {
        items.forEach(appendCard);
        sendBatch(items);
        endSession();
        setStatus(`Done — ${items.length} items`);
        log(`Extracted ${items.length} items.`, "ok");
      } else {
        log("No items returned. Try Auto-Detect Schema first, or scroll to load content.", "warn");
        setStatus("No items found");
      }
    } catch (err: any) {
      log(`Extraction crash: ${err.message}`, "err");
      setExtracting(false);
      setStatus("Error");
    }
  });

  // ── Button: Smart Scroll & Extract ───────────────────────
  btnScroll?.addEventListener("click", async () => {
    try {
      const tab = await activeTab();
      if (!tab?.id || !tab.url) { log("No active tab.", "err"); return; }

      if (!schema) {
        const ok = await detectSchema(tab.id, true);
        if (!ok) {
          log("No schema found. Retrying in 1.5s...", "warn");
          setStatus("Retrying…");
          await new Promise(r => setTimeout(r, 1500));
          const retryOk = await detectSchema(tab.id);
          if (!retryOk) {
            log("Could not detect schema. Click Auto-Detect Schema first.", "err");
            setStatus("Ready");
            return;
          }
        }
      }

      // Clear previous results
      panelPrev.querySelectorAll(".card").forEach(c => c.remove());
      if (emptyMsg) emptyMsg.style.display = "block";
      itemCount = 0;
      updateCount();

      setExtracting(true);
      setStatus("Scrolling…");
      log("Smart Scroll & Extract started…", "info");

      const { hostname } = new URL(tab.url);
      startSession(hostname, tab.url);

      sendMessageToTab(tab.id, {
        type: "START_SMART_SCROLL",
        containerSelector: schema!.container,
        fieldSelectors: schema!.fields,
        maxItems: 1000,
      }, log).catch(err => {
        log(`Smart Scroll error: ${err.message}`, "err");
        setExtracting(false);
      });
    } catch (err: any) {
      log(`Scroll crash: ${err.message}`, "err");
      setExtracting(false);
    }
  });

  // ── Button: Stop ──────────────────────────────────────────
  btnStop?.addEventListener("click", async () => {
    const tab = await activeTab();
    if (tab?.id) {
      sendMessageToTab(tab.id, { type: "STOP_EXTRACTION" }, log).catch(() => {});
    }
    setExtracting(false);
    setStatus("Stopped");
    log("Stopped by user.", "warn");
  });

  // ── Message listener (registered INSIDE DOMContentLoaded) ─
  // This guarantees DOM refs are initialized when messages arrive.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "DATA_BATCH_UPDATE" && Array.isArray(msg.items)) {
      msg.items.forEach(appendCard);
      sendBatch(msg.items);
    }
    if (msg.type === "SCROLL_COMPLETE") {
      setExtracting(false);
      setStatus(`Complete — ${itemCount} items`);
      endSession();
    }
    if (msg.type === "LOG") {
      log(msg.message, msg.logType === "success" ? "ok" : msg.logType ?? "info");
    }
  });

  // ── Initial state ─────────────────────────────────────────
  log("Bridgehead v1.1 - ADVANCED Scroller Edition ready.", "ok");
  setStatus("Ready");
  updateCount();

  // ── Auto-Detect / Load Cached Schema ──────────────────────
  (async () => {
    const tab = await activeTab();
    if (tab?.id && tab.url) {
      const { hostname } = new URL(tab.url);
      const cached = await loadSchema(hostname);
      if (cached) {
        schema = cached;
        log(`Restored schema for ${hostname}`, "info");
        setStatus("Schema Ready");
      } else {
        // Silent auto-detect attempt
        detectSchema(tab.id, true).then(ok => {
          if (ok) setStatus("Schema Ready");
        });
      }
    }
  })();

  // ── Export & Clear Handlers ──────────────────────────────
  btnExportCsv?.addEventListener("click", () => {
    if (currentItems.length === 0) return;
    try {
      const csv = ExportProcessor.toCSV(currentItems);
      ExportProcessor.download(csv, `bridgehead_${Date.now()}.csv`, "text/csv");
    } catch (err) {
      log(`Export failed: ${err}`, "err");
    }
  });

  btnExportJson?.addEventListener("click", () => {
    if (currentItems.length === 0) return;
    try {
      const json = JSON.stringify(currentItems, null, 2);
      ExportProcessor.download(json, `bridgehead_${Date.now()}.json`, "application/json");
    } catch (err) {
      log(`Export failed: ${err}`, "err");
    }
  });

  btnClear?.addEventListener("click", () => {
    chrome.storage.local.remove("lastSession");
    panelPrev.querySelectorAll(".card").forEach(c => c.remove());
    if (emptyMsg) emptyMsg.style.display = "block";
    currentItems = [];
    itemCount = 0;
    updateCount();
    log("Session cleared.", "warn");
  });

  btnReset?.addEventListener("click", () => {
    chrome.storage.local.clear();
    panelPrev.querySelectorAll(".card").forEach(c => c.remove());
    panelTerm.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    
    // Total wipe
    schema = null;
    currentItems = [];
    itemCount = 0;
    sessionId = "";
    
    setExtracting(false);
    setStatus("Ready");
    updateCount();
    
    log("--- SYSTEM RESET ---", "info");
    log("Memory cleared. Schema reset.", "ok");
    log("Bridgehead ready for new extraction.", "info");
  });

  // ── Restore last session from storage (Wrapped in Error Boundary) ──
  try {
    chrome.runtime.sendMessage({ type: "GET_LAST_SESSION" }, (res) => {
      // Background script error or missing
      if (chrome.runtime.lastError) {
        log("Background process starting up...", "warn");
        return;
      }
      
      if (res && res.items && res.items.length > 0) {
        log(`Restored session: ${res.sessionId}`, "info");
        // Clear local array to avoid double-accumulation from appendCard
        currentItems = [];
        res.items.forEach(appendCard);
      }
    });
  } catch (err) {
    console.warn("Restore failed: Service Worker unavailable.");
  }
});
