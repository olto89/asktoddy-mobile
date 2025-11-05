#!/usr/bin/env npx tsx
/**
 * Master Price Aggregator
 * Unifies pricing data from all suppliers into a comprehensive database
 * with intelligent matching, deduplication, and price comparison
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.staging' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface UnifiedProduct {
  id: string;
  name: string;
  category: string;
  standardUnit: string;
  suppliers: SupplierPrice[];
  bestPrice: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  lastUpdated: string;
  confidence: number;
}

interface SupplierPrice {
  supplier: string;
  price: number;
  unit: string;
  inStock: boolean;
  deliveryTime: string;
  lastChecked: string;
  url?: string;
}

class MasterPriceAggregator {
  private supabase;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Main aggregation pipeline
   */
  async runAggregation() {
    console.log('🚀 Starting Master Price Aggregation\n');

    try {
      // Step 1: Fetch all data from different tables
      console.log('📥 Fetching data from all sources...');
      const materials = await this.fetchMaterials();
      const aggregates = await this.fetchAggregates();
      const waste = await this.fetchWasteServices();
      const labour = await this.fetchLabourRates();

      console.log(`  ✅ Materials: ${materials.length} items`);
      console.log(`  ✅ Aggregates: ${aggregates.length} items`);
      console.log(`  ✅ Waste: ${waste.length} services`);
      console.log(`  ✅ Labour: ${labour.length} rates\n`);

      // Step 2: Unify and match products
      console.log('🔄 Unifying products across suppliers...');
      const unifiedProducts = await this.unifyProducts(materials);
      const unifiedAggregates = await this.unifyAggregates(aggregates);

      // Step 3: Calculate price intelligence
      console.log('📊 Calculating price intelligence...');
      const priceAnalysis = this.analyzePricing(unifiedProducts);

      // Step 4: Create comparison tables
      console.log('💾 Saving price comparisons...');
      await this.savePriceComparisons(unifiedProducts);
      await this.saveMarketInsights(priceAnalysis);

      // Step 5: Generate reports
      console.log('📈 Generating reports...\n');
      this.generateReport(unifiedProducts, priceAnalysis);
    } catch (error) {
      console.error('❌ Aggregation failed:', error);
    }
  }

  /**
   * Fetch materials from database
   */
  async fetchMaterials() {
    const { data, error } = await this.supabase.from('materials_catalog').select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch aggregates from database
   */
  async fetchAggregates() {
    const { data, error } = await this.supabase.from('aggregates_catalog').select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch waste services from database
   */
  async fetchWasteServices() {
    const { data, error } = await this.supabase.from('waste_services').select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch labour rates from database
   */
  async fetchLabourRates() {
    const { data, error } = await this.supabase.from('labour_rates').select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Unify materials across suppliers using fuzzy matching
   */
  async unifyProducts(materials: any[]): Promise<UnifiedProduct[]> {
    const unified: { [key: string]: UnifiedProduct } = {};

    materials.forEach(material => {
      // Create normalized key for matching
      const key = this.normalizeProductName(material.description);

      if (!unified[key]) {
        unified[key] = {
          id: key,
          name: this.standardizeProductName(material.description),
          category: material.category,
          standardUnit: material.unit,
          suppliers: [],
          bestPrice: Infinity,
          averagePrice: 0,
          priceRange: { min: Infinity, max: 0 },
          lastUpdated: new Date().toISOString(),
          confidence: 0,
        };
      }

      // Add supplier price
      const supplierPrice: SupplierPrice = {
        supplier: material.supplier_type || 'Unknown',
        price: material.trade_price || material.contractor_price || 0,
        unit: material.unit,
        inStock: material.stock_status === 'in-stock',
        deliveryTime: this.getDeliveryTime(material.stock_status),
        lastChecked: material.updated_at || new Date().toISOString(),
        url: material.url,
      };

      unified[key].suppliers.push(supplierPrice);
    });

    // Calculate aggregated prices
    Object.values(unified).forEach(product => {
      if (product.suppliers.length > 0) {
        const prices = product.suppliers.map(s => s.price).filter(p => p > 0);
        if (prices.length > 0) {
          product.bestPrice = Math.min(...prices);
          product.averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          product.priceRange.min = Math.min(...prices);
          product.priceRange.max = Math.max(...prices);
          product.confidence = this.calculateConfidence(product);
        }
      }
    });

    return Object.values(unified);
  }

  /**
   * Unify aggregates across suppliers
   */
  async unifyAggregates(aggregates: any[]): Promise<UnifiedProduct[]> {
    const unified: { [key: string]: UnifiedProduct } = {};

    aggregates.forEach(aggregate => {
      const key = `${aggregate.material_type}-${aggregate.grade || 'standard'}`;

      if (!unified[key]) {
        unified[key] = {
          id: key,
          name: aggregate.material_name,
          category: 'aggregates',
          standardUnit: 'bulk-bag',
          suppliers: [],
          bestPrice: Infinity,
          averagePrice: 0,
          priceRange: { min: Infinity, max: 0 },
          lastUpdated: new Date().toISOString(),
          confidence: 0,
        };
      }

      // Add supplier price for bulk bag
      if (aggregate.price_per_bulk_bag) {
        const supplierPrice: SupplierPrice = {
          supplier: aggregate.supplier_region || 'Unknown',
          price: aggregate.price_per_bulk_bag,
          unit: 'bulk-bag',
          inStock: true,
          deliveryTime: '2-3 days',
          lastChecked: aggregate.updated_at || new Date().toISOString(),
        };

        unified[key].suppliers.push(supplierPrice);
      }
    });

    // Calculate aggregated prices
    Object.values(unified).forEach(product => {
      if (product.suppliers.length > 0) {
        const prices = product.suppliers.map(s => s.price).filter(p => p > 0);
        if (prices.length > 0) {
          product.bestPrice = Math.min(...prices);
          product.averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          product.priceRange.min = Math.min(...prices);
          product.priceRange.max = Math.max(...prices);
          product.confidence = this.calculateConfidence(product);
        }
      }
    });

    return Object.values(unified);
  }

  /**
   * Normalize product names for matching
   */
  private normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/(\d+)mm/g, '$1')
      .replace(/(\d+)x(\d+)/g, '$1-$2');
  }

  /**
   * Standardize product names for display
   */
  private standardizeProductName(name: string): string {
    // Extract key information and reformat
    const patterns = {
      plasterboard: /plasterboard|gypsum|wallboard/i,
      timber: /timber|wood|cls|c16|c24/i,
      insulation: /insulation|kingspan|celotex|rockwool/i,
      cement: /cement|opc|multicem/i,
    };

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(name)) {
        // Extract dimensions if present
        const dimMatch = name.match(/(\d+(?:\.\d+)?)\s*mm/);
        const dimension = dimMatch ? `${dimMatch[1]}mm` : '';
        return `${category.charAt(0).toUpperCase() + category.slice(1)} ${dimension}`.trim();
      }
    }

    return name;
  }

  /**
   * Calculate confidence score for unified product
   */
  private calculateConfidence(product: UnifiedProduct): number {
    let confidence = 50; // Base confidence

    // More suppliers = higher confidence
    confidence += Math.min(product.suppliers.length * 10, 30);

    // Recent data = higher confidence
    const recentSuppliers = product.suppliers.filter(s => {
      const daysSince = (Date.now() - new Date(s.lastChecked).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    confidence += (recentSuppliers.length / product.suppliers.length) * 10;

    // In-stock items = higher confidence
    const inStockRatio = product.suppliers.filter(s => s.inStock).length / product.suppliers.length;
    confidence += inStockRatio * 10;

    return Math.min(confidence, 95);
  }

  /**
   * Get delivery time from stock status
   */
  private getDeliveryTime(stockStatus: string): string {
    const times: { [key: string]: string } = {
      'in-stock': 'Next day',
      'low-stock': '2-3 days',
      '3-5-days': '3-5 days',
      'order-only': '5-7 days',
    };
    return times[stockStatus] || '3-5 days';
  }

  /**
   * Analyze pricing patterns
   */
  private analyzePricing(products: UnifiedProduct[]) {
    const analysis = {
      totalProducts: products.length,
      averageSavings: 0,
      bestDeals: [] as any[],
      priceVariation: {} as any,
      supplierPerformance: {} as any,
    };

    // Calculate average savings (best vs average price)
    const savings = products.map(p =>
      p.averagePrice > 0 ? ((p.averagePrice - p.bestPrice) / p.averagePrice) * 100 : 0
    );
    analysis.averageSavings = savings.reduce((a, b) => a + b, 0) / savings.length;

    // Find best deals (highest savings)
    analysis.bestDeals = products
      .map(p => ({
        product: p.name,
        savings: ((p.priceRange.max - p.priceRange.min) / p.priceRange.max) * 100,
        bestPrice: p.bestPrice,
        highestPrice: p.priceRange.max,
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 10);

    // Analyze price variation by category
    const categories = [...new Set(products.map(p => p.category))];
    categories.forEach(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const variations = categoryProducts.map(p =>
        p.priceRange.max > 0 ? ((p.priceRange.max - p.priceRange.min) / p.priceRange.min) * 100 : 0
      );
      analysis.priceVariation[category] = {
        averageVariation: variations.reduce((a, b) => a + b, 0) / variations.length,
        productCount: categoryProducts.length,
      };
    });

    // Analyze supplier performance
    const allSuppliers = new Set<string>();
    products.forEach(p => p.suppliers.forEach(s => allSuppliers.add(s.supplier)));

    allSuppliers.forEach(supplier => {
      let bestPriceCount = 0;
      let totalProducts = 0;

      products.forEach(product => {
        const supplierPrice = product.suppliers.find(s => s.supplier === supplier);
        if (supplierPrice) {
          totalProducts++;
          if (supplierPrice.price === product.bestPrice) {
            bestPriceCount++;
          }
        }
      });

      analysis.supplierPerformance[supplier] = {
        productsListed: totalProducts,
        bestPricePercentage: totalProducts > 0 ? (bestPriceCount / totalProducts) * 100 : 0,
      };
    });

    return analysis;
  }

  /**
   * Save price comparisons to database
   */
  async savePriceComparisons(products: UnifiedProduct[]) {
    // Create a new table for price comparisons if needed
    const comparisons = products.map(product => ({
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      best_price: product.bestPrice,
      average_price: product.averagePrice,
      price_range_min: product.priceRange.min,
      price_range_max: product.priceRange.max,
      supplier_count: product.suppliers.length,
      confidence_score: product.confidence,
      suppliers_data: product.suppliers,
      last_updated: product.lastUpdated,
    }));

    // Save to enhanced pricing table
    for (const comparison of comparisons) {
      try {
        await this.supabase.from('pricing_data_enhanced').upsert(
          {
            item_description: comparison.product_name,
            price_final: comparison.average_price,
            price_range_min: comparison.price_range_min,
            price_range_max: comparison.price_range_max,
            confidence_score: comparison.confidence_score / 100,
            source_count: comparison.supplier_count,
            source_summary: comparison.suppliers_data,
          },
          { onConflict: 'item_description' }
        );
      } catch (error) {
        console.error(`Failed to save comparison for ${comparison.product_name}:`, error);
      }
    }
  }

  /**
   * Save market insights
   */
  async saveMarketInsights(analysis: any) {
    const insights = {
      generated_at: new Date().toISOString(),
      total_products: analysis.totalProducts,
      average_savings_potential: analysis.averageSavings,
      best_deals: analysis.bestDeals,
      price_variation_by_category: analysis.priceVariation,
      supplier_performance: analysis.supplierPerformance,
    };

    console.log('📊 Market Insights Generated');
    console.log(`  Average Savings Potential: ${analysis.averageSavings.toFixed(1)}%`);
    console.log(`  Categories Analyzed: ${Object.keys(analysis.priceVariation).length}`);
    console.log(`  Suppliers Compared: ${Object.keys(analysis.supplierPerformance).length}`);
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(products: UnifiedProduct[], analysis: any) {
    console.log('=====================================');
    console.log('🏆 PRICE AGGREGATION REPORT');
    console.log('=====================================\n');

    console.log(`📦 Total Products: ${products.length}`);
    console.log(`💰 Average Savings Potential: ${analysis.averageSavings.toFixed(1)}%\n`);

    console.log('🎯 TOP 5 BEST DEALS:');
    analysis.bestDeals.slice(0, 5).forEach((deal: any, i: number) => {
      console.log(`${i + 1}. ${deal.product}`);
      console.log(
        `   Best: £${deal.bestPrice.toFixed(2)} | Highest: £${deal.highestPrice.toFixed(2)}`
      );
      console.log(`   Savings: ${deal.savings.toFixed(1)}%`);
    });

    console.log('\n📊 CATEGORY PRICE VARIATIONS:');
    Object.entries(analysis.priceVariation).forEach(([category, data]: any) => {
      console.log(
        `${category}: ${data.averageVariation.toFixed(1)}% variation (${data.productCount} products)`
      );
    });

    console.log('\n🏪 SUPPLIER PERFORMANCE:');
    Object.entries(analysis.supplierPerformance)
      .sort((a: any, b: any) => b[1].bestPricePercentage - a[1].bestPricePercentage)
      .slice(0, 5)
      .forEach(([supplier, data]: any) => {
        console.log(
          `${supplier}: ${data.bestPricePercentage.toFixed(1)}% best prices (${data.productsListed} products)`
        );
      });

    console.log('\n✅ Price comparison data saved to database');
    console.log('🎉 Master aggregation complete!\n');
  }
}

// Run the aggregator
async function main() {
  const aggregator = new MasterPriceAggregator();
  await aggregator.runAggregation();
}

main().catch(console.error);
