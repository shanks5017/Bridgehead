import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating...");
  await page.goto('https://www.justdial.com/Coimbatore/Cooling-Engineers-Near-Maruti-Showroom-Peelamedu/0422PX422-X422-180105112953-G9A4_BZDET', { waitUntil: 'domcontentloaded'});
  
  console.log("Scrolling carefully...");
  for(let i=0; i<8; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("Extracting...");
  const data = await page.evaluate(`(function() {
    function getText(selectors) {
      var node = document.querySelector(selectors);
      return node && node.textContent ? node.textContent.trim() : null;
    }

    function findSiblingText(headerPattern) {
      var els = document.querySelectorAll('h2, h3, div[class*="Title"], div[class*="heading"]');
      for(var i=0; i<els.length; i++) {
        if(els[i].textContent.match(headerPattern)) {
          var container = els[i].parentElement;
          if(container.textContent.length > 50) return container.textContent.trim();
          var sibling = els[i].nextElementSibling;
          return sibling ? sibling.textContent.trim() : null;
        }
      }
      return null;
    }

    var overview = findSiblingText(/About|Overview|Description/i);
    var quickInfo = findSiblingText(/Quick Info|Business Information/i);
    var services = findSiblingText(/Services|What we offer/i);
    var rawTimings = getText('.timing-text, .jd_working_hours, .jd_time, [data-testid="timings"]') || findSiblingText(/Hours of Operation|Timings/i) || '';
    var workingHours = rawTimings.replace(/\\s+/g, ' ').replace(/([a-z])([A-Z])/g, '$1, $2').replace('3. What are its hours of operation ?', '').trim();

    var rawRatingText = document.body.innerText.match(/(\\d\\.\\d)\\s*Stars?/i);
    var rating = rawRatingText ? parseFloat(rawRatingText[1]) : null;

    var rawVotesText = document.body.innerText.match(/(\\d+)\\s*(Ratings|Votes)/i);
    var ratingCount = rawVotesText ? parseInt(rawVotesText[1]) : null;

    var priceList = [];
    var allLines = document.body.innerText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
    for (var i = 0; i < allLines.length; i++) {
       if (allLines[i].includes('₹') && allLines[i].length < 30) {
          var serviceName = i > 0 ? allLines[i-1] : 'Unknown Service';
          if(serviceName.length > 3 && !serviceName.includes('₹') && priceList.length < 15) {
             priceList.push({ name: serviceName, price: allLines[i] });
          }
       }
    }

    return {
      overview: overview,
      quickInfo: quickInfo,
      services: services,
      workingHours: workingHours,
      priceList: priceList,
      rating: rating,
      ratingCount: ratingCount
    }
  })()`);

  fs.writeFileSync('extraction_test.json', JSON.stringify(data, null, 2));
  console.log("Saved to extraction_test.json");
  await browser.close();
}

run();
