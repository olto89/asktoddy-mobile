/**
 * ONS-Enhanced UK Construction Pricing Service
 * Integrates official UK government construction price indices with market data
 */

import {
  PricingRequest,
  PricingResponse,
  PricingRecommendation,
  ToolHireRate,
  MaterialPrice,
  AggregateRate,
  LabourRate,
} from './types.ts';

import {
  UK_REGIONS,
  SEASONAL_FACTORS,
  CONTINGENCY_FACTORS,
  TOOL_HIRE_RATES,
  MATERIAL_PRICES,
  AGGREGATE_RATES,
  LABOUR_RATES,
  UK_VAT_RATE,
} from './data/uk-pricing-data.ts';

import { onsService } from '../_shared/ons-service.ts';

export class ONSEnhancedPricingService {
  constructor(supabaseClient?: any) {
    // Use the singleton ONS service
  }

  /**
   * Get comprehensive pricing data enhanced with ONS construction price indices
   */
  async getPricingData(request: PricingRequest): Promise<PricingResponse> {
    console.log('🔍 Processing ONS-enhanced pricing request:', request);

    // Get ONS pricing adjustments for materials used in this project
    const materialCategories = this.extractMaterialCategories(request);
    const onsPricingAdjustments = await onsService.getPricingAdjustments(materialCategories);

    console.log(
      `📊 ONS adjustments for ${materialCategories.length} categories:`,
      onsPricingAdjustments.map(adj => `${adj.category}: ${adj.adjustmentFactor}x`)
    );

    // Determine regional context
    const region = this.identifyRegion(request.location);
    const seasonalFactor = this.getSeasonalFactor();
    const contingency = this.getContingencyFactor();
    const demandIndex = this.calculateDemandIndex(request.projectType, region);

    // Calculate average ONS adjustment factor
    const avgOnsAdjustment =
      onsPricingAdjustments.length > 0
        ? onsPricingAdjustments.reduce((sum, adj) => sum + adj.adjustmentFactor, 0) /
          onsPricingAdjustments.length
        : 1.0;

    // Enhanced regional multiplier incorporating ONS data
    const enhancedRegionMultiplier = region.multiplier * avgOnsAdjustment;

    // Filter and adjust pricing based on request with ONS enhancement
    const toolHire = this.getToolHirePricing(request, enhancedRegionMultiplier, seasonalFactor);
    const materials = this.getMaterialPricing(
      request,
      enhancedRegionMultiplier,
      seasonalFactor,
      onsPricingAdjustments
    );
    const aggregates = this.getAggregatePricing(
      request,
      enhancedRegionMultiplier,
      onsPricingAdjustments
    );
    const labour = this.getLabourPricing(
      request,
      enhancedRegionMultiplier,
      demandIndex,
      onsPricingAdjustments
    );

    // Enhanced recommendations including ONS insights
    const recommendations = this.generateONSEnhancedRecommendations(request, {
      region,
      seasonalFactor,
      contingency,
      demandIndex,
      toolHire,
      materials,
      labour,
      onsPricingAdjustments,
      avgOnsAdjustment,
    });

    // Calculate confidence score based on data quality
    const dataConfidence = this.calculateDataConfidence(onsPricingAdjustments);

    const response: PricingResponse = {
      toolHire,
      materials,
      aggregates,
      labour,
      contextFactors: {
        regionMultiplier: enhancedRegionMultiplier,
        seasonalMultiplier: seasonalFactor,
        demandIndex,
        vatRate: UK_VAT_RATE,
        contingencyPercentage: contingency.percentage,
        weatherRisk: contingency.weatherRisk,
        // Enhanced with ONS data
        onsAdjustmentFactor: avgOnsAdjustment,
        onsDataConfidence: dataConfidence,
        onsLastUpdate: new Date().toISOString(),
        marketTrend: this.getMarketTrend(onsPricingAdjustments),
      },
      recommendations,
      lastUpdated: new Date().toISOString(),
      dataSource: 'ons_enhanced',
    };

    console.log('✅ ONS-enhanced pricing data compiled successfully');
    return response;
  }

  /**
   * Get material pricing enhanced with ONS construction price trends
   */
  private getMaterialPricing(
    request: PricingRequest,
    regionMultiplier: number,
    seasonalFactor: number,
    onsPricingAdjustments: any[]
  ): MaterialPrice[] {
    let relevantMaterials = [...MATERIAL_PRICES];

    // Filter materials based on project type (same as base service)
    const projectTypeLower = request.projectType.toLowerCase();
    if (projectTypeLower.includes('electrical')) {
      relevantMaterials = MATERIAL_PRICES.filter(
        m => m.category === 'electrical' || m.category === 'structural'
      );
    } else if (projectTypeLower.includes('plumbing') || projectTypeLower.includes('bathroom')) {
      relevantMaterials = MATERIAL_PRICES.filter(
        m => m.category === 'plumbing' || m.category === 'structural' || m.category === 'finishing'
      );
    } else if (projectTypeLower.includes('kitchen')) {
      relevantMaterials = MATERIAL_PRICES.filter(
        m => m.category === 'finishing' || m.category === 'electrical' || m.category === 'plumbing'
      );
    }

    // Get material-specific ONS adjustment
    const materialAdjustment = onsPricingAdjustments.find(adj =>
      ['structural', 'finishing', 'roofing'].includes(adj.category)
    ) || { adjustmentFactor: 1.0, confidence: 50 };

    // Apply enhanced pricing factors including ONS data
    return relevantMaterials.map(material => ({
      ...material,
      priceRange: {
        min: this.applyEnhancedPricingFactors(
          material.priceRange.min,
          regionMultiplier,
          seasonalFactor,
          materialAdjustment.adjustmentFactor
        ),
        max: this.applyEnhancedPricingFactors(
          material.priceRange.max,
          regionMultiplier,
          seasonalFactor,
          materialAdjustment.adjustmentFactor
        ),
        average: this.applyEnhancedPricingFactors(
          material.priceRange.average,
          regionMultiplier,
          seasonalFactor,
          materialAdjustment.adjustmentFactor
        ),
      },
      // Add ONS metadata
      onsEnhanced: true,
      onsInflationAdjustment: materialAdjustment.adjustmentFactor,
      onsConfidence: materialAdjustment.confidence,
    }));
  }

  /**
   * Get aggregate pricing enhanced with ONS data
   */
  private getAggregatePricing(
    request: PricingRequest,
    regionMultiplier: number,
    onsPricingAdjustments: any[]
  ): AggregateRate[] {
    const projectTypeLower = request.projectType.toLowerCase();

    // Filter aggregates based on project type (same as base service)
    let relevantAggregates = [...AGGREGATE_RATES];
    if (projectTypeLower.includes('foundation') || projectTypeLower.includes('concrete')) {
      relevantAggregates = AGGREGATE_RATES.filter(a => a.type === 'concrete' || a.type === 'sand');
    } else if (projectTypeLower.includes('driveway') || projectTypeLower.includes('path')) {
      relevantAggregates = AGGREGATE_RATES.filter(a => a.type === 'stone' || a.type === 'gravel');
    } else if (projectTypeLower.includes('garden') || projectTypeLower.includes('landscaping')) {
      relevantAggregates = AGGREGATE_RATES.filter(a => a.type === 'soil' || a.type === 'sand');
    }

    // Get aggregate-specific ONS adjustment (aggregates typically less volatile)
    const aggregateAdjustment = onsPricingAdjustments.find(
      adj => adj.category === 'aggregates'
    ) || { adjustmentFactor: 1.0, confidence: 50 };

    // Apply pricing with ONS enhancement
    return relevantAggregates.map(aggregate => ({
      ...aggregate,
      pricePerTonne: aggregate.pricePerTonne
        ? this.applyEnhancedPricingFactors(
            aggregate.pricePerTonne,
            regionMultiplier,
            1.0,
            aggregateAdjustment.adjustmentFactor
          )
        : undefined,
      pricePerCubicMetre: aggregate.pricePerCubicMetre
        ? this.applyEnhancedPricingFactors(
            aggregate.pricePerCubicMetre,
            regionMultiplier,
            1.0,
            aggregateAdjustment.adjustmentFactor
          )
        : undefined,
      // Add ONS metadata
      onsEnhanced: true,
      onsInflationAdjustment: aggregateAdjustment.adjustmentFactor,
      onsConfidence: aggregateAdjustment.confidence,
    }));
  }

  /**
   * Get labour pricing enhanced with ONS data
   */
  private getLabourPricing(
    request: PricingRequest,
    regionMultiplier: number,
    demandIndex: number,
    onsPricingAdjustments: any[]
  ): LabourRate[] {
    const projectTypeLower = request.projectType.toLowerCase();

    // Filter labour based on project type (same as base service)
    let relevantLabour = [...LABOUR_RATES];
    if (projectTypeLower.includes('electrical')) {
      relevantLabour = LABOUR_RATES.filter(
        l =>
          l.tradeType.toLowerCase().includes('electrician') ||
          l.tradeType.toLowerCase().includes('general')
      );
    } else if (projectTypeLower.includes('plumbing')) {
      relevantLabour = LABOUR_RATES.filter(
        l =>
          l.tradeType.toLowerCase().includes('plumber') ||
          l.tradeType.toLowerCase().includes('general')
      );
    } else if (projectTypeLower.includes('roof')) {
      relevantLabour = LABOUR_RATES.filter(
        l =>
          l.tradeType.toLowerCase().includes('roofer') ||
          l.tradeType.toLowerCase().includes('general')
      );
    }

    // Get general ONS adjustment for labor (typically follows general inflation)
    const laborAdjustment = onsPricingAdjustments.find(adj => adj.category === 'structural') || {
      adjustmentFactor: 1.0,
      confidence: 50,
    };

    // Apply regional, demand, and ONS pricing
    return relevantLabour.map(labour => ({
      ...labour,
      hourlyRate: {
        min: this.applyEnhancedPricingFactors(
          labour.hourlyRate.min,
          regionMultiplier,
          demandIndex,
          laborAdjustment.adjustmentFactor
        ),
        max: this.applyEnhancedPricingFactors(
          labour.hourlyRate.max,
          regionMultiplier,
          demandIndex,
          laborAdjustment.adjustmentFactor
        ),
        average: this.applyEnhancedPricingFactors(
          labour.hourlyRate.average,
          regionMultiplier,
          demandIndex,
          laborAdjustment.adjustmentFactor
        ),
      },
      dailyRate: {
        min: this.applyEnhancedPricingFactors(
          labour.dailyRate.min,
          regionMultiplier,
          demandIndex,
          laborAdjustment.adjustmentFactor
        ),
        max: this.applyEnhancedPricingFactors(
          labour.dailyRate.max,
          regionMultiplier,
          demandIndex,
          laborAdjustment.adjustmentFactor
        ),
        average: this.applyEnhancedPricingFactors(
          labour.dailyRate.average,
          regionMultiplier,
          demandIndex,
          laborAdjustment.adjustmentFactor
        ),
      },
      // Add ONS metadata
      onsEnhanced: true,
      onsInflationAdjustment: laborAdjustment.adjustmentFactor,
      onsConfidence: laborAdjustment.confidence,
    }));
  }

  /**
   * Apply enhanced pricing factors including ONS data
   */
  private applyEnhancedPricingFactors(
    basePrice: number,
    regionMultiplier: number,
    seasonalFactor: number,
    onsFactors: number
  ): number {
    return Math.round(basePrice * regionMultiplier * seasonalFactor * onsFactors * 100) / 100;
  }

  /**
   * Generate ONS-enhanced recommendations
   */
  private generateONSEnhancedRecommendations(
    request: PricingRequest,
    context: any
  ): PricingRecommendation[] {
    const recommendations: PricingRecommendation[] = [];
    const onsPricingAdjustments: any[] = context.onsPricingAdjustments;

    // ONS-specific recommendations based on adjustments
    const highAdjustmentCategories = onsPricingAdjustments.filter(
      adj => adj.adjustmentFactor > 1.05
    );
    if (highAdjustmentCategories.length > 0) {
      recommendations.push({
        type: 'timing',
        message: `Construction costs are rising for ${highAdjustmentCategories.map(adj => adj.category).join(', ')}. Consider locking in quotes quickly.`,
        priority: 'high',
        potentialSaving: Math.round((highAdjustmentCategories[0].adjustmentFactor - 1) * 1000),
      });
    }

    // Market trend recommendations
    const risingCategories = onsPricingAdjustments.filter(adj => adj.trend === 'rising');
    if (risingCategories.length > 0) {
      recommendations.push({
        type: 'cost_saving',
        message:
          'Official data shows rising construction costs. Lock in quotes quickly and consider bulk purchasing',
        priority: 'high',
        potentialSaving: 500,
      });
    }

    // Data quality recommendations
    const lowConfidenceCategories = onsPricingAdjustments.filter(adj => adj.confidence < 70);
    if (lowConfidenceCategories.length > 0) {
      recommendations.push({
        type: 'quality',
        message:
          'Some pricing based on estimated data. Actual costs may vary from official figures',
        priority: 'low',
      });
    }

    // Add standard recommendations from base service
    const baseRecommendations = this.generateBaseRecommendations(request, context);
    recommendations.push(...baseRecommendations);

    return recommendations;
  }

  /**
   * Generate base recommendations (from original service)
   */
  private generateBaseRecommendations(
    request: PricingRequest,
    context: any
  ): PricingRecommendation[] {
    const recommendations: PricingRecommendation[] = [];

    // Seasonal recommendations with contingency advice
    const contingency = context.contingency;
    if (contingency && contingency.percentage >= 15) {
      recommendations.push({
        type: 'timing',
        message: `Consider waiting - ${contingency.percentage}% winter contingency applied. ${contingency.weatherRisk}`,
        priority: 'medium',
        potentialSaving: Math.round((contingency.percentage - 8) * 50),
      });
    }

    // Labour availability recommendations
    if (context.region.labourAvailability === 'low') {
      recommendations.push({
        type: 'timing',
        message: 'Labour availability is limited in this region. Book tradespeople well in advance',
        priority: 'high',
      });
    }

    // VAT recommendations
    recommendations.push({
      type: 'cost_saving',
      message: 'All prices include 20% VAT. Some services may qualify for reduced VAT rates',
      priority: 'low',
    });

    return recommendations;
  }

  // Base service methods (copied from original service)
  private identifyRegion(location: string) {
    const locationLower = location.toLowerCase();

    for (const region of UK_REGIONS) {
      for (const city of region.majorCities) {
        if (locationLower.includes(city.toLowerCase())) {
          console.log(`📍 Location "${location}" identified as ${region.name}`);
          return region;
        }
      }
    }

    for (const region of UK_REGIONS) {
      if (locationLower.includes(region.name.toLowerCase())) {
        return region;
      }
    }

    console.log(`📍 Location "${location}" using default region (East Midlands)`);
    return UK_REGIONS.find(r => r.name === 'East Midlands')!;
  }

  private getSeasonalFactor(): number {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return SEASONAL_FACTORS.spring;
    if (month >= 6 && month <= 8) return SEASONAL_FACTORS.summer;
    if (month >= 9 && month <= 11) return SEASONAL_FACTORS.autumn;
    return SEASONAL_FACTORS.winter;
  }

  private getContingencyFactor() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return CONTINGENCY_FACTORS.spring;
    if (month >= 6 && month <= 8) return CONTINGENCY_FACTORS.summer;
    if (month >= 9 && month <= 11) return CONTINGENCY_FACTORS.autumn;
    return CONTINGENCY_FACTORS.winter;
  }

  private calculateDemandIndex(projectType: string, region: any): number {
    let baseIndex = 0.85;
    const highDemandProjects = ['extension', 'loft', 'kitchen', 'bathroom', 'renovation'];
    if (highDemandProjects.some(type => projectType.toLowerCase().includes(type))) {
      baseIndex += 0.15;
    }
    if (region.labourAvailability === 'low') {
      baseIndex += 0.1;
    } else if (region.labourAvailability === 'high') {
      baseIndex -= 0.05;
    }
    return Math.min(1.0, Math.max(0.6, baseIndex));
  }

  private getToolHirePricing(
    request: PricingRequest,
    regionMultiplier: number,
    seasonalFactor: number
  ): ToolHireRate[] {
    let relevantTools = [...TOOL_HIRE_RATES];

    if (request.tools && request.tools.length > 0) {
      relevantTools = TOOL_HIRE_RATES.filter(tool =>
        request.tools!.some(
          requestedTool =>
            tool.name.toLowerCase().includes(requestedTool.toLowerCase()) ||
            requestedTool.toLowerCase().includes(tool.name.toLowerCase())
        )
      );
    }

    return relevantTools.map(tool => ({
      ...tool,
      dailyRate: this.applyPricingFactors(tool.dailyRate, regionMultiplier, seasonalFactor),
      weeklyRate: this.applyPricingFactors(tool.weeklyRate, regionMultiplier, seasonalFactor),
      monthlyRate: tool.monthlyRate
        ? this.applyPricingFactors(tool.monthlyRate, regionMultiplier, seasonalFactor)
        : undefined,
    }));
  }

  private applyPricingFactors(
    basePrice: number,
    regionMultiplier: number,
    seasonalFactor: number
  ): number {
    return Math.round(basePrice * regionMultiplier * seasonalFactor * 100) / 100;
  }

  /**
   * Extract material categories from project request
   */
  private extractMaterialCategories(request: PricingRequest): string[] {
    const projectTypeLower = request.projectType.toLowerCase();
    const categories = ['structural']; // Always include structural

    if (projectTypeLower.includes('kitchen')) {
      categories.push('finishing', 'electrical', 'plumbing');
    } else if (projectTypeLower.includes('bathroom')) {
      categories.push('finishing', 'plumbing', 'electrical');
    } else if (projectTypeLower.includes('electrical')) {
      categories.push('electrical');
    } else if (projectTypeLower.includes('plumbing')) {
      categories.push('plumbing');
    } else if (projectTypeLower.includes('roof')) {
      categories.push('roofing');
    } else if (projectTypeLower.includes('extension') || projectTypeLower.includes('build')) {
      categories.push('aggregates', 'roofing', 'finishing');
    } else {
      // Default for general construction
      categories.push('finishing', 'aggregates');
    }

    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Calculate data confidence based on ONS adjustments
   */
  private calculateDataConfidence(adjustments: any[]): number {
    if (adjustments.length === 0) return 50;

    const avgConfidence =
      adjustments.reduce((sum, adj) => sum + adj.confidence, 0) / adjustments.length;
    return Math.round(avgConfidence);
  }

  /**
   * Get market trend from ONS adjustments
   */
  private getMarketTrend(adjustments: any[]): string {
    if (adjustments.length === 0) return 'stable';

    const trends = adjustments.map(adj => adj.trend);
    const risingCount = trends.filter(t => t === 'rising').length;
    const fallingCount = trends.filter(t => t === 'falling').length;

    if (risingCount > fallingCount) return 'rising';
    if (fallingCount > risingCount) return 'falling';
    return 'stable';
  }
}
