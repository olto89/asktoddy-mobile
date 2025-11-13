#!/usr/bin/env npx tsx
/**
 * Integrate BuildBuddy scraped data into AskToddy pricing system
 * Converts scraped brick/block data into our MaterialPrice format
 */

import { promises as fs } from 'fs';
import { MaterialPrice } from '../supabase/functions/get-pricing/types.ts';

interface ScrapedBrickProduct {
  id: string;
  name: string;
  category: 'brick' | 'block' | 'paving';
  pricePerUnit: number;
  unit: string;
  supplier: string;
  specifications?: any;
  availability: string;
  scrapedAt: string;
  vatIncluded: boolean;
}

class BuildBuddyIntegrator {
  /**
   * Convert BuildBuddy scraped data to MaterialPrice format
   */
  async integrateScrapedData(): Promise<void> {
    console.log('🔄 Integrating BuildBuddy data...');

    try {
      // Read scraped data
      const scrapedData = await this.loadScrapedData();
      console.log(`📦 Loaded ${scrapedData.length} scraped products`);

      // Convert to MaterialPrice format
      const materialPrices = this.convertToMaterialPrices(scrapedData);
      console.log(`✅ Converted ${materialPrices.length} products`);

      // Generate code for integration
      const codeSnippet = this.generateCodeSnippet(materialPrices);

      // Save to file
      await this.saveIntegrationCode(codeSnippet);

      // Generate summary
      this.generateIntegrationSummary(scrapedData, materialPrices);
    } catch (error) {
      console.error('❌ Integration failed:', error);
    }
  }

  /**
   * Load the latest scraped BuildBuddy data
   */
  private async loadScrapedData(): Promise<ScrapedBrickProduct[]> {
    const filename = 'data/scraped/buildbuddy-scraped-2025-11-13.json';
    const data = await fs.readFile(filename, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Convert scraped products to MaterialPrice format
   */
  private convertToMaterialPrices(scraped: ScrapedBrickProduct[]): MaterialPrice[] {
    return scraped
      .filter(product => product.availability === 'in-stock')
      .map(product => this.convertSingleProduct(product));
  }

  /**
   * Convert single scraped product to MaterialPrice
   */
  private convertSingleProduct(product: ScrapedBrickProduct): MaterialPrice {
    // Calculate price range (±10% of scraped price for realistic range)
    const basePrice = product.pricePerUnit;
    const variation = basePrice * 0.1;

    return {
      id: `buildbuddy_${product.id}`,
      name: product.name,
      category: this.mapToMaterialCategory(product.category),
      priceRange: {
        min: Math.round((basePrice - variation) * 100) / 100,
        max: Math.round((basePrice + variation) * 100) / 100,
        average: basePrice,
      },
      unit: product.unit,
      supplier: `BuildBuddy (${product.supplier})`,
      wasteFactor: this.getWasteFactor(product.category),
      vat: 'included',
      deliveryCharge: 45, // Standard building materials delivery
      minimumOrder: product.category === 'brick' ? 100 : 10,
      lastUpdated: product.scrapedAt,
      specifications: product.specifications,
    };
  }

  /**
   * Map BuildBuddy categories to our material categories
   */
  private mapToMaterialCategory(category: 'brick' | 'block' | 'paving'): string {
    const mapping = {
      brick: 'structural',
      block: 'structural',
      paving: 'structural',
    };
    return mapping[category] || 'structural';
  }

  /**
   * Get appropriate waste factor for material type
   */
  private getWasteFactor(category: string): number {
    const wasteFactors = {
      brick: 0.05, // 5% waste for bricks
      block: 0.03, // 3% waste for blocks
      paving: 0.08, // 8% waste for paving
    };
    return wasteFactors[category] || 0.05;
  }

  /**
   * Generate TypeScript code snippet for integration
   */
  private generateCodeSnippet(materials: MaterialPrice[]): string {
    const codeLines = materials.map(material => {
      return `  {
    id: '${material.id}',
    name: '${material.name}',
    category: '${material.category}',
    priceRange: { min: ${material.priceRange.min}, max: ${material.priceRange.max}, average: ${material.priceRange.average} },
    unit: '${material.unit}',
    supplier: '${material.supplier}',
    wasteFactor: ${material.wasteFactor},
    vat: '${material.vat}',
    deliveryCharge: ${material.deliveryCharge},
    minimumOrder: ${material.minimumOrder},
  }`;
    });

    return `// BuildBuddy scraped materials data - ${new Date().toISOString()}
// Add these to MATERIAL_PRICES array in uk-pricing-data.ts

export const BUILDBUDDY_MATERIALS: MaterialPrice[] = [
${codeLines.join(',\n')}
];

// To integrate: spread into existing MATERIAL_PRICES array
// export const MATERIAL_PRICES: MaterialPrice[] = [
//   ...existing_materials,
//   ...BUILDBUDDY_MATERIALS
// ];`;
  }

  /**
   * Save integration code to file
   */
  private async saveIntegrationCode(code: string): Promise<void> {
    const filename = 'data/scraped/buildbuddy-integration-code.ts';
    await fs.writeFile(filename, code);
    console.log(`💾 Integration code saved to: ${filename}`);
  }

  /**
   * Generate summary report
   */
  private generateIntegrationSummary(
    scraped: ScrapedBrickProduct[],
    materials: MaterialPrice[]
  ): void {
    console.log('\n📊 BUILDBUDDY INTEGRATION SUMMARY');
    console.log('==================================');
    console.log(`Scraped Products: ${scraped.length}`);
    console.log(`Converted to Materials: ${materials.length}`);
    console.log(
      `Price Range: £${Math.min(...materials.map(m => m.priceRange.min))} - £${Math.max(...materials.map(m => m.priceRange.max))}`
    );

    // Category breakdown
    const categories = materials.reduce(
      (acc, m) => {
        const category = m.name.includes('Block')
          ? 'Blocks'
          : m.name.includes('Slip')
            ? 'Brick Slips'
            : m.name.includes('Engineering')
              ? 'Engineering Bricks'
              : m.name.includes('Facing')
                ? 'Facing Bricks'
                : 'Common Bricks';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\nCategory Breakdown:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} items`);
    });

    // Supplier breakdown
    const suppliers = materials.reduce(
      (acc, m) => {
        acc[m.supplier] = (acc[m.supplier] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\nSupplier Breakdown:');
    Object.entries(suppliers).forEach(([supplier, count]) => {
      console.log(`  ${supplier}: ${count} items`);
    });

    console.log('\n💡 Integration Instructions:');
    console.log('1. Review the generated code in data/scraped/buildbuddy-integration-code.ts');
    console.log('2. Copy the BUILDBUDDY_MATERIALS array');
    console.log('3. Add to uk-pricing-data.ts MATERIAL_PRICES array');
    console.log('4. Test the updated pricing in the app');
    console.log('==================================\n');
  }
}

// Main execution
async function main() {
  const integrator = new BuildBuddyIntegrator();
  await integrator.integrateScrapedData();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BuildBuddyIntegrator };
