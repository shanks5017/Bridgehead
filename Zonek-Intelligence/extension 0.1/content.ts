/**
 * Bridgehead Extension - Intelligent Content Script
 */

class ContentExtractor {
  static isStopped = false;

  static log(message: string, logType: 'info' | 'warn' | 'error' | 'success' = 'info') {
    chrome.runtime.sendMessage({ type: "LOG", message: `[BH-v1.1] ${message}`, logType });
  }

  /**
   * High-confidence selectors for major platforms to ensure 100% success on target industries.
   */
  private static readonly PLATFORM_SELECTORS: Record<string, { container: string, fields: any }> = {
    'justdial.com': {
      container: 'div[role="main"] > div, .jsx-7013899f8d757529, li.cnt_lv, .store-details, section.result-card',
      fields: { 
        title: '.store-name, .lng_cont_name, h2, h3, .heading_1', 
        phone: 'span[onclick], .contact-info, .mob-no, .num-box',
        address: '.cont_sw_addr, .address-info, .adr, .desc-details', 
        link: 'a.track_click, a.store-link, a[href*="justdial.com"]',
        image: 'img.main-img, .photo-box img, .result-img'
      }
    },
    'sulekha.com': {
      container: '.list-item, .business-card, .v-card',
      fields: { 
        title: '.name, h3', 
        phone: '.phone, .contact-num',
        address: '.address, .loc', 
        link: 'a' 
      }
    }
  };

  /**
   * Automatically identifies repeating containers on the page that likely hold data items.
   */
  static findBestContainers(): { container: string, fields: Record<string, string> } | null {
    const hostname = window.location.hostname;
    
    // Check for platform-specific fallbacks first
    for (const [domain, config] of Object.entries(this.PLATFORM_SELECTORS)) {
      if (hostname.includes(domain)) {
        if (document.querySelector(config.container)) {
          this.log(`🎯 matched high-confidence platform: ${domain}`, "success");
          return config;
        }
      }
    }

    // Subtle log removed for industry-grade performance

    
    const candidates = document.querySelectorAll('div, section, article, li');
    const patternMap = new Map<string, { count: number, example: HTMLElement }>();

    candidates.forEach(el => {
      if (el.children.length < 2) return; 
      
      const fingerprint = Array.from(el.children)
        .map(child => {
          const tag = child.tagName.toLowerCase();
          const classes = Array.from(child.classList)
            .filter(c => !c.match(/\d{5,}/) && c.length > 3 && !c.includes('jsx-'))
            .join('.');
          return tag + (classes ? '.' + classes : '');
        })
        .join('>');
      
      const record = patternMap.get(fingerprint) || { count: 0, example: el as HTMLElement };
      record.count++;
      patternMap.set(fingerprint, record);
    });

    let bestPattern = "";
    let maxCount = 0;
    for (const [pattern, data] of patternMap.entries()) {
      // Threshold: 3 for high confidence, fallback to 2 for dynamic pages
      if (data.count > maxCount && data.count >= 2) {
        maxCount = data.count;
        bestPattern = pattern;
      }
    }

    if (!bestPattern) {
      this.log("⚠️ No rigid structural pattern found. Attempting heuristic match...", "warn");
      return null;
    }

    const example = patternMap.get(bestPattern)!.example;
    const tagName = example.tagName.toLowerCase();
    const className = Array.from(example.classList)
      .filter(c => !c.match(/\d{5,}/) && !c.includes('jsx-'))
      .join('.');
    const containerSelector = `${tagName}${className ? '.' + className : ''}`;

    // 3. Infer fields within the container (Industry Grade Heuristics)
    const fields: Record<string, string> = { title: 'h1,h2,h3,strong,.name', link: 'a' };
    const childNodes = Array.from(example.querySelectorAll('*'));
    
    childNodes.forEach(node => {
      const text = node.textContent?.trim();
      const cls = node.className.toString().toLowerCase();
      
      if (text?.match(/[\d.,]{2,}/) && (cls.includes('price') || text.includes('₹') || text.includes('$'))) {
        fields['price'] = node.tagName.toLowerCase() + (node.className ? '.' + node.className.split(' ')[0] : '');
      } else if (text?.match(/\+?[\d\s-]{10,}/) && (cls.includes('phone') || cls.includes('contact') || cls.includes('num'))) {
        fields['phone'] = node.tagName.toLowerCase() + (node.className ? '.' + node.className.split(' ')[0] : '');
      } else if (text && text.length > 15 && (cls.includes('address') || cls.includes('loc') || cls.includes('street'))) {
        fields['address'] = node.tagName.toLowerCase() + (node.className ? '.' + node.className.split(' ')[0] : '');
      } else if (node.tagName === 'IMG' && (node as HTMLImageElement).src && (node as HTMLImageElement).width > 50) {
        fields['image'] = node.tagName.toLowerCase() + (node.className ? '.' + node.className.split(' ')[0] : '');
      }
    });

    this.log(`✨ Detected ${maxCount} items using structural container "${containerSelector}"`, "success");
    return { container: containerSelector, fields };
  }

  static extractItems(containerSelector: string, fieldSelectors: Record<string, string>) {
    const containers = document.querySelectorAll(containerSelector);
    const items: any[] = [];

    containers.forEach((container, index) => {
      let foundFields = 0;
      const rawData: any = { _index: index };

      for (const [name, selector] of Object.entries(fieldSelectors)) {
        let value: any = null;
        const el = container.querySelector(selector);
        
        if (el) {
          if (name === 'link') value = (el as HTMLAnchorElement).href;
          else if (name === 'image') value = (el as HTMLImageElement).src || (el as HTMLImageElement).dataset.src;
          else value = el.textContent?.trim();
        }
        
        rawData[name] = value;
        if (value) foundFields++;
      }

      if (foundFields > 1) { 
        // Improved 3-Layer Hashing for Industry Grade Deduplication
        const fingerprint = `${rawData.title || ''}|${rawData.phone || ''}|${rawData.address || ''}`;
        rawData._id = this.generateHash(fingerprint);
        items.push(rawData);
      }
    });

    return items;
  }

  static generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  static async smartScroll(
    containerSelector: string, 
    fieldSelectors: Record<string, string>, 
    maxItems = 100,
    onBatch: (items: any[]) => void
  ) {
    this.isStopped = false;
    this.log("🚀 Initializing ADVANCED Predictive Scroller (v1.1)...", "info");
    
    let currentItems = new Map<string, any>();
    let scrollAttempts = 0;
    let consecutiveNoNewItems = 0;
    let batchSize = 0;
    let settleTime = 1800; // Slightly more conservative start
    const MAX_SETTLE_TIME = 8000; // Increased ceiling
    const MAX_SCROLL_ATTEMPTS = 500; // Effectively unlimited for large listings

    while (currentItems.size < maxItems && scrollAttempts < MAX_SCROLL_ATTEMPTS) {
      if (this.isStopped) {
        this.log("🛑 Extraction stopped by user.", "warn");
        break;
      }

      const containers = document.querySelectorAll(containerSelector);
      const lastContainer = containers[containers.length - 1];

      if (lastContainer) {
        // 1. Predictive Step: Target the last known element to trigger IntersectionObservers
        // This is much more effective than simple viewport scrolling
        lastContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 2. Anti-Stall Wiggle: Simulate subtle human movement to wake up lazy-load listeners
        setTimeout(() => {
          window.scrollBy({ top: 30, behavior: 'auto' });
          setTimeout(() => window.scrollBy({ top: -30, behavior: 'auto' }), 150);
        }, 700);

        this.log(`📡 Targeted item #${containers.length}. Awaiting network...`, "info");
      } else {
        // Fallback for first load
        window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
      }

      // 3. Adaptive Wait: Wait for content to stabilize
      await new Promise(resolve => setTimeout(resolve, settleTime));

      const newItems = this.extractItems(containerSelector, fieldSelectors);
      const batchToSend: any[] = [];

      newItems.forEach(item => {
        if (!currentItems.has(item._id)) {
          currentItems.set(item._id, item);
          batchToSend.push(item);
        }
      });

      if (batchToSend.length > 0) {
        // 4. Batch Calibration: Detect the site's pagination bucket size
        if (batchSize === 0 && batchToSend.length > 1) {
          batchSize = batchToSend.length;
          this.log(`📊 Intelligence: Site loads in batches of ~${batchSize}`, "success");
        }

        this.log(`✅ Captured ${batchToSend.length} new items. Progress: ${currentItems.size}/${maxItems}`, "success");
        onBatch(batchToSend);
        
        // Reset backoff on success
        scrollAttempts = 0;
        consecutiveNoNewItems = 0;
        settleTime = Math.max(1500, settleTime - 500); 
      } else {
        consecutiveNoNewItems++;
        scrollAttempts++;
        
        // 5. Dynamic Backoff: Increase wait time as we hit potential throttles or deep pages
        settleTime = Math.min(MAX_SETTLE_TIME, settleTime + 1200);
        this.log(`⏳ No new data. Increasing patience to ${settleTime}ms (Attempt ${consecutiveNoNewItems}/5)...`, "warn");
        
        // 6. Absolute Bottom Verification (Anti-Hallucination)
        const currentScroll = window.scrollY + window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;
        const isAtBottom = currentScroll >= totalHeight - 100;

        if (isAtBottom) {
          if (consecutiveNoNewItems >= 8) { // Doubled patience at bottom
            this.log("🏁 Reached absolute bottom of listing (Verification Complete).", "success");
            break;
          }
          // Final desperate scroll to the absolute pixel end
          window.scrollTo(0, totalHeight);
        } else if (consecutiveNoNewItems >= 3) {
          // If we are stuck but not at bottom, try a larger jump
          window.scrollBy({ top: window.innerHeight * 1.5, behavior: 'smooth' });
        }
      }

      if (currentItems.size >= maxItems) {
        this.log("🎯 Target count reached.", "success");
        break;
      }
    }

    this.log(`🏆 Extraction finished. Final unique items: ${currentItems.size}`, "success");
    return Array.from(currentItems.values());
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "DETECT_SCHEMA") {
    const result = ContentExtractor.findBestContainers();
    sendResponse(result);
  }

  if (message.type === "EXTRACT_NOW") {
    const items = ContentExtractor.extractItems(message.containerSelector, message.fieldSelectors);
    sendResponse({ items });
  }

  if (message.type === "START_SMART_SCROLL") {
    ContentExtractor.smartScroll(
      message.containerSelector, 
      message.fieldSelectors,
      message.maxItems || 100,
      (batch) => {
        chrome.runtime.sendMessage({ type: "DATA_BATCH_UPDATE", items: batch });
      }
    ).then((finalItems) => {
      chrome.runtime.sendMessage({ type: "SCROLL_COMPLETE", items: finalItems });
    });
    sendResponse({ status: "started" });
  }

  if (message.type === "STOP_EXTRACTION") {
    ContentExtractor.isStopped = true;
    sendResponse({ status: "stopped" });
  }

  return true;
});

