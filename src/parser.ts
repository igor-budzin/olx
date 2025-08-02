import puppeteer, { Browser } from 'puppeteer';
import { AdData, ParsedAdViews } from './types';

export async function fetchAdViews(url: string): Promise<ParsedAdViews | null> {
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.evaluate(() => {
      window.scrollTo(0, 2000);
    });

    await page.waitForSelector('[data-testid="page-view-counter"]', { timeout: 10000 });
    const viewsText = await page.$eval('[data-testid="page-view-counter"]', el => (el as HTMLElement).innerText.trim());
    const views = parseInt(viewsText.replace(/\D/g, ''), 10);
    const title = await page.$eval('[data-testid="offer_title"] h4', el => (el as HTMLElement).innerText.trim());
    const nativeIdText = await page.$eval('[data-testid="ad-footer-bar-section"] span', el => (el as HTMLElement).innerText.trim());
    const nativeId = parseInt(nativeIdText.replace(/\D/g, ''), 10);


    console.log(`Parsed views for ${url}: ${views}`);

    return { title, url, views, timestamp: Date.now(), nativeId };
  } catch (err: any) {
    console.error(`Error parsing ${url}: ${err.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
