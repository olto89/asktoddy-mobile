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
  CONTINGENCY_FACTORS,
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
    const contingency = this.getContingencyFactor();
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
      contingency,
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
        contingencyPercentage: contingency.percentage,
        weatherRisk: contingency.weatherRisk,
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
   * Get current seasonal contingency factor
   */
  private getContingencyFactor() {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) return CONTINGENCY_FACTORS.spring;
    if (month >= 6 && month <= 8) return CONTINGENCY_FACTORS.summer;
    if (month >= 9 && month <= 11) return CONTINGENCY_FACTORS.autumn;
    return CONTINGENCY_FACTORS.winter;
  }

  /**
   * Select curated bathroom materials - FIXED to prevent excessive material lists
   */
  private selectBathroomMaterials(): MaterialPrice[] {
    console.log(`🛁 Selecting bathroom materials from ${MATERIAL_PRICES.length} total materials`);

    // Fixed list of essential bathroom materials to prevent sprawl
    const essentialBathroomMaterials = [
      {
        id: 'bathroom_suite_complete',
        name: 'Complete Bathroom Suite',
        category: 'plumbing',
        priceRange: { min: 450, max: 850, average: 650 },
        unit: 'set',
        supplier: 'Bathroom specialists',
        description: 'Complete white bathroom suite including toilet, basin, and bath',
      },
      {
        id: 'bathroom_tiles_ceramic',
        name: 'Bathroom Wall Tiles',
        category: 'finishing',
        priceRange: { min: 18, max: 35, average: 26.5 },
        unit: 'm²',
        supplier: 'Tile suppliers',
        description: 'Quality ceramic wall tiles for bathroom',
      },
      {
        id: 'bathroom_floor_tiles',
        name: 'Bathroom Floor Tiles',
        category: 'finishing',
        priceRange: { min: 22, max: 45, average: 33.5 },
        unit: 'm²',
        supplier: 'Tile suppliers',
        description: 'Non-slip floor tiles suitable for bathrooms',
      },
      {
        id: 'bathroom_mixer_tap',
        name: 'Basin Mixer Tap',
        category: 'plumbing',
        priceRange: { min: 65, max: 180, average: 122.5 },
        unit: 'unit',
        supplier: 'Plumbing suppliers',
        description: 'Chrome basin mixer tap with pop-up waste',
      },
      {
        id: 'shower_mixer',
        name: 'Thermostatic Shower Mixer',
        category: 'plumbing',
        priceRange: { min: 95, max: 280, average: 187.5 },
        unit: 'unit',
        supplier: 'Plumbing suppliers',
        description: 'Thermostatic shower mixer valve',
      },
      {
        id: 'bathroom_paint',
        name: 'Bathroom Paint (Moisture Resistant)',
        category: 'finishing',
        priceRange: { min: 25, max: 45, average: 35 },
        unit: '5L',
        supplier: 'Paint suppliers',
        description: 'Moisture resistant bathroom paint',
      },
    ] as MaterialPrice[];

    console.log(`✅ Selected ${essentialBathroomMaterials.length} curated bathroom materials`);
    return essentialBathroomMaterials;
  }

  /**
   * Select curated kitchen materials - FIXED to prevent excessive material lists
   */
  private selectKitchenMaterials(): MaterialPrice[] {
    console.log(`🍳 Selecting kitchen materials from ${MATERIAL_PRICES.length} total materials`);

    // Fixed list of essential kitchen materials to prevent sprawl
    const essentialKitchenMaterials = [
      {
        id: 'kitchen_units_base',
        name: 'Kitchen Base Units',
        category: 'finishing',
        priceRange: { min: 180, max: 380, average: 280 },
        unit: 'per unit',
        supplier: 'Kitchen suppliers',
        description: 'Standard kitchen base units with doors and drawers',
      },
      {
        id: 'kitchen_worktop',
        name: 'Kitchen Worktop',
        category: 'finishing',
        priceRange: { min: 85, max: 220, average: 152.5 },
        unit: 'per linear meter',
        supplier: 'Worktop suppliers',
        description: 'Laminate or solid surface worktop',
      },
      {
        id: 'kitchen_sink',
        name: 'Kitchen Sink & Tap',
        category: 'plumbing',
        priceRange: { min: 120, max: 350, average: 235 },
        unit: 'set',
        supplier: 'Plumbing suppliers',
        description: 'Stainless steel sink with mixer tap',
      },
      {
        id: 'kitchen_tiles',
        name: 'Kitchen Wall Tiles',
        category: 'finishing',
        priceRange: { min: 15, max: 42, average: 28.5 },
        unit: 'm²',
        supplier: 'Tile suppliers',
        description: 'Ceramic wall tiles for splashback',
      },
      {
        id: 'kitchen_electrical',
        name: 'Kitchen Electrical Points',
        category: 'electrical',
        priceRange: { min: 45, max: 85, average: 65 },
        unit: 'per point',
        supplier: 'Electrical suppliers',
        description: 'Double electrical sockets and switches',
      },
      {
        id: 'kitchen_paint',
        name: 'Kitchen Paint',
        category: 'finishing',
        priceRange: { min: 22, max: 38, average: 30 },
        unit: '5L',
        supplier: 'Paint suppliers',
        description: 'Washable kitchen and bathroom paint',
      },
    ] as MaterialPrice[];

    console.log(`✅ Selected ${essentialKitchenMaterials.length} curated kitchen materials`);
    return essentialKitchenMaterials;
  }

  /**
   * Select general construction materials - FIXED to prevent excessive material lists
   */
  private selectGeneralMaterials(): MaterialPrice[] {
    console.log(`🏗️ Selecting general materials from ${MATERIAL_PRICES.length} total materials`);

    // Fixed list of common construction materials to prevent sprawl
    const essentialGeneralMaterials = [
      {
        id: 'cement_25kg',
        name: 'Cement (25kg bag)',
        category: 'structural',
        priceRange: { min: 4.2, max: 5.8, average: 4.95 },
        unit: 'per bag',
        supplier: 'Builders merchants',
        description: 'General purpose cement',
      },
      {
        id: 'sand_tonne',
        name: 'Building Sand',
        category: 'structural',
        priceRange: { min: 28, max: 45, average: 36.5 },
        unit: 'per tonne',
        supplier: 'Aggregate suppliers',
        description: 'General purpose building sand',
      },
      {
        id: 'emulsion_paint',
        name: 'Emulsion Paint',
        category: 'finishing',
        priceRange: { min: 18, max: 32, average: 25 },
        unit: '5L',
        supplier: 'Paint suppliers',
        description: 'Standard matt emulsion paint',
      },
      {
        id: 'plasterboard_standard',
        name: 'Plasterboard 12.5mm',
        category: 'finishing',
        priceRange: { min: 8.5, max: 12.5, average: 10.5 },
        unit: 'per sheet',
        supplier: 'Plasterboard suppliers',
        description: 'Standard plasterboard sheet 2.4x1.2m',
      },
      {
        id: 'copper_pipe_15mm',
        name: 'Copper Pipe 15mm',
        category: 'plumbing',
        priceRange: { min: 4.2, max: 6.8, average: 5.5 },
        unit: 'per meter',
        supplier: 'Plumbing suppliers',
        description: '15mm copper pipe',
      },
      {
        id: 'twin_earth_cable',
        name: 'Twin & Earth Cable',
        category: 'electrical',
        priceRange: { min: 1.8, max: 3.2, average: 2.5 },
        unit: 'per meter',
        supplier: 'Electrical suppliers',
        description: '2.5mm twin and earth cable',
      },
    ] as MaterialPrice[];

    console.log(`✅ Selected ${essentialGeneralMaterials.length} curated general materials`);
    return essentialGeneralMaterials;
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
   * Get tool hire pricing with regional and seasonal adjustments - FIXED to prevent excessive tool lists
   */
  private getToolHirePricing(
    request: PricingRequest,
    regionMultiplier: number,
    seasonalFactor: number
  ): ToolHireRate[] {
    let relevantTools: ToolHireRate[] = [];

    // Smart tool selection based on project type
    const projectTypeLower = request.projectType.toLowerCase();

    if (projectTypeLower.includes('bathroom') || projectTypeLower.includes('ensuite')) {
      // Bathroom projects need minimal tools
      relevantTools = this.selectBathroomTools();
    } else if (projectTypeLower.includes('kitchen')) {
      // Kitchen projects need moderate tools
      relevantTools = this.selectKitchenTools();
    } else if (projectTypeLower.includes('decking') || projectTypeLower.includes('garden')) {
      // Outdoor projects need specific tools
      relevantTools = this.selectOutdoorTools();
    } else if (request.tools && request.tools.length > 0) {
      // Specific tools requested
      relevantTools = TOOL_HIRE_RATES.filter(tool =>
        request.tools!.some(
          requestedTool =>
            tool.name.toLowerCase().includes(requestedTool.toLowerCase()) ||
            requestedTool.toLowerCase().includes(tool.name.toLowerCase())
        )
      );
    } else {
      // General construction - basic tool set
      relevantTools = this.selectGeneralTools();
    }

    console.log(`🔧 Selected ${relevantTools.length} relevant tools for ${request.projectType}`);

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
   * Select tools for bathroom projects
   */
  private selectBathroomTools(): ToolHireRate[] {
    return [
      {
        name: 'SDS Drill',
        tradeType: 'General',
        category: 'Power Tools',
        dailyRate: 25,
        weeklyRate: 125,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Angle Grinder',
        tradeType: 'General',
        category: 'Power Tools',
        dailyRate: 20,
        weeklyRate: 100,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Tile Cutter',
        tradeType: 'Tiling',
        category: 'Specialist Tools',
        dailyRate: 30,
        weeklyRate: 150,
        availability: 'medium',
        supplier: 'Local tool hire',
      },
      {
        name: 'Basic Hand Tools',
        tradeType: 'General',
        category: 'Hand Tools',
        dailyRate: 15,
        weeklyRate: 75,
        availability: 'high',
        supplier: 'Local tool hire',
      },
    ] as ToolHireRate[];
  }

  /**
   * Select tools for kitchen projects
   */
  private selectKitchenTools(): ToolHireRate[] {
    return [
      {
        name: 'SDS Drill',
        tradeType: 'General',
        category: 'Power Tools',
        dailyRate: 25,
        weeklyRate: 125,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Circular Saw',
        tradeType: 'Carpentry',
        category: 'Power Tools',
        dailyRate: 28,
        weeklyRate: 140,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Jigsaw',
        tradeType: 'Carpentry',
        category: 'Power Tools',
        dailyRate: 20,
        weeklyRate: 100,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Router',
        tradeType: 'Carpentry',
        category: 'Specialist Tools',
        dailyRate: 35,
        weeklyRate: 175,
        availability: 'medium',
        supplier: 'Local tool hire',
      },
      {
        name: 'Basic Hand Tools',
        tradeType: 'General',
        category: 'Hand Tools',
        dailyRate: 15,
        weeklyRate: 75,
        availability: 'high',
        supplier: 'Local tool hire',
      },
    ] as ToolHireRate[];
  }

  /**
   * Select tools for outdoor/decking projects
   */
  private selectOutdoorTools(): ToolHireRate[] {
    return [
      {
        name: 'Circular Saw',
        tradeType: 'Carpentry',
        category: 'Power Tools',
        dailyRate: 28,
        weeklyRate: 140,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Post Hole Digger',
        tradeType: 'Landscaping',
        category: 'Groundworks',
        dailyRate: 45,
        weeklyRate: 225,
        availability: 'medium',
        supplier: 'Local tool hire',
      },
      {
        name: 'Compactor Plate',
        tradeType: 'Groundworks',
        category: 'Compaction',
        dailyRate: 40,
        weeklyRate: 200,
        availability: 'medium',
        supplier: 'Local tool hire',
      },
      {
        name: 'Spirit Level',
        tradeType: 'General',
        category: 'Hand Tools',
        dailyRate: 8,
        weeklyRate: 40,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Basic Hand Tools',
        tradeType: 'General',
        category: 'Hand Tools',
        dailyRate: 15,
        weeklyRate: 75,
        availability: 'high',
        supplier: 'Local tool hire',
      },
    ] as ToolHireRate[];
  }

  /**
   * Select general construction tools
   */
  private selectGeneralTools(): ToolHireRate[] {
    return [
      {
        name: 'SDS Drill',
        tradeType: 'General',
        category: 'Power Tools',
        dailyRate: 25,
        weeklyRate: 125,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Angle Grinder',
        tradeType: 'General',
        category: 'Power Tools',
        dailyRate: 20,
        weeklyRate: 100,
        availability: 'high',
        supplier: 'Local tool hire',
      },
      {
        name: 'Basic Hand Tools',
        tradeType: 'General',
        category: 'Hand Tools',
        dailyRate: 15,
        weeklyRate: 75,
        availability: 'high',
        supplier: 'Local tool hire',
      },
    ] as ToolHireRate[];
  }

  /**
   * Get material pricing with regional and seasonal adjustments
   */
  private getMaterialPricing(
    request: PricingRequest,
    regionMultiplier: number,
    seasonalFactor: number
  ): MaterialPrice[] {
    let relevantMaterials: MaterialPrice[] = [];

    // Smart material selection based on project type
    const projectTypeLower = request.projectType.toLowerCase();

    if (projectTypeLower.includes('bathroom') || projectTypeLower.includes('ensuite')) {
      // For bathrooms, select key items only
      relevantMaterials = this.selectBathroomMaterials();
    } else if (projectTypeLower.includes('kitchen')) {
      // For kitchens, select typical renovation items
      relevantMaterials = this.selectKitchenMaterials();
    } else if (projectTypeLower.includes('electrical')) {
      relevantMaterials = MATERIAL_PRICES.filter(m => m.category === 'electrical').slice(0, 5); // Limit to 5 most common electrical items
    } else if (projectTypeLower.includes('plumbing')) {
      relevantMaterials = MATERIAL_PRICES.filter(m => m.category === 'plumbing').slice(0, 5); // Limit to 5 most common plumbing items
    } else {
      // General construction - select mix of common items
      relevantMaterials = this.selectGeneralMaterials();
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

    // Seasonal recommendations with contingency advice
    const contingency = context.contingency;
    if (contingency && contingency.percentage >= 15) {
      recommendations.push({
        type: 'timing',
        title: `Consider waiting - ${contingency.percentage}% winter contingency applied`,
        description: `${contingency.weatherRisk}. ${contingency.laborAvailability}. Consider starting in spring/summer for better conditions and lower risk.`,
        savingsPotential: `${contingency.percentage - 8}%`, // Compared to summer baseline
      });
    } else if (context.seasonalFactor > 1.1) {
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
