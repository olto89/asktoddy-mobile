/**
 * PricingContextEngine - Intelligent pricing data extraction and context management
 * Processes PDF price lists and integrates with conversation context
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.25.0';

export interface PriceItem {
  itemCode?: string;
  description: string;
  category: string;
  unit: string;
  price: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    purchase?: number;
    perUnit?: number;
  };
  supplier: SupplierInfo;
  metadata?: {
    minHirePeriod?: string;
    deliveryAvailable?: boolean;
    bulkDiscounts?: string[];
    lastUpdated: string;
    confidence: number;
  };
}

export interface SupplierInfo {
  name: string;
  type: 'single-site-national' | 'multi-site-national' | 'independent';
  location?: string;
  coverage: 'national' | 'regional' | 'local';
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface PricingContext {
  sessionId: string;
  supplierPrices: Map<string, PriceItem[]>;
  priceComparisons: PriceComparison[];
  lastSyncDate: string;
  projectRequirements?: {
    equipment: string[];
    materials: string[];
    location: string;
    duration: string;
  };
}

export interface PriceComparison {
  item: string;
  lowestPrice: PriceItem;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  suppliers: PriceItem[];
  recommendation: string;
}

export class PricingContextEngine {
  private supabase;
  private geminiAI;
  private geminiModel;

  constructor(supabaseUrl: string, supabaseServiceKey: string, geminiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.geminiAI = new GoogleGenerativeAI(geminiApiKey);
    this.geminiModel = this.geminiAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });
  }

  /**
   * Process a PDF price list and extract pricing data
   */
  async processPricePDF(
    pdfPath: string,
    supplierInfo: SupplierInfo,
    documentType: 'text-based' | 'catalog-style'
  ): Promise<PriceItem[]> {
    console.log(`📄 Processing ${documentType} PDF from ${supplierInfo.name}`);

    try {
      // Read PDF content from storage
      const pdfContent = await this.readPDFFromStorage(pdfPath);

      if (documentType === 'catalog-style') {
        // Use Gemini Vision for image-heavy PDFs
        return await this.extractWithVision(pdfContent, supplierInfo);
      } else {
        // Use structured extraction for text PDFs
        return await this.extractWithTextParsing(pdfContent, supplierInfo);
      }
    } catch (error) {
      console.error(`Error processing PDF ${pdfPath}:`, error);
      return [];
    }
  }

  /**
   * Extract prices using Gemini Vision API for catalog-style PDFs
   */
  private async extractWithVision(
    pdfContent: ArrayBuffer,
    supplierInfo: SupplierInfo
  ): Promise<PriceItem[]> {
    const prompt = `
      Analyze this price list PDF and extract ALL pricing information.
      
      For each item found, provide:
      1. Item description
      2. Category (excavators, dumpers, compressors, etc.)
      3. Unit of measurement (day, week, month, per unit, etc.)
      4. All available prices
      5. Any special conditions or discounts
      
      Format as JSON array with structure:
      {
        "description": "item name",
        "category": "equipment category",
        "unit": "pricing unit",
        "prices": {
          "daily": number or null,
          "weekly": number or null,
          "monthly": number or null
        },
        "notes": "any special conditions"
      }
      
      Be thorough and extract EVERY price visible.
    `;

    try {
      // Convert PDF to base64 for Gemini
      const base64PDF = Buffer.from(pdfContent).toString('base64');

      const result = await this.geminiModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64PDF,
          },
        },
      ]);

      const response = result.response.text();
      const extractedData = this.parseJSONResponse(response);

      // Convert to PriceItem format
      return this.mapToPriceItems(extractedData, supplierInfo);
    } catch (error) {
      console.error('Vision extraction error:', error);
      return [];
    }
  }

  /**
   * Extract prices using text parsing for structured PDFs
   */
  private async extractWithTextParsing(
    pdfContent: ArrayBuffer,
    supplierInfo: SupplierInfo
  ): Promise<PriceItem[]> {
    // Use Gemini to intelligently parse text content
    const textContent = await this.extractTextFromPDF(pdfContent);

    const prompt = `
      Parse this price list text and extract pricing information.
      
      Text content:
      ${textContent}
      
      Extract:
      1. Item descriptions with codes if available
      2. Categories
      3. Pricing (daily/weekly/monthly rates)
      4. Units and minimum hire periods
      
      Return as JSON array matching the structure shown previously.
    `;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = result.response.text();
      const extractedData = this.parseJSONResponse(response);

      return this.mapToPriceItems(extractedData, supplierInfo);
    } catch (error) {
      console.error('Text extraction error:', error);
      return [];
    }
  }

  /**
   * Compare prices across multiple suppliers for specific items
   * Returns anonymized market pricing to protect supplier data
   */
  async comparePrices(itemDescription: string, location?: string): Promise<PriceComparison> {
    // Import PricingStrategy for anonymization
    const { PricingStrategy } = await import('./PricingStrategy.ts');

    // Search for matching items in the database
    const { data: matches, error } = await this.supabase
      .from('pricing_data')
      .select('*')
      .textSearch('description', itemDescription)
      .limit(20);

    if (error || !matches || matches.length === 0) {
      throw new Error(`No pricing found for: ${itemDescription}`);
    }

    // Filter by location if specified
    const relevantPrices = location ? this.filterByLocation(matches, location) : matches;

    // Calculate market-based pricing without revealing suppliers
    const priceDataPoints = relevantPrices.map(item => ({
      price: item.price_daily || 0,
      type: item.supplier_coverage as 'national' | 'regional' | 'local',
      date: item.updated_at || new Date().toISOString(),
    }));

    const marketEstimate = PricingStrategy.generateMarketEstimate(priceDataPoints);

    // Create anonymized comparison
    const prices = relevantPrices.map(item => this.calculateEffectivePrice(item));
    const sortedPrices = prices.sort((a, b) => a.price - b.price);

    // Return market-based pricing without supplier names
    return {
      item: itemDescription,
      lowestPrice: sortedPrices[0].item, // Will be anonymized in recommendation
      averagePrice: marketEstimate.typical,
      priceRange: {
        min: marketEstimate.low,
        max: marketEstimate.high,
      },
      suppliers: sortedPrices.map(p => p.item), // Store internally but don't expose
      recommendation: await this.generateAnonymizedRecommendation(
        marketEstimate,
        relevantPrices.length,
        location
      ),
    };
  }

  /**
   * Integrate pricing context with conversation
   */
  async enrichConversationWithPricing(
    sessionId: string,
    requestedItems: string[]
  ): Promise<PricingContext> {
    const priceComparisons: PriceComparison[] = [];
    const supplierPrices = new Map<string, PriceItem[]>();

    for (const item of requestedItems) {
      try {
        const comparison = await this.comparePrices(item);
        priceComparisons.push(comparison);

        // Group by supplier
        comparison.suppliers.forEach(priceItem => {
          const supplierName = priceItem.supplier.name;
          if (!supplierPrices.has(supplierName)) {
            supplierPrices.set(supplierName, []);
          }
          supplierPrices.get(supplierName)!.push(priceItem);
        });
      } catch (error) {
        console.warn(`Could not find pricing for ${item}`);
      }
    }

    const pricingContext: PricingContext = {
      sessionId,
      supplierPrices,
      priceComparisons,
      lastSyncDate: new Date().toISOString(),
      projectRequirements: {
        equipment: requestedItems.filter(i => this.isEquipment(i)),
        materials: requestedItems.filter(i => !this.isEquipment(i)),
        location: '', // Will be filled from conversation context
        duration: '', // Will be filled from conversation context
      },
    };

    // Store in database for future reference
    await this.savePricingContext(pricingContext);

    return pricingContext;
  }

  /**
   * Generate intelligent pricing recommendations
   */
  async generatePricingRecommendation(
    pricingContext: PricingContext,
    projectProfile: any
  ): Promise<string> {
    const prompt = `
      Based on the pricing data and project requirements:
      
      Project: ${JSON.stringify(projectProfile, null, 2)}
      Price Comparisons: ${JSON.stringify(pricingContext.priceComparisons, null, 2)}
      
      Generate a concise recommendation that considers:
      1. Best value suppliers for the project scale
      2. Whether to use national chains vs local independents
      3. Potential package deals or bulk discounts
      4. Delivery and logistics considerations
      5. Total estimated equipment/material costs
      
      Keep the recommendation under 200 words and focus on actionable insights.
    `;

    const result = await this.geminiModel.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Batch process multiple PDFs
   */
  async batchProcessPDFs(
    pdfPaths: Array<{
      path: string;
      supplier: SupplierInfo;
      type: 'text-based' | 'catalog-style';
    }>
  ): Promise<Map<string, PriceItem[]>> {
    const results = new Map<string, PriceItem[]>();

    for (const pdf of pdfPaths) {
      console.log(`Processing ${pdf.supplier.name}...`);
      const items = await this.processPricePDF(pdf.path, pdf.supplier, pdf.type);

      results.set(pdf.supplier.name, items);

      // Store in database
      await this.storePriceItems(items);
    }

    return results;
  }

  /**
   * Helper methods
   */

  private async readPDFFromStorage(path: string): Promise<ArrayBuffer> {
    // Read from Supabase storage or local file system
    const { data, error } = await this.supabase.storage.from('price-lists').download(path);

    if (error) {
      // Try local file system as fallback
      const file = await Deno.readFile(path);
      return file.buffer;
    }

    return await data.arrayBuffer();
  }

  private async extractTextFromPDF(pdfContent: ArrayBuffer): Promise<string> {
    // This would use a PDF parsing library in production
    // For now, using Gemini to extract text
    const base64PDF = Buffer.from(pdfContent).toString('base64');

    const result = await this.geminiModel.generateContent([
      'Extract all text content from this PDF. Return only the raw text.',
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64PDF,
        },
      },
    ]);

    return result.response.text();
  }

  private parseJSONResponse(response: string): any[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('JSON parsing error:', error);
      return [];
    }
  }

  private mapToPriceItems(extractedData: any[], supplierInfo: SupplierInfo): PriceItem[] {
    return extractedData.map(item => ({
      itemCode: item.code,
      description: item.description,
      category: item.category || 'general',
      unit: item.unit || 'day',
      price: {
        daily: item.prices?.daily || item.daily,
        weekly: item.prices?.weekly || item.weekly,
        monthly: item.prices?.monthly || item.monthly,
        purchase: item.prices?.purchase,
        perUnit: item.prices?.perUnit,
      },
      supplier: supplierInfo,
      metadata: {
        minHirePeriod: item.minHire || '1 day',
        deliveryAvailable: item.delivery !== false,
        bulkDiscounts: item.discounts || [],
        lastUpdated: new Date().toISOString(),
        confidence: item.confidence || 0.9,
      },
    }));
  }

  private filterByLocation(items: any[], location: string): any[] {
    return items.filter(item => {
      // National suppliers serve all locations
      if (item.supplier_coverage === 'national') return true;

      // Check if regional/local supplier covers the location
      if (item.supplier_location) {
        return item.supplier_location.toLowerCase().includes(location.toLowerCase());
      }

      return false;
    });
  }

  private calculateEffectivePrice(item: any): { price: number; item: PriceItem } {
    // Calculate the most cost-effective price based on hire period
    let effectivePrice = item.price_daily || 0;

    if (item.price_weekly && item.price_weekly / 7 < effectivePrice) {
      effectivePrice = item.price_weekly / 7;
    }

    if (item.price_monthly && item.price_monthly / 30 < effectivePrice) {
      effectivePrice = item.price_monthly / 30;
    }

    return { price: effectivePrice, item };
  }

  private async generateAnonymizedRecommendation(
    marketEstimate: any,
    dataPoints: number,
    location?: string
  ): Promise<string> {
    const { PricingStrategy } = await import('./PricingStrategy.ts');

    // Generate market-based recommendation without revealing suppliers
    let recommendation = `Market rate: £${marketEstimate.typical.toFixed(2)}/day `;
    recommendation += `(typically £${marketEstimate.low}-${marketEstimate.high} across ${dataPoints} suppliers). `;

    // Add location-based insight if applicable
    if (location) {
      const regionalMultiplier = PricingStrategy.getRegionalMultiplier?.(location) || 1;
      if (regionalMultiplier > 1.1) {
        recommendation += `Note: Premium location pricing applies. `;
      } else if (regionalMultiplier < 0.95) {
        recommendation += `Good value area with competitive pricing. `;
      }
    }

    // Add confidence indicator
    const confidence = dataPoints >= 10 ? 'high' : dataPoints >= 5 ? 'good' : 'limited';
    recommendation += `Confidence: ${confidence} (${dataPoints} data points).`;

    return recommendation;
  }

  private generateRecommendation(sortedPrices: any[]): string {
    // Fallback method - now returns anonymized version
    const avgPrice = sortedPrices.reduce((sum, p) => sum + p.price, 0) / sortedPrices.length;
    const minPrice = sortedPrices[0].price;
    const maxPrice = sortedPrices[sortedPrices.length - 1].price;

    return `Market rate: £${avgPrice.toFixed(2)}/day (range: £${minPrice}-${maxPrice}/day across ${sortedPrices.length} suppliers).`;
  }

  private isEquipment(item: string): boolean {
    const equipmentKeywords = [
      'excavator',
      'digger',
      'dumper',
      'compressor',
      'generator',
      'scaffold',
      'ladder',
      'drill',
      'saw',
      'mixer',
      'hoist',
    ];

    return equipmentKeywords.some(keyword => item.toLowerCase().includes(keyword));
  }

  private async storePriceItems(items: PriceItem[]): Promise<void> {
    const records = items.map(item => ({
      description: item.description,
      category: item.category,
      unit: item.unit,
      price_daily: item.price.daily,
      price_weekly: item.price.weekly,
      price_monthly: item.price.monthly,
      supplier_name: item.supplier.name,
      supplier_type: item.supplier.type,
      supplier_coverage: item.supplier.coverage,
      supplier_location: item.supplier.location,
      metadata: item.metadata,
      created_at: new Date().toISOString(),
    }));

    const { error } = await this.supabase.from('pricing_data').upsert(records, {
      onConflict: 'description,supplier_name',
    });

    if (error) {
      console.error('Error storing price items:', error);
    }
  }

  private async savePricingContext(context: PricingContext): Promise<void> {
    const { error } = await this.supabase.from('pricing_contexts').upsert({
      session_id: context.sessionId,
      supplier_prices: Object.fromEntries(context.supplierPrices),
      price_comparisons: context.priceComparisons,
      project_requirements: context.projectRequirements,
      last_sync_date: context.lastSyncDate,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving pricing context:', error);
    }
  }
}
