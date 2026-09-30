import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export interface RawListing {
  _index: number;
  title: string;
  link: string;
  address: string | null;
  phone?: string | null;
  _id: string;
  _qualityScore: number;
}

export class Extractor {
  private browser: Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // UI visibility for monitoring
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    console.log("🚀 Browser Extractor Initialized.");
  }

  async reinit() {
    console.log("🛠️ Attempting browser self-healing (re-init)...");
    try {
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
    } catch (e) {}
    await this.init();
  }

  /**
   * Rapid Extraction: Extract all items from the main listing page
   */
  async extractFromUrl(
    url: string, 
    source: 'justdial' | 'sulekha',
    onItemsFound?: (items: RawListing[]) => Promise<void> | void,
    workerId: number = 1
  ): Promise<RawListing[]> {
    // 🛡️ Health Check: Ensure browser is alive before starting
    if (!this.browser || !this.browser.isConnected()) {
      await this.reinit();
    }

    let page: Page;
    try {
      page = await this.browser!.newPage();
    } catch (e) {
      console.log("⚠️ Failed to create new page. Re-initializing browser...");
      await this.reinit();
      page = await this.browser!.newPage();
    }

    await page.setViewport({ width: 1440, height: 900 });

    try {
      // Pre-emptively disable popups via storage
      await this.preparePage(page);

      console.log(`[Worker ${workerId}] 🚀 Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // 🛡️ WAF / Access Denied Detection (Cloudflare / JD Security)
      const title = await page.title();
      const html = await page.content();
      if (title.includes('Access Denied') || html.includes('Cloudflare') || title.includes('Justdial - Security')) {
        throw new Error('BAN_DETECTED: Active WAF firewall blocking detected on listing page.');
      }

      // 🛡️ Modal Slayer: Initial aggressive dismissal
      await this.dismissPopups(page);

      // Wait for initial load
      console.log(`[Worker ${workerId}] ⏳ Waiting for result containers...`);
      await page.waitForSelector('div.resultbox, li.cnt_lv, .jsx-7013899f8d757529', { timeout: 15000 }).catch(() => {
        console.log(`[Worker ${workerId}] ⚠️ Initial load timeout. Proceding with deep scroll...`);
      });

      // 🔄 Industry-Grade Adaptive Scroll Engine
      const allItems = await this.smartScroll(page, source, onItemsFound, workerId);

      return allItems;
    } catch (error: any) {
      console.error(`❌ Extraction Error for ${url}:`, error.message);
      
      const isConnectionError = error.message.includes('Connection closed') || 
                                error.message.includes('Target closed') || 
                                error.message.includes('Session closed') ||
                                error.message.includes('detached');

      if (isConnectionError) {
        console.log("🚨 Connection error detected. Triggering browser heal...");
        await this.reinit().catch(() => {});
        throw error; // Rethrow to let the main loop know this category FAILED
      }

      if (error.message && error.message.includes('BAN_DETECTED')) {
          throw error; // Rethrow to trigger main auto-heal
      }
      
      // For other errors (timeout on selector, etc), return empty but don't throw
      return [];
    } finally {
      try {
        await page.close();
      } catch (e) {
        // Silently handle if page/browser already closed
      }
    }
  }

  /**
   * Internal Scraper Core: Extracts current items from the DOM
   */
  private async extractCurrentItems(page: Page, source: 'justdial' | 'sulekha'): Promise<RawListing[]> {
    return await page.evaluate((src) => {
      const PLATFORM_SELECTORS: any = {
        'justdial': {
          container: 'div.resultbox, div[role="main"] > div, .jsx-7013899f8d757529',
          fields: {
            title: 'a.resultbox_title_anchorbox, .store-name, .lng_cont_name, h2, h3',
            phone: '.callNowAnchor, span[onclick], .contact-info, .num-box',
            address: 'address, .cont_sw_addr, .address-info, .adr',
            link: 'a.resultbox_title_anchorbox, a.track_click, a.store-link'
          }
        },
        'sulekha': {
          container: '.list-item, .business-card, .v-card',
          fields: {
            title: '.name, h3',
            phone: '.phone, .contact-num',
            address: '.address, .loc',
            link: 'a'
          }
        }
      };

      const config = PLATFORM_SELECTORS[src];
      if (!config) return [];

      const containers = document.querySelectorAll(config.container);
      const results: any[] = [];

      containers.forEach((container, index) => {
        const titleElement = container.querySelector(config.fields.title);
        const title = titleElement?.textContent?.trim() || '';
        const phone = container.querySelector(config.fields.phone)?.textContent?.trim() || null;
        const address = container.querySelector(config.fields.address)?.textContent?.trim() || null;
        const link = (container.querySelector(config.fields.link) as any)?.href || '';

        if (title) {
          let foundFields = 0;
          if (title) foundFields++;
          if (phone) foundFields++;
          if (address) foundFields++;
          if (link) foundFields++;

          // Fingerprint Strategy: Ensure unique IDs for deduplication
          const fingerprint = `${title}|${phone || ''}|${address || ''}`;
          let hash = 0;
          for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
          }
          const _id = Math.abs(hash).toString(16);

          let _qualityScore = 67;
          if (foundFields >= 4) _qualityScore = 83;
          else if (foundFields >= 3) _qualityScore = 75;

          results.push({
            _index: index * 10,
            title,
            link,
            address,
            phone,
            _id,
            _qualityScore
          });
        }
      });

      return results;
    }, source);
  }

  /**
   * Industry-Level Adaptive Scrolling Engine [Real-Time Sync Mode]
   */
  async smartScroll(
    page: Page, 
    source: 'justdial' | 'sulekha',
    onItemsFound?: (items: RawListing[]) => Promise<void> | void,
    workerId: number = 1
  ): Promise<RawListing[]> {
    let previousCount = 0;
    let currentCount = 0;
    let idleIterationCount = 0;
    const maxIdleRetries = 6;
    const seenIds = new Set<string>();
    const allExtractedItems: RawListing[] = [];

    console.log(`[Worker ${workerId}] 📡 Starting Human-Mimic Scroll [Real-Time Sync]...`);

    let hasRefreshed = false;

    while (idleIterationCount < maxIdleRetries) {
      // 🛡️ Nuke blockers before audit
      await this.dismissPopups(page);

      // 1. Audit current items in DOM
      const currentItems = await this.extractCurrentItems(page, source);
      currentCount = currentItems.length;

      // 2. Identify and Process NEW items
      const newItems = currentItems.filter(item => !seenIds.has(item._id));
      if (newItems.length > 0) {
        newItems.forEach(item => {
          seenIds.add(item._id);
          allExtractedItems.push(item);
        });

        console.log(`[Worker ${workerId}] 📊 Audit: C=${currentCount} | N=${newItems.length} | T=${allExtractedItems.length}`);
        
        // 🚀 Real-Time Callback: Stream new items to the caller
        if (onItemsFound) {
          await onItemsFound(newItems);
        }

        previousCount = currentCount;
        idleIterationCount = 0; // Progress made
      } else if (currentCount === 0 && previousCount > 0) {
        // ⏳ Resilience Wait: If count suddenly hits 0, wait 2s to see if it's just a rendering lag
        console.log("⏳ Audit hit 0. Waiting 2s for DOM stabilization...");
        await new Promise(r => setTimeout(r, 2000));
        const retryItems = await this.extractCurrentItems(page, source);
        currentCount = retryItems.length;
        console.log(`📊 Re-Audit: ${currentCount} items.`);
      }

      // Check if we gained new ground
      if (newItems.length === 0) {
        // 🛡️ REFRESH RECOVERY: If count drops significantly or stays low, try a reload once
        if (currentCount <= 5 && allExtractedItems.length > 10 && !hasRefreshed) {
          console.log("🔄 Emergency Refresh Triggered: Page went blank/stalled. Reloading...");
          hasRefreshed = true;
          
          await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
          await this.dismissPopups(page);
          await new Promise(r => setTimeout(r, 4000)); // Allow reload to settle
          continue; // Resume loop with fresh start
        }

        idleIterationCount++;
        console.log(`⚠️ Batch load delay or Bottom reached (Attempt ${idleIterationCount}/${maxIdleRetries})`);
      }

      // 2. Targeted Scroll: Aim for the BOTTOM OF THE LAST ITEM
      const targetY = await page.evaluate(() => {
        const itemSelectors = ['div.resultbox', 'li.cnt_lv', '.jsx-7013899f8d757529'];
        let lastItem: Element | null = null;
        for (const sel of itemSelectors) {
          const items = document.querySelectorAll(sel);
          if (items.length > 0) {
            lastItem = items[items.length - 1];
            break;
          }
        }

        if (!lastItem) return window.scrollY + 800;

        const rect = lastItem.getBoundingClientRect();
        return window.pageYOffset + rect.top + rect.height + 100;
      });

      // Execute smooth targeted scroll
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), targetY);

      // 🛡️ Nuke-on-Sight: Slayer check after positioning
      await this.dismissPopups(page);

      // ⏳ ADAPTIVE LATENCY: Wait for slow network load (3.5s for reliability)
      await new Promise(r => setTimeout(r, 3500));

      // 🔄 SELF-HEALING "READ-UP": Mimic a human scrolling back up slightly to reset trigger
      if (idleIterationCount > 2) {
        await page.evaluate(() => window.scrollBy(0, -300));
        await new Promise(r => setTimeout(r, 1000));
        await page.evaluate(() => window.scrollBy(0, 300));
      }

      // Final count verify: Limit to 500 as per safety logic
      if (allExtractedItems.length >= 500) break;
    }

    console.log(`✅ Deep-Scan Finalized. Extracted ${allExtractedItems.length} unique listings.`);
    return allExtractedItems;
  }

  /**
   * Modal Slayer: Automatically dismisses or deletes blocking popups
   */
  private async dismissPopups(page: Page) {
    try {
      await page.evaluate(() => {
        const modalSelectors = [
          '.jd_modal', 
          '.jd_abdbestdeal_pop', 
          '.jd_bestdeal_pop',
          'section.jsx-937ec4c0a2ba917a', 
          '.outside_content_jd_bd',
          '.modal-backdrop',
          '.fixed-overlay',
          '.jsx-eb4cdf9eefe6a90c'
        ];
        
        const modals = document.querySelectorAll(modalSelectors.join(', '));
        if (modals.length > 0) {
          modals.forEach(modal => {
            const closeBtn = modal.querySelector('.jd_modal_close_bd, .jd_modal_close, [aria-label="Best deal Modal Close Icon"]');
            if (closeBtn) (closeBtn as HTMLElement).click();
            modal.remove();
          });
          // --- FORCE HEAL DOM ---
          document.body.style.overflow = 'auto';
          document.body.style.position = 'static';
          document.documentElement.style.overflow = 'auto';

          // Force visibility on possible hidden containers
          const containers = document.querySelectorAll('#tab-1, .resultbox_container, [role="main"]');
          containers.forEach(c => {
            (c as HTMLElement).style.display = 'block';
            (c as HTMLElement).style.visibility = 'visible';
            (c as HTMLElement).style.opacity = '1';
          });
        }
      });
      await page.keyboard.press('Escape');
    } catch (e) { }
  }

  /**
   * Pre-emptively disable popups via storage
   */
  async preparePage(page: Page) {
    try {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('skip_login', 'true');
        localStorage.setItem('popup_shown', 'true');
        localStorage.setItem('login_popup_shown', 'true');
        localStorage.setItem('jd_modal_closed', 'true');
      });
    } catch (e) { }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
