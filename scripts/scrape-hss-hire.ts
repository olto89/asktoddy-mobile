/**
 * HSS Hire Website Scraper
 * Uses Puppeteer to extract tool hire pricing from HSS.com
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
  weekendRate?: number;
  url: string;
  availability: string;
  description: string;
  scrapedAt: string;
}

class HSSHireScraper {
  private browser: puppeteer.Browser | null = null;
  private results: HSSToolPrice[] = [];

  async initialize() {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async scrapeProductPage(url: string): Promise<HSSToolPrice | null> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      console.log(`📄 Scraping: ${url}`);

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      // Navigate to page with wait for network idle
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for price elements to load
      await page
        .waitForSelector('[data-testid="product-price"], .price-box, .hire-rates', {
          timeout: 10000,
        })
        .catch(() => console.log('⚠️ Price selector not found, trying alternative...'));

      // Extract product data
      const productData = await page.evaluate(() => {
        const getTextContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getPriceValue = (text: string): number => {
          const match = text.match(/£?([\d,]+\.?\d*)/);
          return match ? parseFloat(match[1].replace(',', '')) : 0;
        };

        // Try multiple selectors for robustness
        const name =
          getTextContent('h1') ||
          getTextContent('[data-testid="product-name"]') ||
          getTextContent('.product-name');

        const description =
          getTextContent('[data-testid="product-description"]') ||
          getTextContent('.product-description') ||
          getTextContent('[itemprop="description"]');

        // Look for hire rates in various formats
        const priceElements = document.querySelectorAll('.hire-rate, .price-item, [data-rate]');
        let dailyRate = 0;
        let weeklyRate = 0;
        let weekendRate = 0;

        priceElements.forEach(element => {
          const text = element.textContent?.toLowerCase() || '';
          const value = getPriceValue(text);

          if (text.includes('day') || text.includes('daily')) {
            dailyRate = value;
          } else if (text.includes('week')) {
            weeklyRate = value;
          } else if (text.includes('weekend')) {
            weekendRate = value;
          }
        });

        // Alternative: Look for structured data
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd.textContent || '{}');
            if (data.offers) {
              dailyRate = dailyRate || data.offers.price;
            }
          } catch (e) {}
        }

        // Get SKU
        const sku =
          getTextContent('[data-testid="product-sku"]') ||
          getTextContent('.sku') ||
          window.location.pathname.split('/').pop() ||
          '';

        return {
          name,
          description,
          sku,
          dailyRate,
          weeklyRate,
          weekendRate,
          availability: getTextContent('.availability') || 'Check store',
        };
      });

      await page.close();

      if (productData.name && (productData.dailyRate || productData.weeklyRate)) {
        const result: HSSToolPrice = {
          ...productData,
          category: this.extractCategory(url),
          url,
          scrapedAt: new Date().toISOString(),
        };

        console.log(
          `✅ Found: ${result.name} - Day: £${result.dailyRate}, Week: £${result.weeklyRate}`
        );
        return result;
      } else {
        console.log(`⚠️ No pricing found for ${url}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error.message);
      await page.close();
      return null;
    }
  }

  async scrapeCategory(categoryUrl: string, limit = 10) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      console.log(`\n📂 Scraping category: ${categoryUrl}`);
      await page.goto(categoryUrl, { waitUntil: 'networkidle2' });

      // Wait for product grid to load
      await page.waitForSelector('a[href*="/hire/p/"]', { timeout: 10000 });

      // Extract product URLs
      const productUrls = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/hire/p/"]');
        return Array.from(links)
          .map(link => (link as HTMLAnchorElement).href)
          .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
      });

      console.log(`Found ${productUrls.length} products in category`);
      await page.close();

      // Scrape individual products (with limit)
      const urlsToScrape = productUrls.slice(0, limit);
      for (const url of urlsToScrape) {
        const product = await this.scrapeProductPage(url);
        if (product) {
          this.results.push(product);
        }

        // Add delay to be respectful
        await this.delay(2000);
      }
    } catch (error) {
      console.error(`❌ Error scraping category:`, error.message);
      await page.close();
    }
  }

  async scrapeCommonTools() {
    // Common tools for construction
    const toolUrls = [
      'https://www.hss.com/hire/p/110v-breaker-16kg-c-w-point-chisel',
      'https://www.hss.com/hire/p/sds-max-breaker-drill-110v',
      'https://www.hss.com/hire/p/angle-grinder-9in-230mm-110v',
      'https://www.hss.com/hire/p/circular-saw-235mm-110v',
      'https://www.hss.com/hire/p/reciprocating-saw-110v',
      'https://www.hss.com/hire/p/cement-mixer-diesel',
      'https://www.hss.com/hire/p/mini-digger-1-5-tonne',
      'https://www.hss.com/hire/p/scaffold-tower-5-2m-platform-height',
      'https://www.hss.com/hire/p/tile-cutter-electric',
      'https://www.hss.com/hire/p/floor-sander-drum-type',
    ];

    console.log('\n🔧 Scraping common construction tools...\n');

    for (const url of toolUrls) {
      const product = await this.scrapeProductPage(url);
      if (product) {
        this.results.push(product);
      }
      await this.delay(2000); // Be respectful
    }
  }

  private extractCategory(url: string): string {
    const parts = url.split('/');
    const categoryIndex = parts.indexOf('c');
    if (categoryIndex > -1 && parts[categoryIndex + 1]) {
      return parts[categoryIndex + 1];
    }
    return 'general';
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveResults() {
    const outputDir = path.join(process.cwd(), 'data', 'scraped-prices');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `hss-hire-prices-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Saved ${this.results.length} items to ${filepath}`);

    // Also update the uk-pricing-data.ts with real HSS prices
    this.generateTypeScriptData();
  }

  private generateTypeScriptData() {
    const tsContent = `/**
 * HSS Hire Real Pricing Data
 * Scraped from HSS.com on ${new Date().toISOString().split('T')[0]}
 * Auto-generated - do not edit manually
 */

export const HSS_TOOL_HIRE_RATES = ${JSON.stringify(
      this.results.map(item => ({
        id: item.sku,
        name: item.name,
        category: item.category,
        dailyRate: item.dailyRate,
        weeklyRate: item.weeklyRate,
        supplier: 'HSS Hire',
        availability: item.availability,
        description: item.description,
        url: item.url,
      })),
      null,
      2
    )};
`;

    const outputPath = path.join(
      process.cwd(),
      'supabase',
      'functions',
      'get-pricing',
      'data',
      'hss-hire-rates.ts'
    );

    fs.writeFileSync(outputPath, tsContent);
    console.log(`📝 Generated TypeScript data at ${outputPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Main execution
async function main() {
  const scraper = new HSSHireScraper();

  try {
    await scraper.initialize();

    // Option 1: Scrape specific common tools
    await scraper.scrapeCommonTools();

    // Option 2: Scrape categories (uncomment to use)
    // await scraper.scrapeCategory('https://www.hss.com/hire/c/power-tools', 20);
    // await scraper.scrapeCategory('https://www.hss.com/hire/c/access-equipment', 10);

    await scraper.saveResults();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await scraper.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { HSSHireScraper };
