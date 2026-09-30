import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const url = 'https://www.justdial.com/coimbatore/ac-service-in-coimbatore';
  await page.goto(url, { waitUntil: 'domcontentloaded'});
  const title = await page.evaluate(() => document.title);
  console.log('TITLE MAIN:', title);
  await browser.close();
}
run();
