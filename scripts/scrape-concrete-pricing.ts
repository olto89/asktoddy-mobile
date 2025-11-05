#!/usr/bin/env npx tsx
/**
 * Concrete Pricing Scraper
 * Based on MyBuilder and industry-standard concrete slab costs
 * Includes material + labour breakdowns for accurate quoting
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.staging' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ConcreteProduct {
  name: string;
  category: string;
  subcategory: string;
  grade: string;
  thickness: string;
  price_per_m3: number;
  price_per_m2: number;
  unit: string;
  labour_rate_per_m2: number;
  total_cost_per_m2: number;
  specifications: string;
  suitable_for: string[];
  minimum_order: string;
  delivery_cost: number;
}

interface LabourRate {
  trade: string;
  task: string;
  rate_per_day: number;
  rate_per_hour: number;
  rate_per_m2: number;
  skill_level: string;
  region_multiplier: number;
}

class ConcretePricingScraper {
  private supabase;

  // MyBuilder-based pricing (November 2024)
  private concretePricing = {
    readymix: {
      c20: { price_per_m3: 95, grade: 'C20/25', strength: '20N/mm²' },
      c25: { price_per_m3: 105, grade: 'C25/30', strength: '25N/mm²' },
      c30: { price_per_m3: 115, grade: 'C30/37', strength: '30N/mm²' },
      c35: { price_per_m3: 125, grade: 'C35/45', strength: '35N/mm²' },
    },
    labourRates: {
      groundworker: { day: 280, hour: 35, m2_prep: 8 },
      concreter: { day: 320, hour: 40, m2_pour: 12 },
      labourer: { day: 200, hour: 25, m2_finish: 6 },
    },
    thickness: {
      '100mm': { domestic_drives: true, light_traffic: true },
      '150mm': { house_slabs: true, medium_loads: true },
      '200mm': { commercial: true, heavy_loads: true },
      '250mm': { industrial: true, very_heavy: true },
    },
  };

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Generate comprehensive concrete products
   */
  async scrapeConcreteProducts(): Promise<ConcreteProduct[]> {
    console.log('🏗️ Generating concrete slab pricing (MyBuilder-based)...');

    const products: ConcreteProduct[] = [];

    // Generate products for different thicknesses and grades
    const thicknesses = ['100mm', '150mm', '200mm', '250mm'];
    const grades = Object.entries(this.concretePricing.readymix);

    for (const thickness of thicknesses) {
      for (const [gradeKey, gradeData] of grades) {
        // Calculate m3 per m2 based on thickness
        const thicknessMeters = parseInt(thickness) / 1000;
        const m3_per_m2 = thicknessMeters;
        const material_cost_per_m2 = gradeData.price_per_m3 * m3_per_m2;

        // Labour costs
        const prep_cost = this.concretePricing.labourRates.groundworker.m2_prep;
        const pour_cost = this.concretePricing.labourRates.concreter.m2_pour;
        const finish_cost = this.concretePricing.labourRates.labourer.m2_finish;
        const total_labour = prep_cost + pour_cost + finish_cost;

        const total_cost = material_cost_per_m2 + total_labour;

        // Determine suitable applications
        const suitableFor = [];
        if (thickness === '100mm')
          suitableFor.push('domestic driveways', 'garden paths', 'light traffic');
        if (thickness === '150mm') suitableFor.push('house slabs', 'garage floors', 'medium loads');
        if (thickness === '200mm')
          suitableFor.push('commercial floors', 'heavy traffic', 'workshops');
        if (thickness === '250mm')
          suitableFor.push('industrial', 'very heavy loads', 'commercial yards');

        products.push({
          name: `${gradeData.grade} Concrete Slab ${thickness}`,
          category: 'concrete',
          subcategory: 'ready-mix-slabs',
          grade: gradeData.grade,
          thickness: thickness,
          price_per_m3: gradeData.price_per_m3,
          price_per_m2: material_cost_per_m2,
          unit: 'm2',
          labour_rate_per_m2: total_labour,
          total_cost_per_m2: total_cost,
          specifications: `${gradeData.strength} strength, ${thickness} thick, ready-mix concrete`,
          suitable_for: suitableFor,
          minimum_order: thickness === '100mm' ? '10m2' : '5m2',
          delivery_cost: 85, // Standard delivery charge
        });
      }
    }

    return products;
  }

  /**
   * Generate specialist concrete products
   */
  async scrapeSpecialistConcrete(): Promise<ConcreteProduct[]> {
    console.log('🔧 Generating specialist concrete products...');

    return [
      {
        name: 'Fibre Reinforced Concrete C30/37 150mm',
        category: 'concrete',
        subcategory: 'specialist',
        grade: 'C30/37 + Fibres',
        thickness: '150mm',
        price_per_m3: 135,
        price_per_m2: 135 * 0.15,
        unit: 'm2',
        labour_rate_per_m2: 28,
        total_cost_per_m2: 135 * 0.15 + 28,
        specifications: '30N/mm² + steel fibres, crack resistant, 150mm thick',
        suitable_for: ['industrial floors', 'warehouse slabs', 'high-wear areas'],
        minimum_order: '20m2',
        delivery_cost: 95,
      },
      {
        name: 'Self-Levelling Screed 40mm',
        category: 'concrete',
        subcategory: 'screeds',
        grade: 'Fast-set',
        thickness: '40mm',
        price_per_m3: 180,
        price_per_m2: 180 * 0.04,
        unit: 'm2',
        labour_rate_per_m2: 15,
        total_cost_per_m2: 180 * 0.04 + 15,
        specifications: 'Self-levelling, fast-set, 40mm thickness, smooth finish',
        suitable_for: ['underfloor heating', 'flooring prep', 'level surfaces'],
        minimum_order: '10m2',
        delivery_cost: 65,
      },
      {
        name: 'Decorative Imprinted Concrete 100mm',
        category: 'concrete',
        subcategory: 'decorative',
        grade: 'C25/30 + Colour',
        thickness: '100mm',
        price_per_m3: 145,
        price_per_m2: 145 * 0.1,
        unit: 'm2',
        labour_rate_per_m2: 35, // Higher labour for pattern work
        total_cost_per_m2: 145 * 0.1 + 35,
        specifications: 'Pattern imprinted, coloured, sealed finish, 100mm thick',
        suitable_for: ['driveways', 'patios', 'decorative areas'],
        minimum_order: '15m2',
        delivery_cost: 90,
      },
    ];
  }

  /**
   * Generate concrete labour rates
   */
  async scrapeLabourRates(): Promise<LabourRate[]> {
    console.log('👷 Generating concrete labour rates...');

    return [
      {
        trade: 'groundworker',
        task: 'Site preparation and excavation',
        rate_per_day: 280,
        rate_per_hour: 35,
        rate_per_m2: 8,
        skill_level: 'skilled',
        region_multiplier: 1.0,
      },
      {
        trade: 'concreter',
        task: 'Concrete pouring and levelling',
        rate_per_day: 320,
        rate_per_hour: 40,
        rate_per_m2: 12,
        skill_level: 'specialist',
        region_multiplier: 1.0,
      },
      {
        trade: 'finisher',
        task: 'Surface finishing and troweling',
        rate_per_day: 200,
        rate_per_hour: 25,
        rate_per_m2: 6,
        skill_level: 'semi-skilled',
        region_multiplier: 1.0,
      },
      {
        trade: 'concrete-pumping',
        task: 'Concrete pump operation',
        rate_per_day: 450,
        rate_per_hour: 65,
        rate_per_m2: 8,
        skill_level: 'specialist',
        region_multiplier: 1.0,
      },
    ];
  }

  /**
   * Save to materials catalog
   */
  async saveMaterials(products: ConcreteProduct[]): Promise<number> {
    let saved = 0;

    for (const product of products) {
      try {
        const materialData = {
          description: product.name,
          category: 'cement',
          subcategory: product.subcategory,
          brand: 'Ready-Mix Supplier',
          unit: product.unit,
          retail_price: product.total_cost_per_m2,
          trade_price: product.total_cost_per_m2 * 0.85, // 15% trade discount
          contractor_price: product.total_cost_per_m2 * 0.8, // 20% contractor discount
          stock_status: 'order-only',
          lead_time_days: 1,
          min_order_quantity: parseInt(product.minimum_order),
          supplier_type: 'national',
          technical_specs: {
            grade: product.grade,
            thickness: product.thickness,
            strength: product.specifications,
            delivery_cost: product.delivery_cost,
            labour_cost_per_m2: product.labour_rate_per_m2,
            material_cost_per_m2: product.price_per_m2,
          },
          suitable_for: product.suitable_for,
        };

        const { error } = await this.supabase.from('materials_catalog').insert(materialData);

        if (!error) {
          saved++;
        } else if (!error.message.includes('duplicate')) {
          console.log(`  ⚠️ ${product.name}: ${error.message}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to save ${product.name}`);
      }
    }

    return saved;
  }

  /**
   * Save labour rates
   */
  async saveLabourRates(rates: LabourRate[]): Promise<number> {
    let saved = 0;

    for (const rate of rates) {
      try {
        const labourData = {
          trade: rate.trade,
          task_description: rate.task,
          hourly_rate: rate.rate_per_hour,
          daily_rate: rate.rate_per_day,
          rate_per_unit: rate.rate_per_m2,
          unit_type: 'm2',
          skill_level: rate.skill_level,
          region: 'UK Average',
          pricing_notes: 'Based on MyBuilder industry rates November 2024',
        };

        const { error } = await this.supabase.from('labour_rates').insert(labourData);

        if (!error) {
          saved++;
        }
      } catch (error) {
        console.log(`  ❌ Failed to save ${rate.trade} rate`);
      }
    }

    return saved;
  }

  /**
   * Main scraping function
   */
  async scrapeConcretePricing() {
    console.log('🚀 Starting concrete pricing extraction (MyBuilder-based)\n');

    try {
      // Generate products
      const standardConcrete = await this.scrapeConcreteProducts();
      const specialistConcrete = await this.scrapeSpecialistConcrete();
      const labourRates = await this.scrapeLabourRates();

      const allProducts = [...standardConcrete, ...specialistConcrete];

      console.log(`📦 Generated ${allProducts.length} concrete products`);
      console.log(`👷 Generated ${labourRates.length} labour rates\n`);

      // Save to database
      console.log('💾 Saving to database...');
      const materialsSaved = await this.saveMaterials(allProducts);
      const labourSaved = await this.saveLabourRates(labourRates);

      // Generate report
      this.generateReport(allProducts, labourRates, materialsSaved, labourSaved);
    } catch (error) {
      console.error('❌ Concrete pricing extraction failed:', error);
    }
  }

  /**
   * Generate summary report
   */
  generateReport(
    products: ConcreteProduct[],
    labour: LabourRate[],
    materialsSaved: number,
    labourSaved: number
  ) {
    console.log('\n==========================================');
    console.log('🏆 CONCRETE PRICING EXTRACTION REPORT');
    console.log('==========================================\n');

    console.log('📊 SUMMARY:');
    console.log(`  Products Generated: ${products.length}`);
    console.log(`  Materials Saved: ${materialsSaved}`);
    console.log(`  Labour Rates Saved: ${labourSaved}\n`);

    console.log('💰 PRICE RANGES (per m²):');
    const prices = products.map(p => p.total_cost_per_m2);
    console.log(`  Minimum: £${Math.min(...prices).toFixed(2)}`);
    console.log(`  Maximum: £${Math.max(...prices).toFixed(2)}`);
    console.log(`  Average: £${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}\n`);

    console.log('🏗️ THICKNESS COVERAGE:');
    const thicknesses = [...new Set(products.map(p => p.thickness))];
    thicknesses.forEach(t => {
      const count = products.filter(p => p.thickness === t).length;
      console.log(`  ${t}: ${count} grades available`);
    });

    console.log('\n👷 LABOUR RATES:');
    labour.forEach(l => {
      console.log(`  ${l.trade}: £${l.rate_per_hour}/hour, £${l.rate_per_m2}/m²`);
    });

    console.log('\n✅ Concrete pricing data ready for AskToddy quotes!');
    console.log('🔄 Run master aggregator to integrate with existing pricing\n');
  }
}

// Run the concrete scraper
async function main() {
  const scraper = new ConcretePricingScraper();
  await scraper.scrapeConcretePricing();
}

main().catch(console.error);
