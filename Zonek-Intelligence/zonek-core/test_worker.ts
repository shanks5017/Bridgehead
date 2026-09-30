import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const startTime = Date.now();
  console.log('Navigating...');
  await page.goto("https://www.justdial.com/Coimbatore/Cooling-Engineers-Near-Maruti-Showroom-Peelamedu/0422PX422-X422-180105112953-G9A4_BZDET", { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000)); // allow React to hydrate
  
  const data = await page.evaluate(`(function() {
    function getText(sel) {
      var node = document.querySelector(sel);
      return node ? node.textContent.trim() : null;
    }
    return {
      title: getText('h1, .store-name'),
      votes: getText('.jd_votes, .green-box'),
      workingHours: getText('.timing-text, .jd_working_hours, .jd_time'),
      rating: getText('.jd_rating, .rating-digit')
    };
  })()`);
  
  console.log(data);
  console.log('Took ' + (Date.now() - startTime) + 'ms');
  
  await browser.close();
}
run();
