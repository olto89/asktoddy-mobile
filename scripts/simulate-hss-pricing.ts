/**
 * HSS Hire Pricing Simulator
 * Creates realistic HSS pricing based on market research
 * This will be replaced with real scraping when Puppeteer is set up
 */

import fs from 'fs';
import path from 'path';

// Based on HSS actual pricing patterns (researched November 2024)
// HSS typically charges:
// - Daily rate: Base price
// - Weekly rate: 3-4x daily rate (discount for longer hire)
// - Weekend rate: 1.5-1.8x daily rate

const HSS_PRICING_PATTERNS = {
  power_tools: {
    multiplier: 1.0,
    weeklyDiscount: 0.7, // Weekly = Daily * 4 (not 7)
    items: [
      { name: 'SDS Plus Drill 110V', baseDaily: 32 },
      { name: 'Angle Grinder 9" 110V', baseDaily: 26 },
      { name: 'Circular Saw 235mm 110V', baseDaily: 28 },
      { name: 'Reciprocating Saw 110V', baseDaily: 24 },
      { name: 'Jigsaw 110V', baseDaily: 22 },
      { name: 'Planer Electric 110V', baseDaily: 20 },
      { name: 'Belt Sander 110V', baseDaily: 24 },
      { name: 'Multi Tool 110V', baseDaily: 22 },
    ],
  },
  breaking: {
    multiplier: 1.2,
    weeklyDiscount: 0.65,
    items: [
      { name: 'Breaker 16kg 110V', baseDaily: 55 },
      { name: 'Breaker 32kg 110V', baseDaily: 75 },
      { name: 'Breaker 5kg Electric', baseDaily: 38 },
      { name: 'Demolition Hammer SDS Max', baseDaily: 45 },
    ],
  },
  concrete: {
    multiplier: 1.1,
    weeklyDiscount: 0.6,
    items: [
      { name: 'Concrete Mixer 240L Diesel', baseDaily: 48 },
      { name: 'Concrete Mixer 120L Electric', baseDaily: 35 },
      { name: 'Vibrating Poker 110V', baseDaily: 32 },
      { name: 'Power Float Petrol', baseDaily: 95 },
    ],
  },
  access: {
    multiplier: 1.3,
    weeklyDiscount: 0.55,
    items: [
      { name: 'Scaffold Tower 5.2m Platform', baseDaily: 42 },
      { name: 'Scaffold Tower 6.2m Platform', baseDaily: 48 },
      { name: 'Podium Steps 1.0m Platform', baseDaily: 28 },
      { name: 'Ladder 3-Way Combination', baseDaily: 18 },
    ],
  },
  plant: {
    multiplier: 1.5,
    weeklyDiscount: 0.5,
    items: [
      { name: 'Mini Digger 1.5 Tonne', baseDaily: 195 },
      { name: 'Mini Digger 3 Tonne', baseDaily: 245 },
      { name: 'Dumper 1 Tonne Hi-Tip', baseDaily: 125 },
      { name: 'Compactor Plate 400mm', baseDaily: 42 },
    ],
  },
  flooring: {
    multiplier: 1.0,
    weeklyDiscount: 0.65,
    items: [
      { name: 'Floor Sander Drum Type', baseDaily: 48 },
      { name: 'Floor Sander Edge', baseDaily: 35 },
      { name: 'Tile Cutter Electric 450mm', baseDaily: 32 },
      { name: 'Carpet Cleaner Industrial', baseDaily: 38 },
    ],
  },
};

function generateHSSPricing() {
  const allTools: any[] = [];
  let id = 1000;

  for (const [category, config] of Object.entries(HSS_PRICING_PATTERNS)) {
    for (const item of config.items) {
      const dailyRate = item.baseDaily * config.multiplier;
      const weeklyRate = dailyRate * 4 * config.weeklyDiscount; // HSS weekly is typically 4x daily with discount
      const weekendRate = dailyRate * 1.6; // Weekend rate is typically 1.6x daily

      allTools.push({
        id: `hss_${id++}`,
        name: item.name,
        category: category,
        dailyRate: Math.round(dailyRate * 100) / 100,
        weeklyRate: Math.round(weeklyRate * 100) / 100,
        weekendRate: Math.round(weekendRate * 100) / 100,
        monthlyRate: Math.round(weeklyRate * 3.5 * 100) / 100, // Monthly ~3.5x weekly
        supplier: 'HSS Hire',
        availability: 'high',
        description: `Professional ${item.name.toLowerCase()} for hire`,
        alternatives: [],
        minHirePeriod: '1 day',
        deliveryAvailable: true,
        collectionRequired: category === 'plant',
      });
    }
  }

  return allTools;
}

function saveHSSPricing() {
  const tools = generateHSSPricing();

  // Save as JSON for reference
  const jsonPath = path.join(
    process.cwd(),
    'data',
    'simulated-prices',
    `hss-simulated-${new Date().toISOString().split('T')[0]}.json`
  );

  // Create directory if it doesn't exist
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(jsonPath, JSON.stringify(tools, null, 2));
  console.log(`💾 Saved ${tools.length} HSS tools to ${jsonPath}`);

  // Generate TypeScript file for integration
  const tsContent = `/**
 * HSS Hire Simulated Pricing Data
 * Based on market research and HSS pricing patterns
 * Generated: ${new Date().toISOString()}
 * 
 * NOTE: This is simulated data based on research.
 * Replace with real scraped data when available.
 */

import { ToolHireRate } from '../types.ts';

export const HSS_HIRE_RATES: ToolHireRate[] = ${JSON.stringify(
    tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      category: tool.category as any,
      dailyRate: tool.dailyRate,
      weeklyRate: tool.weeklyRate,
      monthlyRate: tool.monthlyRate,
      supplier: tool.supplier,
      availability: tool.availability as any,
      description: tool.description,
      alternatives: tool.alternatives,
    })),
    null,
    2
  )};

// Export for use in pricing service
export function getHSSRate(toolName: string): ToolHireRate | undefined {
  return HSS_HIRE_RATES.find(tool => 
    tool.name.toLowerCase().includes(toolName.toLowerCase()) ||
    toolName.toLowerCase().includes(tool.name.toLowerCase())
  );
}

// Regional price adjustment (HSS charges more in London)
export function adjustHSSPriceForRegion(baseRate: number, region: string): number {
  const regionMultipliers: Record<string, number> = {
    'London': 1.15,      // +15% in London
    'South East': 1.08,  // +8% in South East
    'Scotland': 0.95,    // -5% in Scotland
    'Wales': 0.92,       // -8% in Wales
    'North East': 0.90,  // -10% in North East
  };
  
  return baseRate * (regionMultipliers[region] || 1.0);
}
`;

  const tsPath = path.join(
    process.cwd(),
    'supabase',
    'functions',
    'get-pricing',
    'data',
    'hss-hire-rates.ts'
  );

  fs.writeFileSync(tsPath, tsContent);
  console.log(`📝 Generated TypeScript integration at ${tsPath}`);

  // Summary
  console.log('\n📊 HSS Pricing Summary:');
  console.log('========================');
  for (const [category, config] of Object.entries(HSS_PRICING_PATTERNS)) {
    const categoryTools = tools.filter(t => t.category === category);
    const avgDaily = categoryTools.reduce((sum, t) => sum + t.dailyRate, 0) / categoryTools.length;
    console.log(
      `${category}: ${categoryTools.length} tools, avg daily rate: £${avgDaily.toFixed(2)}`
    );
  }

  console.log('\n✅ HSS pricing simulation complete!');
  console.log('📌 Note: This is simulated data based on market research.');
  console.log('📌 To get real data, install Puppeteer and run scrape-hss-hire.ts');
}

// Run if called directly
if (require.main === module) {
  saveHSSPricing();
}

export { generateHSSPricing, HSS_PRICING_PATTERNS };
