import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export interface EnrichmentData {
  workingHours: string | null;
  rating: number | null;
  reviewCount: number | null;
  ratingCount: number | null;
  images: string[];
  phone: string[];
  overview?: string | null;
  yearEstablished?: string | null;
  services?: string[];
  quickInfo?: string[];
  priceList?: { name: string; price: string }[];
  reviewsList?: { author: string; rating: number; text: string; date: string }[];
}

export class DetailEnricher {
  private browser: Browser | null = null;
  private maxConcurrency: number;

  constructor(maxTabs: number = 5) {
    this.maxConcurrency = maxTabs;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // JD blocks headless true despite stealth plugin
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    console.log(`🚀 Worker Pool initialized with ${this.maxConcurrency} tabs (Headless Disabled for JD Bypass).`);
  }


  /**
   * Processes an array of URLs with high concurrency using a bounded worker pool.
   */
  async processBatch(urls: { id: string; url: string }[], onComplete: (id: string, data: EnrichmentData) => Promise<void>) {
    if (!this.browser) await this.init();

    let currentIndex = 0;
    
    // Worker function for a single tab
    const worker = async (workerId: number) => {
      let page = await this.browser!.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      // Disable popups
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('skip_login', 'true');
        localStorage.setItem('popup_shown', 'true');
      });

      // 🛡️ Added random human delay between navigations to avoid triggering Cloudflare rules
      const getRandomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

      while (currentIndex < urls.length) {
        const taskIndex = currentIndex++;
        const target = urls[taskIndex];
        
        try {
          console.log(`[Worker ${workerId}] Fetching: ${target.url.substring(0, 60)}...`);
          await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(r => setTimeout(r, 2000)); // Wait for React mount

          // 🛡️ Reveal Phone Number (Strictly Primary Business)
          try {
            await page.evaluate(() => {
              // Find all potential buttons
              const btns = Array.from(document.querySelectorAll('.company_info_call_btn, .callNowAnchor, [class*="call_btn"]'));
              // Filter out any button that is inside a "Similar Businesses" or "Related" section
              const mainBtn = btns.find(b => {
                const similarSection = b.closest('.similar_business, [class*="similar"], [class*="related"]');
                return !similarSection;
              });
              if (mainBtn && mainBtn instanceof HTMLElement) mainBtn.click();
            });
            await new Promise(r => setTimeout(r, 3000)); // Wait for reveal (Slow JD modals)
          } catch (e) {}

          const title = await page.title();
          const html = await page.content();
          if (title.includes('Access Denied') || html.includes('Cloudflare') || title.includes('Justdial - Security')) {
            throw new Error('BAN_DETECTED: Active WAF firewall blocking detected.');
          }

          // Trigger Lazy-Loading by rapid scrolling (Optimized Intersection)
          for(let scrolls = 0; scrolls < 5; scrolls++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await new Promise(r => setTimeout(r, 400));
          }
          
          const data = await this.extractData(page);
          await onComplete(target.id, data);
          
          // 🛡️ Faster delay. Auto-Heal will catch bans if we trigger them.
          const sleepTime = getRandomDelay(3000, 5000);
          console.log(`[Worker ${workerId}] Reading page... waiting ${Math.round(sleepTime/1000)}s`);
          await new Promise(r => setTimeout(r, sleepTime));

        } catch (err: any) {
          console.error(`❌ [Worker ${workerId}] Failed extraction for ${target.url}:`, err.message);
          
          if (err.message.includes('BAN_DETECTED')) {
            throw err; // Escalate immediately to trigger the global auto-healing cooldown
          }
          
          // Heal the worker if the tab crashed or detached
          if (err.message.includes('detached') || err.message.includes('Execution context') || err.message.includes('Target closed') || err.message.includes('Session closed')) {
            console.log(`🛠️ [Worker ${workerId}] Healing crashed tab...`);
            await page.close().catch(() => {});
            page = await this.browser!.newPage();
            await page.setViewport({ width: 1440, height: 900 });
            await page.evaluateOnNewDocument(() => {
              localStorage.setItem('skip_login', 'true');
              localStorage.setItem('popup_shown', 'true');
            });
          }
        }
      }
      
      await page.close().catch(() => {});
    };

    // Spin up concurrent workers with a STAGGERED start to prevent IP Banning
    const workers = [];
    const numWorkers = Math.min(this.maxConcurrency, urls.length);
    console.log(`🧵 Spawning ${numWorkers} worker tabs for this batch...`);
    for (let i = 0; i < numWorkers; i++) {
      // Very slight stagger (200ms) for fast 5-tab boot sequence
      workers.push(new Promise(resolve => setTimeout(resolve, i * 200)).then(() => worker(i + 1)));
    }

    await Promise.all(workers);
  }

  private async extractData(page: Page): Promise<EnrichmentData> {
    return await page.evaluate(`(function() {
      function getText(selectors) {
        var node = document.querySelector(selectors);
        return node && node.textContent ? node.textContent.trim() : null;
      }
      
      // Relative Navigation Function 
      function findSiblingText(headerPattern) {
         var els = document.querySelectorAll('h2, h3, h4, div[class*="title"], div[class*="heading"]');
         for(var i=0; i<els.length; i++) {
           if(els[i].textContent.trim().match(headerPattern)) {
             
             // First check strictly explicit sibling which prevents taking container garbage
             var sibling = els[i].nextElementSibling;
             if (sibling && sibling.textContent.length > 10) return sibling.textContent.trim();

             // Fallback to parent container if no sibling (removing the header text)
             var container = els[i].parentElement;
             if(container && container.textContent.length > 50 && container.textContent !== els[i].textContent) {
               return container.textContent.replace(els[i].textContent, '').trim();
             }
           }
         }
         return '';
      }

      // 1. Text Properties
      var overview = '';
      var yearEstablished = '';
      var servicesText = findSiblingText(/Services|What we offer/i);
      var servicesArray = servicesText ? servicesText.split(/(?=[A-Z])/).filter(s => s.length > 3).map(s => s.trim()) : [];
      var rawTimings = getText('.timing-text, .jd_working_hours, .jd_time, [data-testid="timings"], [class*="timing"], [class*="Time_text"]') || findSiblingText(/Hours of Operation|Timings/i) || '';
      // Format timings: remove extra spaces, separate joined days (e.g. PmTuesday -> Pm, Tuesday)
      var workingHours = rawTimings.replace(/\\s+/g, ' ').replace(/([a-z])([A-Z])/g, '$1, $2').replace('3. What are its hours of operation ?', '').trim();
      
      if (!workingHours || workingHours.length < 5) {
         workingHours = "Not Provided";
      }

      // 1.5 Price List (Search for ₹ symbol specifically)
      var priceList = [];
      var allLines = document.body.innerText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      for (var i = 0; i < allLines.length; i++) {
         if (allLines[i].includes('₹') && allLines[i].length < 30) {
            // Usually the previous line is the service name
            var serviceName = i > 0 ? allLines[i-1] : 'Unknown Service';
            if(serviceName.length > 3 && !serviceName.includes('₹') && priceList.length < 15) {
               priceList.push({ name: serviceName, price: allLines[i] });
            }
         }
      }

      // 2. High-Accuracy Body Analytics for Ratings (Multi-Tiered)
      var rating = 0;
      var ratingCount = 0;
      
      // Tier 1: Next.js Data Extraction (Highest Accuracy)
      try {
          var nextDataNode = document.getElementById('__NEXT_DATA__');
          if (nextDataNode && nextDataNode.textContent) {
              var nextData = JSON.parse(nextDataNode.textContent);
              var jdResults = nextData?.props?.pageProps?.results?.results;
              if (jdResults) {
                  if (jdResults.rating) rating = parseFloat(jdResults.rating);
                  else if (jdResults.comprating) rating = parseFloat(jdResults.comprating);
                  if (jdResults.totalReviews) ratingCount = parseInt(jdResults.totalReviews, 10);
                  if (jdResults.comp_desc) overview = jdResults.comp_desc;
                  if (jdResults.year_established) yearEstablished = jdResults.year_established;
              }
              
              // Secondary Path (Primary Detail Data)
              var main = pp?.initialState?.detailData?.mainData;
              if (main) {
                  if (!overview && main.comp_desc) overview = main.comp_desc;
                  if (!yearEstablished && main.year_established) yearEstablished = main.year_established;
              }
          }
      } catch(e) {}

      // DOM fallback for Text Properties
      if (!overview) {
          overview = findSiblingText(/^About |^Overview|^Description/i) || '';
          if (!overview) {
              // Try specific class wrappers for description
              var descNode = document.querySelector('.comp-desc, .about-text, [class*="description"], [class*="summary"]');
              if (descNode) overview = descNode.textContent.trim();
          }
          if (!overview) {
              // Final fallback to meta description
              var metaDesc = document.querySelector('meta[name="description"]');
              if (metaDesc) overview = metaDesc.getAttribute('content');
          }
      }
      if (!yearEstablished) {
          var yearMatch = document.body.innerText.match(/Year of Establishment\\s*[:\\-]?\\s*(\\d{4})/i);
          if (yearMatch) yearEstablished = yearMatch[1];
      }

      // Tier 2: DOM Fallback (Direct Selectors for modern JD layout)
      if (!rating) {
          var ratingNode = document.querySelector('[class*="vendbox_rateavg"]');
          if (ratingNode && ratingNode.textContent) rating = parseFloat(ratingNode.textContent);
      }
      if (!ratingCount) {
          var ratingCountNode = document.querySelector('[class*="vendbox_ratecount"]');
          if (ratingCountNode && ratingCountNode.textContent) {
              var countMatch = ratingCountNode.textContent.match(/(\d+)/);
              if (countMatch) ratingCount = parseInt(countMatch[1], 10);
          }
      }

      // Tier 3: Regex Fallback (Last Resort for legacy or text-only matches)
      if (!rating || !ratingCount) {
          var bodyText = document.body.innerText;
          if (!rating) {
              var rawRatingMatch = bodyText.match(/(\\d\\.\\d)\\s*(?:Star|Out of 5|rating)/i);
              if (rawRatingMatch) rating = parseFloat(rawRatingMatch[1]);
          }
          if (!ratingCount) {
              var rawVotesMatch = bodyText.match(/(\\d+)\\s*(?:Ratings|Votes|Reviews)/i);
              if (rawVotesMatch) ratingCount = parseInt(rawVotesMatch[1], 10);
          }
      }

      // 2.5 Phone Number Extraction (SURGICAL: Primary Business Only)
      var phones = new Set();
      
      // Tier 1: Next.js Data (Primary Object Only)
      try {
          var nextDataNode = document.getElementById('__NEXT_DATA__');
          if (nextDataNode && nextDataNode.textContent) {
              var nextData = JSON.parse(nextDataNode.textContent);
              var pp = nextData?.props?.pageProps;
              
              // 🎯 TARGET ONLY THE PRIMARY BUSINESS DATA
              var main = pp?.initialState?.detailData?.mainData;
              
              if (main && main.contact_info) {
                  var ci = main.contact_info;
                  if (ci.mobile) {
                      var m = ci.mobile.toString().replace(/[^0-9]/g, '');
                      if (m.length >= 10) phones.add(m.substring(m.length - 10));
                  }
                  if (ci.landline) {
                      var l = ci.landline.toString().replace(/[^0-9]/g, '');
                      if (l.length >= 10) phones.add(l.substring(l.length - 10));
                  }
              }
              // Alternate path for virtual/business numbers
              if (main && main.comp_phone) {
                  var cp = main.comp_phone.toString().replace(/[^0-9]/g, '');
                  if (cp.length >= 10) phones.add(cp.substring(cp.length - 10));
              }
          }
      } catch(e) {}

      // Tier 2: Revealed Number (Modal or Button Text ONLY)
      if (phones.size === 0) {
          // A. Scrape revealed number from Modal/Popup
          var modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
          modals.forEach(function(m) {
              var text = m.innerText.replace(/[^0-9]/g, ' ');
              var matches = text.match(/[6-9]\\d{9}/g);
              if (matches) matches.forEach(n => phones.add(n));
          });

          // B. Scrape revealed number from the specific Call/Show button in the header
          // We target buttons that are NOT in a similar/related context
          var btns = document.querySelectorAll('.company_info_call_btn, .callNowAnchor, [class*="call_btn"]');
          btns.forEach(function(b) {
              if (b.closest('[class*="similar"], [class*="related"]')) return;
              var t = b.textContent.replace(/[^0-9]/g, '');
              if (t.length >= 10) phones.add(t.substring(t.length - 10));
          });
      }

      // 3. Strict Authenticity Validation for Images (Only magicbox)
      var imageSet = new Set();
      var imgElements = document.querySelectorAll('img');
      imgElements.forEach(function(img) {
        if (imageSet.size >= 15) return;
        var src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        // 🛡️ Filter everything that is NOT Justdial's official image CDN
        if (src.includes('content.jdmagicbox.com')) {
          if (src.indexOf('//') === 0) src = 'https:' + src;
          imageSet.add(src);
        }
      });
      if (imageSet.size === 0) {
        var bgElements = document.querySelectorAll('.catalog-img, .item-img, div[style*="background-image"]');
        bgElements.forEach(function(el) {
          if (imageSet.size >= 15) return;
          var bgMatches = el.style.backgroundImage.match(/url\\(['"]?(.*?)['"]?\\)/i);
          if (bgMatches && bgMatches[1] && bgMatches[1].includes('content.jdmagicbox.com')) {
            imageSet.add(bgMatches[1]);
          }
        });
      }

      // 4. Review Anchoring
      var reviewsList = [];
      var allDivs = Array.from(document.querySelectorAll('div'));
      // Standard JD Reviews end with "Report Review"
      var reviewCards = allDivs.filter(el => el.innerText && el.innerText.includes('Report Review') && el.innerText.length < 500);
      
      var cleanCards = [];
      reviewCards.forEach(c => {
         var hasInnerCard = false;
         for(var i=0; i<reviewCards.length; i++) {
            if(reviewCards[i] !== c && c.contains(reviewCards[i])) hasInnerCard = true;
         }
         if(!hasInnerCard) cleanCards.push(c);
      });

      cleanCards.forEach(card => {
         var lines = card.innerText.split('\\n').map(l => l.trim()).filter(l => l.length > 0 && l !== 'Report Review');
         if(lines.length >= 3 && reviewsList.length < 5) {
            reviewsList.push({
               author: lines[0],
               rating: parseFloat(lines[1]) || 5, 
               text: lines.slice(2, lines.length - 1).join('\\n').substring(0, 500),
               date: lines[lines.length - 1]
            });
         }
      });

      return {
        workingHours: workingHours,
        rating: rating,
        reviewCount: ratingCount,
        ratingCount: ratingCount,
        images: Array.from(imageSet),
        phone: Array.from(phones),
        overview: overview,
        yearEstablished: yearEstablished,
        services: servicesArray,
        priceList: priceList,
        reviewsList: reviewsList
      };
    })()`) as EnrichmentData;
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
