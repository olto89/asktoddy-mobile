/**
 * UK Construction Pricing Service
 * Provides intelligent pricing based on location, project type, and market conditions
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
  TOOL_HIRE_RATES,
  MATERIAL_PRICES,
  AGGREGATE_RATES,
  LABOUR_RATES,
  UK_VAT_RATE,
} from './data/uk-pricing-data.ts';

export class UKPricingService {
  /**
   * Get comprehensive pricing data for a construction project
   */
  async getPricingData(request: PricingRequest): Promise<PricingResponse> {
    console.log('🔍 Processing pricing request:', request);

    // Determine regional context
    const region = this.identifyRegion(request.location);
    const seasonalFactor = this.getSeasonalFactor();
    const demandIndex = this.calculateDemandIndex(request.projectType, region);

    // Filter and adjust pricing based on request
    const toolHire = this.getToolHirePricing(request, region.multiplier, seasonalFactor);
    const materials = this.getMaterialPricing(request, region.multiplier, seasonalFactor);
    const aggregates = this.getAggregatePricing(request, region.multiplier);
    const labour = this.getLabourPricing(request, region.multiplier, demandIndex);

    // Generate intelligent recommendations
    const recommendations = this.generateRecommendations(request, {
      region,
      seasonalFactor,
      demandIndex,
      toolHire,
      materials,
      labour,
    });

    const response: PricingResponse = {
      toolHire,
      materials,
      aggregates,
      labour,
      contextFactors: {
        regionMultiplier: region.multiplier,
        seasonalMultiplier: seasonalFactor,
        demandIndex,
        vatRate: UK_VAT_RATE,
      },
      recommendations,
      lastUpdated: new Date().toISOString(),
      dataSource: 'average_market_data',
    };

    console.log('✅ Pricing data compiled successfully');
    return response;
  }

  /**
   * Identify UK region from location string
   */
  private identifyRegion(location: string) {
    const locationLower = location.toLowerCase();

    // Find matching region by city names
    for (const region of UK_REGIONS) {
      for (const city of region.majorCities) {
        if (locationLower.includes(city.toLowerCase())) {
          console.log(`📍 Location "${location}" identified as ${region.name}`);
          return region;
        }
      }
    }

    // Fallback to region name matching
    for (const region of UK_REGIONS) {
      if (locationLower.includes(region.name.toLowerCase())) {
        return region;
      }
    }

    // Default to East Midlands (average pricing)
    console.log(`📍 Location "${location}" using default region (East Midlands)`);
    return UK_REGIONS.find(r => r.name === 'East Midlands')!;
  }

  /**
   * Get current seasonal pricing factor
   */
  private getSeasonalFactor(): number {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) return SEASONAL_FACTORS.spring;
    if (month >= 6 && month <= 8) return SEASONAL_FACTORS.summer;
    if (month >= 9 && month <= 11) return SEASONAL_FACTORS.autumn;
    return SEASONAL_FACTORS.winter;
  }

  /**
   * Calculate demand index based on project type and region
   */
  private calculateDemandIndex(projectType: string, region: any): number {
    let baseIndex = 0.85; // Base demand

    // High-demand project types
    const highDemandProjects = ['extension', 'loft', 'kitchen', 'bathroom', 'renovation'];
    if (highDemandProjects.some(type => projectType.toLowerCase().includes(type))) {
      baseIndex += 0.15;
    }

    // Regional demand adjustments
    if (region.labourAvailability === 'low') {
      baseIndex += 0.1;
    } else if (region.labourAvailability === 'high') {
      baseIndex -= 0.05;
    }

    return Math.min(1.0, Math.max(0.6, baseIndex));
  }

  /**
   * Get tool hire pricing with regional and seasonal adjustments
   */
  private getToolHirePricing(
    request: PricingRequest,
    regionMultiplier: number,
    seasonalFactor: number
  ): ToolHireRate[] {
    let relevantTools = [...TOOL_HIRE_RATES];

    // Filter tools based on project type if specified
    if (request.tools && request.tools.length > 0) {
      relevantTools = TOOL_HIRE_RATES.filter(tool =>
        request.tools!.some(
          requestedTool =>
            tool.name.toLowerCase().includes(requestedTool.toLowerCase()) ||
            requestedTool.toLowerCase().includes(tool.name.toLowerCase())
        )
      );
    }

    // Apply regional and seasonal pricing
    return relevantTools.map(tool => ({
      ...tool,
      dailyRate: this.applyPricingFactors(tool.dailyRate, regionMultiplier, seasonalFactor),
      weeklyRate: this.applyPricingFactors(tool.weeklyRate, regionMultiplier, seasonalFactor),
      monthlyRate: tool.monthlyRate
        ? this.applyPricingFactors(tool.monthlyRate, regionMultiplier, seasonalFactor)
        : undefined,
    }));
  }

  /**
   * Get material pricing with regional and seasonal adjustments
   */
  private getMaterialPricing(
    request: PricingRequest,
    regionMultiplier: number,
    seasonalFactor: number
  ): MaterialPrice[] {
    let relevantMaterials = [...MATERIAL_PRICES];

    // Filter materials based on project type
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

    // Apply pricing factors
    return relevantMaterials.map(material => ({
      ...material,
      priceRange: {
        min: this.applyPricingFactors(material.priceRange.min, regionMultiplier, seasonalFactor),
        max: this.applyPricingFactors(material.priceRange.max, regionMultiplier, seasonalFactor),
        average: this.applyPricingFactors(
          material.priceRange.average,
          regionMultiplier,
          seasonalFactor
        ),
      },
    }));
  }

  /**
   * Get aggregate pricing with regional adjustments
   */
  private getAggregatePricing(request: PricingRequest, regionMultiplier: number): AggregateRate[] {
    const projectTypeLower = request.projectType.toLowerCase();

    // Filter aggregates based on project type
    let relevantAggregates = [...AGGREGATE_RATES];
    if (projectTypeLower.includes('foundation') || projectTypeLower.includes('concrete')) {
      relevantAggregates = AGGREGATE_RATES.filter(a => a.type === 'concrete' || a.type === 'sand');
    } else if (projectTypeLower.includes('driveway') || projectTypeLower.includes('path')) {
      relevantAggregates = AGGREGATE_RATES.filter(a => a.type === 'stone' || a.type === 'gravel');
    } else if (projectTypeLower.includes('garden') || projectTypeLower.includes('landscaping')) {
      relevantAggregates = AGGREGATE_RATES.filter(a => a.type === 'soil' || a.type === 'sand');
    }

    // Apply regional pricing (aggregates less affected by seasonality)
    return relevantAggregates.map(aggregate => ({
      ...aggregate,
      pricePerTonne: aggregate.pricePerTonne
        ? this.applyPricingFactors(aggregate.pricePerTonne, regionMultiplier, 1.0)
        : undefined,
      pricePerCubicMetre: aggregate.pricePerCubicMetre
        ? this.applyPricingFactors(aggregate.pricePerCubicMetre, regionMultiplier, 1.0)
        : undefined,
    }));
  }

  /**
   * Get labour pricing with regional and demand adjustments
   */
  private getLabourPricing(
    request: PricingRequest,
    regionMultiplier: number,
    demandIndex: number
  ): LabourRate[] {
    const projectTypeLower = request.projectType.toLowerCase();

    // Filter labour based on project type
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

    // Apply regional and demand pricing
    return relevantLabour.map(labour => ({
      ...labour,
      hourlyRate: {
        min: this.applyPricingFactors(labour.hourlyRate.min, regionMultiplier, demandIndex),
        max: this.applyPricingFactors(labour.hourlyRate.max, regionMultiplier, demandIndex),
        average: this.applyPricingFactors(labour.hourlyRate.average, regionMultiplier, demandIndex),
      },
      dailyRate: {
        min: this.applyPricingFactors(labour.dailyRate.min, regionMultiplier, demandIndex),
        max: this.applyPricingFactors(labour.dailyRate.max, regionMultiplier, demandIndex),
        average: this.applyPricingFactors(labour.dailyRate.average, regionMultiplier, demandIndex),
      },
    }));
  }

  /**
   * Apply regional and seasonal factors to prices
   */
  private applyPricingFactors(
    basePrice: number,
    regionMultiplier: number,
    seasonalFactor: number
  ): number {
    return Math.round(basePrice * regionMultiplier * seasonalFactor * 100) / 100;
  }

  /**
   * Generate intelligent pricing recommendations
   */
  private generateRecommendations(request: PricingRequest, context: any): PricingRecommendation[] {
    const recommendations: PricingRecommendation[] = [];

    // Regional recommendations
    if (context.region.multiplier > 1.2) {
      recommendations.push({
        type: 'cost_saving',
        message: `Consider sourcing materials from outside ${context.region.name} to reduce costs by up to ${Math.round((context.region.multiplier - 1) * 100)}%`,
        priority: 'high',
        potentialSaving: context.region.multiplier > 1.3 ? 1000 : 500,
      });
    }

    // Seasonal recommendations
    if (context.seasonalFactor > 1.1) {
      recommendations.push({
        type: 'timing',
        message:
          'Current season has higher demand. Consider scheduling work for autumn/winter for potential savings',
        priority: 'medium',
        potentialSaving: 300,
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

    // Bulk purchasing recommendations
    const bulkMaterials = context.materials.filter((m: any) => m.minimumOrder > 1);
    if (bulkMaterials.length > 0) {
      recommendations.push({
        type: 'cost_saving',
        message:
          'Consider bulk purchasing for materials like cement and aggregates to reduce unit costs',
        priority: 'medium',
        potentialSaving: 200,
      });
    }

    // Project scale recommendations
    if (request.projectScale === 'large') {
      recommendations.push({
        type: 'supplier',
        message: 'For large projects, negotiate trade accounts with suppliers for better rates',
        priority: 'high',
        potentialSaving: 800,
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
}
