/**
 * Smart HSS Hire Scraper
 * Handles JavaScript-loaded pricing with better wait strategies
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface HSSToolPrice {
  name: string;
  sku: string;
  category: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate?: number;
  url: string;
  availability: string;
  description: string;
  scrapedAt: string;
}

class SmartHSSHireScraper {
  private browser: puppeteer.Browser | null = null;
  private results: HSSToolPrice[] = [];

  async initialize() {
    console.log('🚀 Launching browser with stealth mode...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
      ],
    });
  }

  async scrapeProductPage(url: string): Promise<HSSToolPrice | null> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      console.log(`\n📄 Scraping: ${url}`);

      // Set stealth headers
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      await page.setViewport({ width: 1920, height: 1080 });

      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      // Navigate with extended timeout
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 45000,
      });

      // Wait for initial page elements
      await page.waitForSelector('h1, [data-testid="product-name"]', { timeout: 10000 });

      console.log('⏳ Waiting for dynamic content to load...');

      // Strategy 1: Wait for specific pricing elements with multiple selectors
      const priceSelectors = [
        '[data-testid*="price"]',
        '.price',
        '.hire-rate',
        '.daily-rate',
        '.weekly-rate',
        '[class*="price"]',
        '[class*="rate"]',
        'span:contains("£")',
        'div:contains("£")',
      ];

      let pricesFound = false;
      for (const selector of priceSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✅ Found pricing with selector: ${selector}`);
          pricesFound = true;
          break;
        } catch (e) {
          console.log(`❌ Selector ${selector} not found`);
        }
      }

      // Strategy 2: Wait for API calls to complete
      if (!pricesFound) {
        console.log('⏳ Waiting for API calls to complete...');
        await page.waitForFunction(
          () => {
            const allText = document.body.innerText;
            return (
              allText.includes('£') && !allText.includes('Fetching') && !allText.includes('Loading')
            );
          },
          { timeout: 20000 }
        );
      }

      // Strategy 3: Wait for network to be quiet
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network not idle, proceeding anyway...');
      });

      // Extract all data with enhanced selectors
      const productData = await page.evaluate(() => {
        const getTextContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getAllTextContent = (selectors: string[]): string => {
          for (const selector of selectors) {
            const text = getTextContent(selector);
            if (text) return text;
          }
          return '';
        };

        const extractPrices = () => {
          const prices = { daily: 0, weekly: 0, monthly: 0 };

          // Look for all text containing £
          const priceTexts = Array.from(document.querySelectorAll('*'))
            .map(el => el.textContent?.trim())
            .filter(text => text && text.includes('£') && /[\d.]/.test(text));

          console.log('Found price texts:', priceTexts);

          priceTexts.forEach(text => {
            const priceMatch = text.match(/£([\d,]+\.?\d*)/);
            if (!priceMatch) return;

            const price = parseFloat(priceMatch[1].replace(',', ''));
            const lowerText = text.toLowerCase();

            if (lowerText.includes('day') || lowerText.includes('daily')) {
              prices.daily = Math.max(prices.daily, price);
            } else if (lowerText.includes('week')) {
              prices.weekly = Math.max(prices.weekly, price);
            } else if (lowerText.includes('month')) {
              prices.monthly = Math.max(prices.monthly, price);
            }
          });

          return prices;
        };

        // Extract product info
        const nameSelectors = ['h1', '[data-testid="product-name"]', '.product-name', '.title'];
        const descSelectors = [
          '[data-testid="product-description"]',
          '.description',
          '.product-description',
        ];

        const name = getAllTextContent(nameSelectors);
        const description = getAllTextContent(descSelectors) || name;
        const sku = window.location.pathname.split('/').pop() || '';
        const prices = extractPrices();

        // Get availability
        const availabilityText =
          getTextContent('.availability') ||
          getTextContent('[data-testid*="stock"]') ||
          'Available';

        return {
          name,
          description,
          sku,
          dailyRate: prices.daily,
          weeklyRate: prices.weekly,
          monthlyRate: prices.monthly,
          availability: availabilityText,
        };
      });

      // Take screenshot for debugging
      await page.screenshot({
        path: `debug-hss-${productData.sku}.png`,
        fullPage: false,
      });
      console.log(`📸 Screenshot saved for debugging: debug-hss-${productData.sku}.png`);

      await page.close();

      if (productData.name && (productData.dailyRate || productData.weeklyRate)) {
        const result: HSSToolPrice = {
          ...productData,
          category: this.extractCategory(url),
          url,
          scrapedAt: new Date().toISOString(),
        };

        console.log(`✅ SUCCESS: ${result.name}`);
        console.log(`   Daily: £${result.dailyRate}, Weekly: £${result.weeklyRate}`);
        return result;
      } else {
        console.log(`❌ FAILED: No pricing found`);
        console.log(`   Name: "${productData.name}"`);
        console.log(`   Daily: £${productData.dailyRate}, Weekly: £${productData.weeklyRate}`);

        // Save page content for analysis
        const content = await page.content();
        fs.writeFileSync(`debug-${productData.sku}.html`, content);
        console.log(`💾 Page content saved to debug-${productData.sku}.html`);

        return null;
      }
    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error.message);
      await page.close();
      return null;
    }
  }

  private extractCategory(url: string): string {
    const categoryMap: Record<string, string> = {
      breaker: 'breaking',
      drill: 'power_tools',
      grinder: 'power_tools',
      saw: 'power_tools',
      mixer: 'concrete',
      digger: 'plant',
      scaffold: 'access',
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (url.includes(key)) return category;
    }
    return 'general';
  }

  async testSingleProduct() {
    // Test with a simpler product first
    const testUrls = [
      'https://www.hss.com/hire/p/110v-breaker-16kg-c-w-point-chisel',
      'https://www.hss.com/hire/p/sds-plus-drill',
      'https://www.hss.com/hire/p/angle-grinder',
    ];

    for (const url of testUrls) {
      console.log(`\n🧪 Testing: ${url}`);
      const result = await this.scrapeProductPage(url);
      if (result) {
        this.results.push(result);
        break; // Success!
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async saveResults() {
    const outputDir = path.join(process.cwd(), 'data', 'scraped-prices');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `hss-real-prices-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Saved ${this.results.length} items to ${filepath}`);

    if (this.results.length > 0) {
      console.log('\n🎉 Real HSS pricing collected!');
      this.results.forEach(item => {
        console.log(`✅ ${item.name}: £${item.dailyRate}/day, £${item.weeklyRate}/week`);
      });
    }
  }
}

// For Puppeteer v19+ compatibility
declare global {
  interface Page {
    waitForLoadState(state: string, options?: { timeout: number }): Promise<void>;
  }
}

// Add the missing method
puppeteer.Page.prototype.waitForLoadState = async function (
  state: string,
  options = { timeout: 30000 }
) {
  if (state === 'networkidle') {
    return this.waitForLoadState('networkidle0', options);
  }
  return Promise.resolve();
};

// Main execution
async function main() {
  const scraper = new SmartHSSHireScraper();

  try {
    await scraper.initialize();
    await scraper.testSingleProduct();
    await scraper.saveResults();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await scraper.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SmartHSSHireScraper };
