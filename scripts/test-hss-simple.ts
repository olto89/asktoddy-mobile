/**
 * Simple HSS Test Scraper
 * Tests if we can get any pricing data from HSS
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function testHSS() {
  console.log('🚀 Testing HSS scraping...');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // Set normal browser headers
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.setViewport({ width: 1200, height: 800 });

    console.log('📄 Loading HSS product page...');

    // Try a simple product
    await page.goto('https://www.hss.com/hire/p/110v-breaker-16kg-c-w-point-chisel', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('⏳ Waiting 10 seconds for page to fully load...');
    await page.waitForTimeout(10000); // Give it time to load JS

    // Take a screenshot to see what we got
    await page.screenshot({ path: 'hss-page-test.png', fullPage: true });
    console.log('📸 Screenshot saved: hss-page-test.png');

    // Extract all text content to see what's there
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim(),
        allText: document.body.innerText,
        priceElements: Array.from(document.querySelectorAll('*'))
          .map(el => el.textContent?.trim())
          .filter(text => text && text.includes('£'))
          .slice(0, 10), // First 10 price-related texts
      };
    });

    console.log('\n📋 Page Analysis:');
    console.log('='.repeat(50));
    console.log('Title:', pageContent.title);
    console.log('H1:', pageContent.h1);
    console.log('\nPrice-related content:', pageContent.priceElements);

    // Save detailed content for analysis
    fs.writeFileSync('hss-content-analysis.json', JSON.stringify(pageContent, null, 2));
    console.log('\n💾 Detailed content saved to hss-content-analysis.json');

    // Check if we can find any pricing patterns
    const hasDay = pageContent.allText.toLowerCase().includes('day');
    const hasWeek = pageContent.allText.toLowerCase().includes('week');
    const hasPound = pageContent.allText.includes('£');

    console.log('\n🔍 Content Analysis:');
    console.log(`Has "day": ${hasDay}`);
    console.log(`Has "week": ${hasWeek}`);
    console.log(`Has "£": ${hasPound}`);

    if (hasPound) {
      console.log('\n✅ Found £ symbols - pricing data is present!');

      // Extract specific price patterns
      const priceMatches = pageContent.allText.match(/£[\d,]+\.?\d*/g);
      if (priceMatches) {
        console.log('💰 Found prices:', priceMatches.slice(0, 5));
      }
    } else {
      console.log('\n❌ No £ symbols found - pricing may not be loaded yet');
    }

    console.log("\nPress Ctrl+C to close when you've examined the screenshot...");
    await page.waitForTimeout(30000); // Keep browser open for 30 seconds
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testHSS().catch(console.error);
