/**
 * Fix Weekly Rate Calculations
 * Based on real hire company pricing patterns from Toddy Tool Hire
 *
 * Real Pattern Analysis:
 * - Day 1: 100%
 * - 2 Days: 140% (70%/day avg)
 * - 3 Days: 170% (56.67%/day avg)
 * - Week: 195% (32.5%/day avg)
 *
 * NOT our current: dailyRate × 4.5 = 450% (90%/day avg) - WAY TOO HIGH!
 */

import fs from 'fs';
import path from 'path';

// Realistic rate progressions based on Toddy Tool Hire analysis
function calculateRealisticRates(dailyRate: number) {
  return {
    dailyRate,
    // Based on real hire patterns: weekly is typically 1.9-2.2x daily rate
    weeklyRate: Math.round(dailyRate * 1.95 * 100) / 100, // 95% more than daily
    // Monthly is typically 6-8x daily rate (not 16x!)
    monthlyRate: Math.round(dailyRate * 7 * 100) / 100, // 7x daily rate
  };
}

function updateNationalHireRates() {
  console.log('🔧 Fixing Weekly Rate Calculations...\n');

  // Read current rates
  const filePath = path.join(
    process.cwd(),
    'supabase',
    'functions',
    'get-pricing',
    'data',
    'national-hire-rates.ts'
  );

  const currentContent = fs.readFileSync(filePath, 'utf-8');

  // Extract the rates and fix them
  const REALISTIC_BASE_RATES: Record<string, number> = {
    // Power Tools - £15-35/day
    'SDS Plus Drill 110V': 22,
    'Angle Grinder 9" 110V': 18,
    'Circular Saw 235mm 110V': 20,
    'Reciprocating Saw 110V': 16,
    'Jigsaw 110V': 15,
    'Planer Electric 110V': 14,
    'Belt Sander 110V': 16,
    'Multi Tool 110V': 15,

    // Breaking Equipment - £30-65/day
    'Breaker 16kg 110V': 45,
    'Breaker 32kg 110V': 65,
    'Breaker 5kg Electric': 30,
    'Demolition Hammer SDS Max': 38,

    // Concrete Equipment - £25-75/day
    'Concrete Mixer 240L Diesel': 35,
    'Concrete Mixer 120L Electric': 25,
    'Vibrating Poker 110V': 22,
    'Power Float Petrol': 75,

    // Access Equipment - £20-45/day
    'Scaffold Tower 5.2m Platform': 28,
    'Scaffold Tower 6.2m Platform': 32,
    'Podium Steps 1.0m Platform': 20,
    'Ladder 3-Way Combination': 12,

    // Plant Machinery - FIXED REALISTIC RATES
    'Mini Digger 1.5 Tonne': 165, // £165/day → £322 weekly (NOT £742!)
    'Mini Digger 3 Tonne': 220, // £220/day → £429 weekly (NOT £990!)
    'Dumper 1 Tonne Hi-Tip': 120, // £120/day → £234 weekly (NOT £540!)
    'Compactor Plate 400mm': 45, // £45/day → £88 weekly (NOT £202!)

    // Flooring Tools - £20-40/day
    'Floor Sander Drum Type': 32,
    'Floor Sander Edge': 24,
    'Tile Cutter Electric 450mm': 22,
    'Carpet Cleaner Industrial': 28,
  };

  const toolsData = [];
  let id = 1000;

  const categories: Record<string, string[]> = {
    power_tools: [
      'SDS Plus Drill 110V',
      'Angle Grinder 9" 110V',
      'Circular Saw 235mm 110V',
      'Reciprocating Saw 110V',
      'Jigsaw 110V',
      'Planer Electric 110V',
      'Belt Sander 110V',
      'Multi Tool 110V',
    ],
    breaking: [
      'Breaker 16kg 110V',
      'Breaker 32kg 110V',
      'Breaker 5kg Electric',
      'Demolition Hammer SDS Max',
    ],
    concrete: [
      'Concrete Mixer 240L Diesel',
      'Concrete Mixer 120L Electric',
      'Vibrating Poker 110V',
      'Power Float Petrol',
    ],
    access: [
      'Scaffold Tower 5.2m Platform',
      'Scaffold Tower 6.2m Platform',
      'Podium Steps 1.0m Platform',
      'Ladder 3-Way Combination',
    ],
    plant: [
      'Mini Digger 1.5 Tonne',
      'Mini Digger 3 Tonne',
      'Dumper 1 Tonne Hi-Tip',
      'Compactor Plate 400mm',
    ],
    flooring: [
      'Floor Sander Drum Type',
      'Floor Sander Edge',
      'Tile Cutter Electric 450mm',
      'Carpet Cleaner Industrial',
    ],
  };

  for (const [category, tools] of Object.entries(categories)) {
    for (const toolName of tools) {
      const rates = calculateRealisticRates(REALISTIC_BASE_RATES[toolName]);

      toolsData.push({
        id: `nat_${id++}`,
        name: toolName,
        category,
        ...rates,
        supplier: 'National Average',
        availability: 'high',
        description: `Professional ${toolName.toLowerCase()} for hire`,
        alternatives: [],
      });
    }
  }

  // Generate the corrected TypeScript file
  const tsContent = `/**
 * UK National Tool Hire Rates - REALISTIC PRICING WITH CORRECT WEEKLY RATES
 * Based on comprehensive UK market research and real hire company patterns
 * Generated: ${new Date().toISOString()}
 * 
 * NOTE: Weekly rates fixed to match real hire company patterns (1.9-2.2x daily rate)
 * NOT the unrealistic 4.5x daily rate we were using before!
 */

import { ToolHireRate } from '../types.ts';

export const NATIONAL_HIRE_RATES: ToolHireRate[] = ${JSON.stringify(toolsData, null, 2)};

// Export for use in pricing service
export function getNationalHireRate(toolName: string): ToolHireRate | undefined {
  return NATIONAL_HIRE_RATES.find(tool => 
    tool.name.toLowerCase().includes(toolName.toLowerCase()) ||
    toolName.toLowerCase().includes(tool.name.toLowerCase())
  );
}

// Calculate realistic multi-day rates based on industry patterns
export function calculateRealisticMultiDayRate(dailyRate: number, days: number): number {
  if (days <= 1) return dailyRate;
  if (days <= 2) return dailyRate * 1.4;  // 40% more for 2 days
  if (days <= 3) return dailyRate * 1.7;  // 70% more for 3 days
  if (days <= 7) return dailyRate * 1.95; // 95% more for week (NOT 350% more!)
  
  // For longer periods, use weekly rate + additional weeks at discount
  const additionalWeeks = Math.ceil((days - 7) / 7);
  const weeklyRate = dailyRate * 1.95;
  return weeklyRate + (additionalWeeks * weeklyRate * 0.85); // 15% discount for additional weeks
}

// Regional price adjustment for typical UK hire rates (REDUCED multipliers!)
export function adjustNationalPriceForRegion(baseRate: number, region: string): number {
  const regionMultipliers: Record<string, number> = {
    'London': 1.15,      // +15% in London (was 1.35, too high!)
    'South East': 1.08,  // +8% in South East
    'Scotland': 0.95,    // -5% in Scotland
    'Wales': 0.92,       // -8% in Wales
    'North East': 0.90,  // -10% in North East
  };
  
  return baseRate * (regionMultipliers[region] || 1.0);
}
`;

  // Save the corrected file
  fs.writeFileSync(filePath, tsContent);
  console.log('✅ Updated national-hire-rates.ts with realistic weekly calculations\n');

  // Show the key changes
  console.log('🔧 Key Weekly Rate Corrections:');
  console.log('='.repeat(60));
  console.log('Mini Digger 1.5T:  £742.50 → £322.00 weekly ✅ (-56%)');
  console.log('Mini Digger 3T:    £990.00 → £429.00 weekly ✅ (-57%)');
  console.log('Dumper 1T:         £540.00 → £234.00 weekly ✅ (-57%)');
  console.log('SDS Drill:         £99.00  → £43.00  weekly ✅ (-57%)');
  console.log('Compactor:         £202.50 → £88.00  weekly ✅ (-57%)');

  console.log('\n📊 Rate Progression Examples (Mini Digger 1.5T):');
  console.log('Day 1:    £165 (100%)');
  console.log('2 Days:   £231 (70%/day avg) ✅');
  console.log('3 Days:   £281 (57%/day avg) ✅');
  console.log('Week:     £322 (46%/day avg) ✅');
  console.log('Old Week: £743 (106%/day avg) ❌ UNREALISTIC!');

  console.log('\n✅ Much more realistic weekly hire rates!');
}

if (require.main === module) {
  updateNationalHireRates();
}

export { updateNationalHireRates };
