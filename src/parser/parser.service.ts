import puppeteer, { Browser, Page } from 'puppeteer';
import { ParsedAdViews } from '../types';
import { injectable, inject } from 'inversify';
import { TYPES } from '../inversify.types';
import { ILogger } from '../logger/logger.interface';
import { LoggerFactory } from '../logger/logger.factory';

@injectable()
export class OlxParserService {
  private browser: Browser | null = null;
  private logger: ILogger;
  
  constructor(
    @inject(TYPES.LoggerFactory) loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.createLogger('OlxParser');
  }
  
  /**
   * Initialize browser if not already initialized
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.logger.debug('Initializing puppeteer browser');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    return this.browser;
  }
  
  /**
   * Close the browser instance if it exists
   */
  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      this.logger.debug('Closing puppeteer browser');
      await this.browser.close();
      this.browser = null;
    }
  }
  
  /**
   * Setup page with required configurations
   */
  private async setupPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      // Block unnecessary resources to speed up loading
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    return page;
  }
  
  /**
   * Navigate to URL and scroll to ensure content is loaded
   */
  private async navigateTo(page: Page, url: string): Promise<void> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.evaluate(() => {
      window.scrollTo(0, 3000);
    });
  }
  
  /**
   * Extract data from the page
   */
  private async extractAdData(page: Page, url: string): Promise<ParsedAdViews> {
    // Wait for views counter to be available
    await page.waitForSelector('[data-testid="page-view-counter"]', { timeout: 10000 });
    
    // Extract views count
    const viewsText = await page.$eval(
      '[data-testid="page-view-counter"]', 
      el => (el as HTMLElement).innerText.trim()
    );
    const views = parseInt(viewsText.replace(/\D/g, ''), 10);
    
    // Extract title
    const title = await page.$eval(
      '[data-testid="offer_title"] h4', 
      el => (el as HTMLElement).innerText.trim()
    );
    
    // Extract native ID
    const nativeIdText = await page.$eval(
      '[data-testid="ad-footer-bar-section"] span', 
      el => (el as HTMLElement).innerText.trim()
    );
    const nativeId = parseInt(nativeIdText.replace(/\D/g, ''), 10);
    
    // Extract location
    const location = await page.$eval(
      '.qa-static-ad-map-container > img', 
      el => (el as HTMLImageElement).alt.trim()
    );
    
    return { 
      title, 
      url, 
      totalViewsOnDay: views, 
      timestamp: Date.now(), 
      nativeId, 
      location 
    };
  }
  
  /**
   * Fetch ad data from given URL
   */
  public async fetchAdViews(url: string): Promise<ParsedAdViews | null> {
    let page: Page | undefined;
    
    try {
      const browser = await this.initBrowser();    
      this.logger.info(`Start parsing ${url}`);
      page = await this.setupPage(browser); 
      
      await this.navigateTo(page, url);
      const data = await this.extractAdData(page, url);
      
      this.logger.info(`Successfully parsed: ${data.title} (${data.totalViewsOnDay} views)`);
      return data;
      
    } catch (error: any) {
      this.logger.error(`Error parsing ${url}`, { 
        error: error.message,
        stack: error.stack
      });
      return null;
      
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
  
  /**
   * Fetch multiple ads in sequence
   */
  public async fetchMultipleAds(urls: string[]): Promise<(ParsedAdViews | null)[]> {
    try {
      // Initialize browser once for all requests
      await this.initBrowser();
      
      const results = [];
      for (const url of urls) {
        results.push(await this.fetchAdViews(url));
      }
      
      return results;
    } finally {
      // Clean up
      await this.closeBrowser();
    }
  }
}
