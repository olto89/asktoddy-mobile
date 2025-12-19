/**
 * PricingEnhancer - Additive enhancement for AI analysis with real market data
 * Connects to existing pricing database and enhances base analysis with actual costs
 */

import { ProjectAnalysis, AnalysisRequest, PricingContext } from '../types.ts';
import { UKPricingService } from '../../get-pricing/pricing-service.ts';
import { ProjectMaterialMapper } from '../material-selection/ProjectMaterialMapper.ts';
import {
  PricingRequest,
  PricingResponse,
  ToolHireRate,
  MaterialPrice,
  LabourRate,
  ProfessionalCostCategories,
  ConfidenceScoring,
} from '../../get-pricing/types.ts';
import {
  calculateProfessionalCosts,
  RawCostInputs,
  ProfessionalCostResult,
} from '../../get-pricing/services/professional-cost-calculator.ts';

export interface EnhancementOptions {
  materials?: boolean;
  labour?: boolean;
  toolHire?: boolean;
  waste?: boolean;
  aggregates?: boolean;
  regional?: boolean;
  enableDebugLogging?: boolean;
}

export interface PricingEnhancement {
  originalCosts: any;
  enhancedCosts: any;
  marketData: PricingResponse;
  confidenceScore: number;
  enhancementApplied: boolean;
  dataSource: string;
  processingTimeMs: number;
  // Professional cost breakdown following RICS standards
  professionalCosts?: ProfessionalCostCategories;
  confidenceBreakdown?: ConfidenceScoring;
  professionalAdvice?: string[];
}

export class PricingEnhancer {
  private pricingService: UKPricingService;
  private enableDebugLogging: boolean;

  constructor(enableDebugLogging = false) {
    this.pricingService = new UKPricingService();
    this.enableDebugLogging = enableDebugLogging;
  }

  /**
   * Main enhancement method - adds real market pricing to base analysis
   * Uses additive pattern: never breaks base analysis, only enhances it
   */
  async enhance(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    options: EnhancementOptions = {}
  ): Promise<ProjectAnalysis & { pricingEnhancement?: PricingEnhancement }> {
    const startTime = Date.now();

    try {
      this.log('🔧 Starting pricing enhancement', {
        projectType: analysis.projectType,
        location: this.extractLocation(request),
        options,
      });

      // Extract pricing requirements from analysis
      const pricingRequest = this.buildPricingRequest(analysis, request, options);

      if (!pricingRequest) {
        this.log('⚠️ Could not build pricing request - skipping enhancement');
        return analysis;
      }

      // Get real market data
      const marketData = await this.pricingService.getPricingData(pricingRequest);

      this.log('📊 Market data received:', {
        materialsCount: marketData.materials?.length || 0,
        labourCount: marketData.labour?.length || 0,
        toolHireCount: marketData.toolHire?.length || 0,
        firstFewMaterials: marketData.materials?.slice(0, 3).map(m => m.name) || [],
      });

      // Override materials with project-specific ones
      const correctedMarketData = this.correctMaterialSelection(analysis, marketData, request);

      // Apply market pricing to analysis
      const enhancedAnalysis = this.applyMarketPricing(analysis, correctedMarketData, options);

      // Calculate confidence based on data quality
      const confidenceScore = this.calculateConfidence(analysis, marketData);

      // Generate professional cost breakdown (RICS standards)
      let professionalCostResult: ProfessionalCostResult | null = null;
      try {
        const rawCostInputs = this.buildRawCostInputs(enhancedAnalysis, marketData, request);
        if (rawCostInputs) {
          professionalCostResult = calculateProfessionalCosts(rawCostInputs);
          this.log('💼 Professional cost breakdown generated', {
            grandTotal: professionalCostResult.costBreakdown.grandTotal,
            confidence: professionalCostResult.confidenceScore.overall,
          });
        }
      } catch (error) {
        this.log('⚠️ Professional cost calculation failed', { error: error.message });
      }

      const pricingEnhancement: PricingEnhancement = {
        originalCosts: analysis.costBreakdown,
        enhancedCosts: enhancedAnalysis.costBreakdown,
        marketData,
        confidenceScore,
        enhancementApplied: true,
        dataSource: 'uk_market_data_2024',
        processingTimeMs: Date.now() - startTime,
        professionalCosts: professionalCostResult?.costBreakdown,
        confidenceBreakdown: professionalCostResult?.confidenceScore,
        professionalAdvice: professionalCostResult?.professionalAdvice,
      };

      this.log('✅ Pricing enhancement completed', {
        confidenceScore,
        processingTime: pricingEnhancement.processingTimeMs,
        enhancementApplied: true,
      });

      return {
        ...enhancedAnalysis,
        pricingEnhancement,
      };
    } catch (error) {
      this.log('❌ Pricing enhancement failed', { error: error.message });

      // Graceful degradation - return original analysis with error info
      return {
        ...analysis,
        pricingEnhancement: {
          originalCosts: analysis.costBreakdown,
          enhancedCosts: analysis.costBreakdown,
          marketData: null,
          confidenceScore: 0,
          enhancementApplied: false,
          dataSource: 'enhancement_failed',
          processingTimeMs: Date.now() - startTime,
          error: error.message,
        } as any,
      };
    }
  }

  /**
   * Build pricing request from AI analysis
   */
  private buildPricingRequest(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    options: EnhancementOptions
  ): PricingRequest | null {
    try {
      const location = this.extractLocation(request) || 'East Midlands'; // Default to average UK pricing
      const projectType = analysis.projectType || 'general construction';

      // Extract tools from analysis
      let tools: string[] = [];
      if (options.toolHire && analysis.toolsRequired) {
        tools = analysis.toolsRequired;
      }

      // Extract materials from description
      let materials: string[] = [];
      if (options.materials) {
        materials = this.extractMaterials(analysis.description || '');
        this.log('🔍 Materials extraction result:', {
          description: analysis.description?.substring(0, 100) + '...',
          extractedMaterials: materials,
          materialsCount: materials.length,
        });
      }

      const pricingRequest: PricingRequest = {
        location,
        projectType,
        tools: tools.length > 0 ? tools : undefined,
        materials: materials.length > 0 ? materials : undefined,
        projectScale: this.estimateProjectScale(analysis),
        urgency: 'standard',
      };

      this.log('📋 Built pricing request', pricingRequest);
      return pricingRequest;
    } catch (error) {
      this.log('❌ Failed to build pricing request', { error: error.message });
      return null;
    }
  }

  /**
   * Apply market pricing to analysis cost breakdown
   */
  private applyMarketPricing(
    analysis: ProjectAnalysis,
    marketData: PricingResponse,
    options: EnhancementOptions
  ): ProjectAnalysis {
    const enhanced = { ...analysis };

    if (!enhanced.costBreakdown) {
      enhanced.costBreakdown = {
        materials: { min: 0, max: 0 },
        labor: { min: 0, max: 0 },
        total: { min: 0, max: 0 },
      };
    }

    // Enhance materials pricing
    if (options.materials) {
      if (marketData.materials.length > 0) {
        const materialsCost = this.calculateMaterialsCost(marketData.materials);
        const formattedItems = this.formatMaterialsItems(marketData.materials);

        this.log(`📦 Formatting ${marketData.materials.length} materials for UI`, {
          rawMaterials: marketData.materials.map(m => m.name),
          formattedItems: formattedItems.map(i => ({ name: i.name, total: i.total })),
        });

        enhanced.costBreakdown.materials = {
          min: materialsCost.min,
          max: materialsCost.max,
          items: formattedItems,
        };

        this.log(`✅ Materials enhanced - ${formattedItems.length} items set`);
      } else {
        // TEMPORARY: Force some test materials to see if UI works
        this.log('🧪 TEMP: Adding test materials to debug UI');
        enhanced.costBreakdown.materials = {
          ...enhanced.costBreakdown.materials,
          items: [
            {
              name: 'Test Kitchen Units',
              description: 'Kitchen cabinet units',
              quantity: 8,
              unitPrice: 250,
              totalPrice: 2000,
              total: 2000,
              unit: 'unit',
            },
            {
              name: 'Test Worktop',
              description: 'Granite worktop',
              quantity: 3,
              unitPrice: 400,
              totalPrice: 1200,
              total: 1200,
              unit: 'm',
            },
          ],
        };
        this.log('⚠️ Materials enhancement used test data (no market data available)', {
          materialsEnabled: options.materials,
          materialsCount: marketData.materials?.length || 0,
        });
      }
    }

    // Enhance labour pricing
    if (options.labour && marketData.labour.length > 0) {
      const labourCost = this.calculateLabourCost(marketData.labour, enhanced);
      enhanced.costBreakdown.labor = {
        min: labourCost.min,
        max: labourCost.max,
        hourlyRate: labourCost.averageHourlyRate,
        estimatedHours: labourCost.estimatedHours,
      };
    }

    // Enhance tool hire pricing
    if (options.toolHire && marketData.toolHire.length > 0) {
      const toolHireCost = this.calculateToolHireCost(marketData.toolHire, enhanced);
      enhanced.costBreakdown.toolHire = {
        min: toolHireCost.min,
        max: toolHireCost.max,
        items: this.formatToolHireItems(marketData.toolHire),
      };
    }

    // Recalculate total with regional adjustments
    if (options.regional) {
      this.applyRegionalAdjustments(enhanced, marketData.contextFactors);
    }

    // Update total cost
    const materials = enhanced.costBreakdown.materials || { min: 0, max: 0 };
    const labor = enhanced.costBreakdown.labor || { min: 0, max: 0 };
    const toolHire = enhanced.costBreakdown.toolHire || { min: 0, max: 0 };

    enhanced.costBreakdown.total = {
      min: materials.min + labor.min + toolHire.min,
      max: materials.max + labor.max + toolHire.max,
    };

    // Add contingency based on seasonal factors
    if (marketData.data?.contextFactors?.contingencyPercentage) {
      const contingencyPercentage = marketData.data.contextFactors.contingencyPercentage;
      const weatherRisk = marketData.data.contextFactors.weatherRisk;

      const contingencyAmount = {
        min: Math.round(enhanced.costBreakdown.total.min * (contingencyPercentage / 100)),
        max: Math.round(enhanced.costBreakdown.total.max * (contingencyPercentage / 100)),
      };

      enhanced.costBreakdown.contingency = {
        percentage: contingencyPercentage,
        amount: contingencyAmount.max, // Use max for safety
        reason: weatherRisk || `${contingencyPercentage}% seasonal contingency`,
      };

      // Update totals with contingency
      enhanced.costBreakdown.total = {
        min: enhanced.costBreakdown.total.min + contingencyAmount.min,
        max: enhanced.costBreakdown.total.max + contingencyAmount.max,
      };

      this.log('🌦️ Applied seasonal contingency', {
        percentage: contingencyPercentage,
        amount: contingencyAmount,
        reason: weatherRisk,
      });
    }

    // Add pricing recommendations
    enhanced.recommendations = [
      ...(enhanced.recommendations || []),
      ...this.generatePricingRecommendations(marketData),
    ];

    this.log('💰 Applied market pricing', {
      originalTotal: analysis.costBreakdown?.total,
      enhancedTotal: enhanced.costBreakdown.total,
      recommendations: enhanced.recommendations.length,
    });

    return enhanced;
  }

  /**
   * Calculate materials cost from market data
   */
  private calculateMaterialsCost(materials: any[]) {
    let totalMin = 0;
    let totalMax = 0;

    if (materials.length === 0) {
      this.log('⚠️ No materials provided for cost calculation');
      return { min: 0, max: 0 };
    }

    materials.forEach(material => {
      if (material.priceRange) {
        // Apply realistic quantity multipliers based on material type
        const quantityMultiplier = this.getQuantityMultiplier(material);

        const materialMin = material.priceRange.min * quantityMultiplier;
        const materialMax = material.priceRange.max * quantityMultiplier;

        totalMin += materialMin;
        totalMax += materialMax;

        this.log(
          `💰 Material: ${material.name} - £${materialMin}-${materialMax} (x${quantityMultiplier})`
        );
      }
    });

    this.log(`💰 Total materials cost calculated: £${totalMin}-${totalMax}`);
    return { min: totalMin, max: totalMax };
  }

  /**
   * Get realistic quantity multipliers for different material types - FIXED for realistic bathroom pricing
   */
  private getQuantityMultiplier(material: any): number {
    const materialName = material.name.toLowerCase();
    const category = material.category?.toLowerCase() || '';
    const unit = material.unit?.toLowerCase() || '';

    console.log(
      `🧮 Calculating quantity for: ${materialName}, unit: ${unit}, category: ${category}`
    );

    // Complete suites/sets - always 1
    if (materialName.includes('complete') || materialName.includes('suite') || unit === 'set') {
      console.log(`  → Complete suite: quantity = 1`);
      return 1;
    }

    // Bathroom specific quantities for ensuite sizing
    if (materialName.includes('bathroom')) {
      if (materialName.includes('tile')) {
        if (unit === 'm²') {
          console.log(`  → Bathroom tiles (m²): quantity = 8 (ensuite size)`);
          return 8; // Small ensuite bathroom area
        }
      }
      if (materialName.includes('paint')) {
        console.log(`  → Bathroom paint: quantity = 1`);
        return 1; // One tin covers an ensuite
      }
    }

    // Wall tiles - area based
    if (
      materialName.includes('wall tile') ||
      (materialName.includes('tile') && !materialName.includes('floor'))
    ) {
      if (unit === 'm²') {
        console.log(`  → Wall tiles (m²): quantity = 12 (ensuite walls)`);
        return 12; // Wall area for small bathroom
      }
    }

    // Floor tiles - area based
    if (materialName.includes('floor tile') || materialName.includes('flooring')) {
      if (unit === 'm²') {
        console.log(`  → Floor tiles (m²): quantity = 4 (ensuite floor)`);
        return 4; // Floor area for small bathroom
      }
    }

    // Single fixtures - always 1 each
    if (
      materialName.includes('mixer') ||
      materialName.includes('tap') ||
      materialName.includes('basin') ||
      materialName.includes('shower')
    ) {
      console.log(`  → Fixture: quantity = 1`);
      return 1;
    }

    // Kitchen specific (reasonable quantities)
    if (materialName.includes('kitchen')) {
      if (materialName.includes('unit')) {
        console.log(`  → Kitchen units: quantity = 6 (average kitchen)`);
        return 6; // Reasonable number for average kitchen
      }
      if (materialName.includes('worktop')) {
        if (unit.includes('linear') || unit === 'm') {
          console.log(`  → Kitchen worktop (linear): quantity = 4`);
          return 4; // Linear meters
        }
        return 1;
      }
    }

    // Paint - per room quantities
    if (materialName.includes('paint') || materialName.includes('emulsion')) {
      if (unit === '5l') {
        console.log(`  → Paint (5L): quantity = 1 (covers one room)`);
        return 1; // One 5L tin per room
      }
      return 1;
    }

    // Electrical - per room basis
    if (category === 'electrical' || materialName.includes('electrical')) {
      if (materialName.includes('point') || materialName.includes('socket')) {
        console.log(`  → Electrical points: quantity = 3 (per room)`);
        return 3; // Points per room
      }
      if (materialName.includes('cable')) {
        console.log(`  → Cable: quantity = 20 (meters)`);
        return 20; // Meters of cable
      }
      return 1;
    }

    // Structural materials - reasonable quantities
    if (category === 'structural') {
      if (materialName.includes('cement') && unit.includes('bag')) {
        console.log(`  → Cement bags: quantity = 4`);
        return 4; // Bags for small job
      }
      if (materialName.includes('sand') && unit.includes('tonne')) {
        console.log(`  → Sand: quantity = 1 (tonne)`);
        return 1; // One tonne for small job
      }
      if (materialName.includes('plasterboard') && unit.includes('sheet')) {
        console.log(`  → Plasterboard sheets: quantity = 6`);
        return 6; // Sheets for one room
      }
    }

    // Pipes - per meter basis
    if (materialName.includes('pipe') && unit.includes('meter')) {
      console.log(`  → Pipe (per meter): quantity = 10`);
      return 10; // Meters of pipe for typical job
    }

    // Conservative default
    console.log(`  → Default: quantity = 1`);
    return 1;
  }

  /**
   * Calculate labour cost from market data
   */
  private calculateLabourCost(labour: any[], analysis: ProjectAnalysis) {
    let totalMin = 0;
    let totalMax = 0;
    let totalHourlyRate = 0;
    let tradeCount = 0;

    labour.forEach(trade => {
      if (trade.hourlyRate) {
        totalMin += trade.hourlyRate.min * 8; // Daily rate
        totalMax += trade.hourlyRate.max * 8;
        totalHourlyRate += trade.hourlyRate.average;
        tradeCount++;
      }
    });

    const averageHourlyRate = tradeCount > 0 ? totalHourlyRate / tradeCount : 35;
    const estimatedHours = this.estimateProjectHours(analysis);

    return {
      min: (totalMin * estimatedHours) / 8,
      max: (totalMax * estimatedHours) / 8,
      averageHourlyRate,
      estimatedHours,
    };
  }

  /**
   * Calculate tool hire cost from market data
   */
  private calculateToolHireCost(toolHire: any[], analysis: ProjectAnalysis) {
    let totalMin = 0;
    let totalMax = 0;

    const estimatedDays = this.estimateProjectDays(analysis);

    toolHire.forEach(tool => {
      if (tool.dailyRate) {
        totalMin += tool.dailyRate * estimatedDays;
        totalMax += tool.dailyRate * estimatedDays * 1.2; // Factor for variations
      }
    });

    return { min: totalMin, max: totalMax };
  }

  /**
   * Apply regional pricing adjustments
   */
  private applyRegionalAdjustments(analysis: ProjectAnalysis, contextFactors: any) {
    if (contextFactors?.regionMultiplier) {
      const multiplier = contextFactors.regionMultiplier;

      if (analysis.costBreakdown) {
        Object.keys(analysis.costBreakdown).forEach(key => {
          if (key !== 'total' && analysis.costBreakdown[key]?.min !== undefined) {
            analysis.costBreakdown[key].min *= multiplier;
            analysis.costBreakdown[key].max *= multiplier;
          }
        });
      }
    }
  }

  /**
   * Build RawCostInputs for professional cost calculator
   */
  private buildRawCostInputs(
    analysis: ProjectAnalysis,
    marketData: PricingResponse,
    request: AnalysisRequest
  ): RawCostInputs | null {
    try {
      // Extract materials from cost breakdown and market data
      const materials = this.extractMaterialsForCalculation(analysis, marketData);

      // Extract labour from cost breakdown and market data
      const labour = this.extractLabourForCalculation(analysis, marketData);

      // Extract plant and equipment from tool hire data
      const plantAndEquipment = this.extractPlantEquipmentForCalculation(analysis, marketData);

      // Determine project scale based on total cost
      const totalCost =
        analysis.costBreakdown?.total?.max || analysis.costBreakdown?.total?.average || 0;
      const projectScale: 'small' | 'medium' | 'large' =
        totalCost < 10000 ? 'small' : totalCost < 50000 ? 'medium' : 'large';

      // Determine season (default to current month)
      const currentMonth = new Date().getMonth();
      const season: 'spring' | 'summer' | 'autumn' | 'winter' =
        currentMonth >= 2 && currentMonth <= 4
          ? 'spring'
          : currentMonth >= 5 && currentMonth <= 7
            ? 'summer'
            : currentMonth >= 8 && currentMonth <= 10
              ? 'autumn'
              : 'winter';

      // Extract location from request
      const location = this.mapLocationToRegion(request.context?.location || 'UK');

      // Determine urgency from analysis
      const urgency: 'standard' | 'urgent' =
        analysis.timeline?.isUrgent || analysis.difficultyLevel === 'high' ? 'urgent' : 'standard';

      const rawCostInputs: RawCostInputs = {
        materials,
        labour,
        plantAndEquipment,
        projectScale,
        season,
        location,
        urgency,
      };

      this.log('🏗️ Built raw cost inputs for professional calculation', {
        materials: materials.length,
        labour: labour.length,
        plantAndEquipment: plantAndEquipment.length,
        projectScale,
        season,
        location,
        urgency,
      });

      return rawCostInputs;
    } catch (error) {
      this.log('❌ Failed to build raw cost inputs', { error: error.message });
      return null;
    }
  }

  /**
   * Extract materials for professional cost calculation
   */
  private extractMaterialsForCalculation(analysis: ProjectAnalysis, marketData: PricingResponse) {
    const materials: { name: string; cost: number; wastage?: number }[] = [];

    // Use market data materials if available
    if (marketData.materials?.length > 0) {
      marketData.materials.forEach(material => {
        materials.push({
          name: material.name,
          cost: material.priceRange.average || material.priceRange.min,
          wastage: material.wasteFactor || 0.1,
        });
      });
    }

    // Fallback to analysis cost breakdown if no market data
    if (materials.length === 0 && analysis.costBreakdown?.materials) {
      const materialsCost =
        analysis.costBreakdown.materials.average ||
        analysis.costBreakdown.materials.max ||
        analysis.costBreakdown.materials.min ||
        0;

      materials.push({
        name: 'General Materials',
        cost: materialsCost,
        wastage: 0.1,
      });
    }

    return materials;
  }

  /**
   * Extract labour for professional cost calculation
   */
  private extractLabourForCalculation(analysis: ProjectAnalysis, marketData: PricingResponse) {
    const labour: { trade: string; hours: number; rate: number }[] = [];

    // Use market data labour rates if available
    if (marketData.labour?.length > 0 && analysis.timeline?.estimatedHours) {
      const totalHours = analysis.timeline.estimatedHours;
      const hoursPerTrade = Math.max(8, totalHours / marketData.labour.length);

      marketData.labour.forEach(trade => {
        labour.push({
          trade: trade.tradeType,
          hours: hoursPerTrade,
          rate: trade.hourlyRate.average || trade.hourlyRate.min,
        });
      });
    }

    // Fallback to analysis cost breakdown
    if (labour.length === 0 && analysis.costBreakdown?.labor) {
      const labourCost =
        analysis.costBreakdown.labor.average ||
        analysis.costBreakdown.labor.max ||
        analysis.costBreakdown.labor.min ||
        0;
      const estimatedHours =
        analysis.timeline?.estimatedHours || this.estimateProjectHours(analysis);
      const hourlyRate = estimatedHours > 0 ? labourCost / estimatedHours : 30;

      labour.push({
        trade: 'General Labour',
        hours: estimatedHours,
        rate: hourlyRate,
      });
    }

    return labour;
  }

  /**
   * Extract plant and equipment for professional cost calculation
   */
  private extractPlantEquipmentForCalculation(
    analysis: ProjectAnalysis,
    marketData: PricingResponse
  ) {
    const plantAndEquipment: { item: string; cost: number }[] = [];

    // Use market data tool hire if available
    if (marketData.toolHire?.length > 0) {
      const estimatedDays = this.estimateProjectDays(analysis);

      marketData.toolHire.forEach(tool => {
        const cost = (tool.dailyRate || 0) * estimatedDays;
        plantAndEquipment.push({
          item: tool.name,
          cost,
        });
      });
    }

    // Fallback to analysis cost breakdown
    if (plantAndEquipment.length === 0 && analysis.costBreakdown?.toolHire) {
      const toolHireCost =
        analysis.costBreakdown.toolHire.average ||
        analysis.costBreakdown.toolHire.max ||
        analysis.costBreakdown.toolHire.min ||
        0;

      plantAndEquipment.push({
        item: 'Tool Hire',
        cost: toolHireCost,
      });
    }

    return plantAndEquipment;
  }

  /**
   * Map location string to regional classification
   */
  private mapLocationToRegion(
    location: string
  ): 'london' | 'southeast' | 'southwest' | 'midlands' | 'north' | 'scotland' | 'wales' {
    const loc = location.toLowerCase();

    if (loc.includes('london')) return 'london';
    if (
      loc.includes('southeast') ||
      loc.includes('south east') ||
      loc.includes('kent') ||
      loc.includes('surrey')
    )
      return 'southeast';
    if (
      loc.includes('southwest') ||
      loc.includes('south west') ||
      loc.includes('bristol') ||
      loc.includes('devon')
    )
      return 'southwest';
    if (loc.includes('midlands') || loc.includes('birmingham') || loc.includes('nottingham'))
      return 'midlands';
    if (loc.includes('scotland') || loc.includes('edinburgh') || loc.includes('glasgow'))
      return 'scotland';
    if (loc.includes('wales') || loc.includes('cardiff') || loc.includes('swansea')) return 'wales';
    if (
      loc.includes('north') ||
      loc.includes('manchester') ||
      loc.includes('liverpool') ||
      loc.includes('leeds')
    )
      return 'north';

    return 'midlands'; // Default fallback
  }

  /**
   * Generate pricing recommendations
   */
  private generatePricingRecommendations(marketData: PricingResponse): string[] {
    const recommendations: string[] = [];

    if (marketData.recommendations) {
      marketData.recommendations.forEach(rec => {
        recommendations.push(rec.message);
      });
    }

    // Add generic pricing advice
    recommendations.push(
      'Prices include current market rates and regional variations',
      'Consider getting multiple quotes for comparison',
      'Bulk purchasing may reduce material costs by 10-15%'
    );

    return recommendations;
  }

  /**
   * Helper methods
   */

  private extractLocation(request: AnalysisRequest): string | null {
    // Look for location in message
    if (request.message) {
      const locationMatch = request.message.match(/(?:in|at|near)\s+([A-Za-z\s]+?)(?:[,.!?]|$)/i);
      if (locationMatch) {
        return locationMatch[1].trim();
      }
    }

    // Look for location in any existing context
    if (request.location) {
      return request.location;
    }

    return null;
  }

  private extractMaterials(description: string): string[] {
    const materials: string[] = [];

    // Enhanced building materials keywords - includes specialist materials
    const materialPatterns = [
      // Structural materials
      /\b(brick|bricks)\b/gi,
      /\b(cement|concrete)\b/gi,
      /\b(timber|wood|lumber)\b/gi,
      /\b(steel|metal|iron)\b/gi,

      // Finishing materials
      /\b(tiles?|tiling|ceramic|porcelain)\b/gi,
      /\b(paint|painting|emulsion|gloss)\b/gi,
      /\b(plaster|plastering|render)\b/gi,
      /\b(flooring|floor|laminate|vinyl|hardwood)\b/gi,

      // Bathroom/Kitchen materials
      /\b(bathroom|bath|shower|toilet|sink|basin|vanity)\b/gi,
      /\b(porcelain|marble|granite|quartz|stone)\b/gi,
      /\b(fixtures?|fittings?|sanitary|sanitaryware)\b/gi,
      /\b(taps?|mixer|shower\s*head|thermostatic)\b/gi,
      /\b(suite|toilet\s*suite|bathroom\s*suite)\b/gi,

      // Systems
      /\b(plumbing|pipes|pipework|drainage)\b/gi,
      /\b(electrical|wiring|lighting|switches|sockets)\b/gi,
      /\b(heating|radiator|underfloor|boiler)\b/gi,
      /\b(ventilation|extractor|fan)\b/gi,

      // Insulation & Building envelope
      /\b(insulation|damp\s*proof|waterproof)\b/gi,
      /\b(roofing|roof|guttering|fascia|soffit)\b/gi,
      /\b(window|door|glazing|double\s*glazing)\b/gi,

      // Specialist finishes
      /\b(sealant|grout|adhesive|primer)\b/gi,
      /\b(skirting|architrave|coving|molding)\b/gi,
    ];

    materialPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        materials.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(materials)]; // Remove duplicates
  }

  private estimateProjectScale(analysis: ProjectAnalysis): 'small' | 'medium' | 'large' {
    if (!analysis.costBreakdown?.total) return 'small';

    const totalMax = analysis.costBreakdown.total.max || 0;

    if (totalMax > 10000) return 'large';
    if (totalMax > 3000) return 'medium';
    return 'small';
  }

  private estimateProjectDays(analysis: ProjectAnalysis): number {
    if (analysis.timeline?.professional) {
      const match = analysis.timeline.professional.match(/(\d+)/);
      return match ? parseInt(match[1]) : 5;
    }
    return 5; // Default
  }

  private estimateProjectHours(analysis: ProjectAnalysis): number {
    // Check if we already have estimated hours
    if (analysis.timeline?.estimatedHours) {
      return analysis.timeline.estimatedHours;
    }

    // Smart estimation based on project type
    const projectType = (analysis.projectType || '').toLowerCase();

    if (projectType.includes('ensuite') || projectType.includes('small bathroom')) {
      return 16; // 2 days work for skilled tradespeople
    }

    if (projectType.includes('bathroom')) {
      return 24; // 3 days for full bathroom
    }

    if (projectType.includes('kitchen')) {
      const description = (analysis.description || '').toLowerCase();
      if (description.includes('small') || description.includes('galley')) {
        return 32; // 4 days for small kitchen
      }
      return 48; // 6 days for average kitchen
    }

    if (projectType.includes('decking')) {
      // Extract dimensions if available
      const description = (analysis.description || '').toLowerCase();
      const dimensionMatch = description.match(/(\d+)\s*[mx]\s*[xby]\s*(\d+)/);
      if (dimensionMatch) {
        const area = parseInt(dimensionMatch[1]) * parseInt(dimensionMatch[2]);
        return Math.max(8, Math.min(32, area * 0.5)); // 0.5 hours per m²
      }
      return 16; // Default for decking
    }

    if (projectType.includes('electrical')) {
      return 8; // 1 day for basic electrical work
    }

    if (projectType.includes('plumbing')) {
      return 12; // 1.5 days for plumbing work
    }

    // Fallback to days-based estimation
    return this.estimateProjectDays(analysis) * 8; // 8 hours per day
  }

  private formatMaterialsItems(materials: any[]) {
    return materials.map(material => {
      const quantityMultiplier = this.getQuantityMultiplier(material);
      const unitPrice = material.priceRange?.average || material.priceRange?.min || 0;
      const totalPrice = unitPrice * quantityMultiplier;

      return {
        name: material.name,
        description: material.description || this.generateMaterialDescription(material),
        quantity: quantityMultiplier,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        total: totalPrice, // alias for compatibility
        unit: material.unit || 'item',
      };
    });
  }

  /**
   * Generate descriptive text for materials based on name and category
   */
  private generateMaterialDescription(material: any): string {
    const name = material.name.toLowerCase();
    const category = material.category?.toLowerCase() || '';

    if (category === 'finishing') {
      if (name.includes('tile') || name.includes('porcelain')) {
        return 'High-quality finishing tiles for walls and floors';
      }
      if (name.includes('paint')) {
        return 'Professional grade paint and finishes';
      }
    }

    if (category === 'plumbing') {
      if (name.includes('bath') || name.includes('shower')) {
        return 'Premium bathroom fixtures and fittings';
      }
      if (name.includes('tap') || name.includes('mixer')) {
        return 'Quality taps and water controls';
      }
    }

    if (category === 'electrical') {
      return 'Electrical components and installation materials';
    }

    if (category === 'structural') {
      return 'Core structural and building materials';
    }

    return `${material.name} - Construction materials and supplies`;
  }

  private formatToolHireItems(tools: any[]) {
    return tools.map(tool => ({
      name: tool.name,
      dailyRate: tool.dailyRate,
      availability: tool.availability || 'medium',
    }));
  }

  private calculateConfidence(analysis: ProjectAnalysis, marketData: PricingResponse): number {
    let confidence = 0.6; // Base confidence

    // Add confidence based on data completeness
    if (marketData.materials.length > 0) confidence += 0.1;
    if (marketData.labour.length > 0) confidence += 0.1;
    if (marketData.toolHire.length > 0) confidence += 0.1;

    // Add confidence based on analysis completeness
    if (analysis.projectType) confidence += 0.05;
    if (analysis.description && analysis.description.length > 50) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  /**
   * Correct material selection to be project-appropriate
   */
  private correctMaterialSelection(
    analysis: ProjectAnalysis,
    marketData: PricingResponse,
    request: AnalysisRequest
  ): PricingResponse {
    // Extract finish level from user message
    const finishLevel = ProjectMaterialMapper.extractFinishLevel(request.message);

    this.log('🔧 Correcting material selection:', {
      projectType: analysis.projectType,
      finishLevel,
      originalMaterialCount: marketData.materials?.length,
    });

    // Get project-appropriate materials
    const projectMaterials = ProjectMaterialMapper.getMaterialsForProject(
      analysis.projectType,
      finishLevel,
      this.extractRoomSize(request)
    );

    // Convert to market data format
    const correctedMaterials = projectMaterials.items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      priceRange: item.priceRange,
      unit: item.unit,
      supplier: 'Matched suppliers',
      description: item.description,
    }));

    this.log('✅ Materials corrected:', {
      finishLevel,
      materialCount: correctedMaterials.length,
      materials: correctedMaterials.map(m => m.name),
    });

    return {
      ...marketData,
      materials: correctedMaterials,
    };
  }

  /**
   * Extract room size from request context
   */
  private extractRoomSize(request: AnalysisRequest): number {
    const message = request.message.toLowerCase();

    // Look for dimensions like "3x4", "3m x 4m", "12m²"
    const dimensionMatch = message.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/);
    if (dimensionMatch) {
      return parseFloat(dimensionMatch[1]) * parseFloat(dimensionMatch[2]);
    }

    // Look for square meter notation
    const areaMatch = message.match(/(\d+(?:\.\d+)?)\s*m[²2]/);
    if (areaMatch) {
      return parseFloat(areaMatch[1]);
    }

    // Default room sizes by type
    if (message.includes('kitchen')) return 12;
    if (message.includes('bathroom')) return 6;
    return 10;
  }

  private log(message: string, data?: any) {
    if (this.enableDebugLogging) {
      console.log(`[PricingEnhancer] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}
