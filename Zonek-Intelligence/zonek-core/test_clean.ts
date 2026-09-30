import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const url = 'https://www.justdial.com/Coimbatore/Cooling-Engineers-Near-Maruti-Showroom-Peelamedu/0422PX422-X422-180105112953-G9A4_BZDET';
  await page.goto(url, { waitUntil: 'domcontentloaded'});
  const title = await page.evaluate(() => document.title);
  console.log('TITLE:', title);
  await browser.close();
}
run();
