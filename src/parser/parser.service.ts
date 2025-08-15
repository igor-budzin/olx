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
  private defaultTimeout: number = 50000;
  private maxParsingRetries: number = 3; // Maximum number of retries
  private retryDelayMs: number = 5000;   // Base delay between retries (5 seconds)

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

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

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
   * Scroll to specific element and wait for it to be visible
   */
  private async scrollToElement(page: Page, selector: string, maxAttempts = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check if element exists
        const elementHandle = await page.$(selector);
        if (!elementHandle) {
          this.logger.debug(`Element ${selector} not found on attempt ${attempt}, scrolling more`);
          // Scroll further down and try again
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight * 0.8);
          });
          await new Promise(res => setTimeout(res, 1000));
          continue;
        }

        // Element exists, scroll it into view
        await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, selector);

        // Wait for any animations or loading to complete
        await new Promise(res => setTimeout(res, 1500));

        // Verify element is now visible
        const isVisible = await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (!element) return false;

          const rect = element.getBoundingClientRect();
          return rect.width > 0 &&
            rect.height > 0 &&
            window.getComputedStyle(element).visibility !== 'hidden' &&
            window.getComputedStyle(element).display !== 'none';
        }, selector);

        if (isVisible) {
          this.logger.debug(`Successfully scrolled to ${selector}`);
          return true;
        }

        this.logger.debug(`Element ${selector} found but not visible on attempt ${attempt}, trying again`);
      } catch (error) {
        this.logger.debug(`Error scrolling to ${selector} on attempt ${attempt}: ${error.message}`);
      }

      // Additional scrolling between attempts
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await new Promise(res => setTimeout(res, 1000));
    }

    this.logger.warn(`Failed to scroll to element ${selector} after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Navigate to URL with targeted scrolling strategy
   */
  private async navigateTo(page: Page, url: string): Promise<void> {
    this.logger.debug(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: this.defaultTimeout });

    // First do general scrolling to load most content
    this.logger.debug('Performing initial content loading scrolls');
    for (let scrollPosition = 300; scrollPosition <= 1500; scrollPosition += 300) {
      await page.evaluate((position) => {
        window.scrollTo(0, position);
      }, scrollPosition);
      await new Promise(res => setTimeout(res, 200));
    }

    // Now specifically target the footer section
    this.logger.debug('Targeting footer section to ensure views counter is loaded');
    const footerFound = await this.scrollToElement(page, '[data-testid="ad-footer-bar-section"]', 4);

    if (!footerFound) {
      // If we couldn't find the footer, try scrolling to the bottom of the page
      this.logger.debug('Footer not found, scrolling to bottom of page');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  /**
   * Extract data from the page
   */
  private async extractAdData(page: Page, url: string): Promise<ParsedAdViews> {
    // First make sure we're at the footer where the views counter typically is
    await this.scrollToElement(page, '№footerContent', 1);
    await new Promise(res => setTimeout(res, 300));
    await this.scrollToElement(page, '.app-header', 1);

    // Now look for the views counter with more attempts since it's critical
    const viewCounterFound = await this.waitForElementWithRetry(
      page,
      '[data-testid="page-view-counter"]',
      3
    );

    if (!viewCounterFound) {
      // Take a debug screenshot
      if (process.env.NODE_ENV === 'development') {
        const screenshotPath = `screenshots/missing-counter-${new Date().toISOString().replace(/:/g, '-')}.png` as `${string}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true, optimizeForSpeed: true  });
        this.logger.info(`Debug screenshot saved to ${screenshotPath}`);
      }

      throw new Error('Views counter not found after multiple attempts');
    }

    // Extract views count
    const viewsText = await page.$eval(
      '[data-testid="page-view-counter"]',
      el => (el as HTMLElement).innerText.trim()
    );
    const views = parseInt(viewsText.replace(/\D/g, ''), 10);

    // Make sure other elements are visible too
    await this.waitForElementWithRetry(page, '[data-testid="offer_title"] h4');
    await this.waitForElementWithRetry(page, '[data-testid="ad-footer-bar-section"] span');

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
   * Wait for element with retries and scrolling if needed
   */
  private async waitForElementWithRetry(page: Page, selector: string, maxRetries = 3): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Check if element exists
        const elementHandle = await page.$(selector);
        if (elementHandle) {
          // Element exists, check if it's visible
          const isVisible = await page.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 &&
              window.getComputedStyle(el).visibility !== 'hidden' &&
              window.getComputedStyle(el).display !== 'none';
          }, elementHandle);

          if (isVisible) {
            return true;
          }
        }

        this.logger.debug(`Element not visible on attempt ${attempt + 1}, scrolling and retrying`);

        // Try scrolling to different positions
        const scrollPositions = [800, 1500, 2500, 3500];
        await page.evaluate((position) => {
          window.scrollTo(0, position);
        }, scrollPositions[attempt % scrollPositions.length]);

        // Wait for content to load after scrolling
        await new Promise(res => setTimeout(res, 1000));

      } catch (error) {
        this.logger.debug(`Error finding element on attempt ${attempt + 1}: ${error.message}`);
      }
    }

    this.logger.warn(`Element not found after ${maxRetries} attempts: ${selector}`);
    return false;
  }

  /**
   * Generate a random delay time within specified range
   */
  private getRandomDelay(minSeconds = 3, maxSeconds = 8): number {
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
  }

  /**
   * Fetch multiple ads in sequence with random delays between requests
   */
  public async fetchMultipleAds(urls: string[]): Promise<(ParsedAdViews | null)[]> {
    try {
      // Initialize browser once for all requests
      await this.initBrowser();

      const results = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        // Add random delay before each request (except the first one)
        if (i > 0) {
          const delayMs = this.getRandomDelay();
          this.logger.debug(`Adding random delay of ${delayMs / 1000}s before next request`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        this.logger.info(`Processing URL ${i + 1}/${urls.length}: ${url}`);

        // Use the retry-enabled fetch method
        results.push(await this.fetchAdViews(url));
      }

      return results;
    } finally {
      // Clean up
      await this.closeBrowser();
    }
  }

  /**
   * Fetch ad data with retry logic for failed attempts
   */
  public async fetchAdViews(url: string): Promise<ParsedAdViews | null> {
    let page: Page | undefined;
    let retryCount = 0;
    const startTime = Date.now();
    
    this.logger.info(`▶️ START parsing: ${url}`);

    while (retryCount <= this.maxParsingRetries) {
      try {
        // Only create a new page for each retry attempt
        const browser = await this.initBrowser();
        page = await this.setupPage(browser);

        if (retryCount > 0) {
          this.logger.info(`Retry attempt ${retryCount}/${this.maxParsingRetries} for ${url}`);
        }

        // Randomize navigation behavior
        await this.navigateToWithRandomization(page, url);

        // Extract data
        const data = await this.extractAdData(page, url);

        // Calculate elapsed time
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
        this.logger.info(`✅ DONE parsing: ${data.title} (${data.totalViewsOnDay} views) - Time: ${elapsedSec}s`);

        // Close page before returning successful result
        await page.close();
        page = undefined;

        return data;

      } catch (error) {
        this.logger.warn(`Parsing attempt ${retryCount + 1} failed for ${url}: ${error.message}`);

        // Take error screenshot on first and last failure
        if (page && retryCount === this.maxParsingRetries) {
          try {
            const screenshotPath = `screenshots/error-retry${retryCount}-${new Date().toISOString().replace(/:/g, '-')}.png` as `${string}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            this.logger.info(`Error screenshot saved to ${screenshotPath}`);
          } catch (screenshotError) {
            this.logger.error('Failed to take error screenshot', { error: screenshotError });
          }
        }

        // Close the page before retrying
        if (page) {
          await page.close();
          page = undefined;
        }

        // If we've reached max retries, log error and return null
        if (retryCount >= this.maxParsingRetries) {
          this.logger.error(`Failed to parse ${url} after ${this.maxParsingRetries + 1} attempts`, {
            error: error.message,
            stack: error.stack
          });
          return null;
        }

        // Wait before retrying with exponential backoff
        const delayTime = this.retryDelayMs * Math.pow(1.5, retryCount) * (0.9 + Math.random() * 0.2);
        this.logger.debug(`Waiting ${Math.round(delayTime / 1000)}s before retry ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delayTime));

        retryCount++;
      }
    }

    // If we reach here, all retries failed
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.error(`❌ FAILED parsing: ${url} after all retries - Time: ${elapsedSec}s`);

    return null;
  }

  /**
   * Navigate with slightly randomized behavior
   */
  private async navigateToWithRandomization(page: Page, url: string): Promise<void> {
    this.logger.debug(`Navigating to ${url} with randomized behavior`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: this.defaultTimeout });

    // Random initial wait (0.5-1.5s)
    const initialWait = Math.random() * 1000 + 500;
    await new Promise(res => setTimeout(res, initialWait));

    // Randomized scrolling pattern
    const scrollSteps = Math.floor(Math.random() * 3) + 3; // 3-5 scroll steps
    for (let i = 1; i <= scrollSteps; i++) {
      const scrollAmount = (i / scrollSteps) * 2000 + (Math.random() * 300);
      await page.evaluate((position) => {
        window.scrollTo(0, position);
      }, scrollAmount);

      // Random pause between scrolls (200-600ms)
      await new Promise(res => setTimeout(res, Math.random() * 400 + 200));
    }

    // Continue with the targeted scrolling to find the footer
    await this.scrollToElement(page, '[data-testid="ad-footer-bar-section"]', 4);
  }
}
