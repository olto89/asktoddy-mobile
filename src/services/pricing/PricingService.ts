import { 
  PricingContext, 
  PricingResponse, 
  MaterialPricing, 
  ToolHirePricing, 
  LaborPricing, 
  AggregatePricing,
  PricingConfig 
} from './types';

export class PricingService {
  private config: PricingConfig;
  private cache: Map<string, { data: PricingResponse; timestamp: number }> = new Map();

  constructor(config: Partial<PricingConfig> = {}) {
    this.config = {
      enableRealTimeUpdates: true,
      cacheDurationMs: 1000 * 60 * 60, // 1 hour
      fallbackToEstimates: true,
      maxDeliveryRadius: 25, // 25km radius
      priceVarianceThreshold: 0.15, // 15%
      ...config
    };
  }

  /**
   * Get comprehensive pricing data for a construction project
   */
  async getPricingData(context: PricingContext): Promise<PricingResponse> {
    const cacheKey = this.generateCacheKey(context);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log('📊 Using cached pricing data');
      return this.cache.get(cacheKey)!.data;
    }

    console.log('📊 Fetching fresh pricing data...');

    try {
      // Get pricing from multiple sources
      const [materials, toolHire, labor, aggregates] = await Promise.all([
        this.getMaterialPricing(context),
        this.getToolHirePricing(context),
        this.getLaborPricing(context),
        this.getAggregatePricing(context)
      ]);

      // Calculate context factors
      const contextFactors = this.calculateContextFactors(context);

      // Generate recommendations
      const recommendations = this.generateRecommendations(context, {
        materials,
        toolHire,
        labor,
        aggregates,
        contextFactors
      });

      const response: PricingResponse = {
        materials,
        toolHire,
        labor,
        aggregates,
        contextFactors,
        recommendations,
        lastUpdated: new Date().toISOString(),
        source: 'PricingService'
      };

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;

    } catch (error) {
      console.error('❌ Failed to fetch pricing data:', error);
      
      if (this.config.fallbackToEstimates) {
        console.log('📊 Falling back to estimated pricing');
        return this.getFallbackPricing(context);
      }
      
      throw error;
    }
  }

  /**
   * Get material pricing for the project context
   */
  private async getMaterialPricing(context: PricingContext): Promise<MaterialPricing[]> {
    // In production, this would integrate with suppliers' APIs, government data, etc.
    // For MVP, we'll use realistic estimates based on current UK market rates
    
    const baseMaterials = this.getBaseMaterialsForProject(context.projectType);
    
    return baseMaterials.map(material => ({
      ...material,
      priceRange: this.adjustPriceForContext(material.priceRange, context),
      location: context.location.city || context.location.region,
      lastUpdated: new Date().toISOString(),
      source: 'estimated' as const
    }));
  }

  /**
   * Get tool hire pricing for the project context
   */
  private async getToolHirePricing(context: PricingContext): Promise<ToolHirePricing[]> {
    const baseTools = this.getBaseToolsForProject(context.projectType);
    
    return baseTools.map(tool => ({
      ...tool,
      dailyRate: this.adjustToolRateForContext(tool.dailyRate, context),
      location: `${context.location.city || context.location.region} area`,
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Get labor pricing for the project context
   */
  private async getLaborPricing(context: PricingContext): Promise<LaborPricing[]> {
    const laborTypes = this.getLaborTypesForProject(context.projectType);
    
    return laborTypes.map(labor => ({
      ...labor,
      region: context.location.region,
      hourlyRate: this.adjustLaborRateForContext(labor.hourlyRate, context),
      dayRate: {
        min: labor.hourlyRate.min * 7.5, // 7.5 hour day
        max: labor.hourlyRate.max * 8.5, // 8.5 hour day with overtime
        average: labor.hourlyRate.average * 8
      },
      demandMultiplier: this.calculateDemandMultiplier(context),
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Get aggregate pricing for the project context
   */
  private async getAggregatePricing(context: PricingContext): Promise<AggregatePricing[]> {
    const aggregates = this.getAggregatesForProject(context.projectType);
    
    return aggregates.map(aggregate => ({
      ...aggregate,
      priceRange: this.adjustPriceForContext(aggregate.priceRange, context),
      deliveryArea: [context.location.region],
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Calculate context factors that affect pricing
   */
  private calculateContextFactors(context: PricingContext) {
    const regionMultiplier = this.getRegionMultiplier(context.location.region);
    const seasonalMultiplier = this.getSeasonalMultiplier();
    const demandMultiplier = this.calculateDemandMultiplier(context);
    const accessibilityMultiplier = this.getAccessibilityMultiplier(context);

    return {
      regionMultiplier,
      seasonalMultiplier,
      demandMultiplier,
      accessibilityMultiplier
    };
  }

  /**
   * Generate cost-saving and optimization recommendations
   */
  private generateRecommendations(context: PricingContext, data: any) {
    const recommendations = [];

    // Regional recommendations
    if (data.contextFactors.regionMultiplier > 1.1) {
      recommendations.push({
        type: 'cost_saving' as const,
        message: `Prices in ${context.location.region} are ${Math.round((data.contextFactors.regionMultiplier - 1) * 100)}% above national average. Consider sourcing from nearby areas.`,
        impact: `Potential saving: 5-15%`
      });
    }

    // Seasonal recommendations
    if (data.contextFactors.seasonalMultiplier > 1.05) {
      recommendations.push({
        type: 'timing' as const,
        message: 'Current season has higher pricing. Consider delaying non-urgent work to shoulder seasons.',
        impact: `Potential saving: ${Math.round((data.contextFactors.seasonalMultiplier - 1) * 100)}%`
      });
    }

    // Scale recommendations
    if (context.projectScale === 'large') {
      recommendations.push({
        type: 'supplier' as const,
        message: 'For large projects, consider direct supplier relationships for bulk discounts.',
        impact: 'Potential saving: 10-20%'
      });
    }

    // Quality vs cost recommendations
    if (context.userPreferences?.priceRange === 'budget') {
      recommendations.push({
        type: 'quality' as const,
        message: 'Budget materials selected. Ensure they meet building regulations and consider long-term value.',
        impact: 'Consider spending 15-20% more on critical structural elements'
      });
    }

    return recommendations;
  }

  /**
   * Get base materials for different project types
   */
  private getBaseMaterialsForProject(projectType: string): Partial<MaterialPricing>[] {
    const materialDb: Record<string, Partial<MaterialPricing>[]> = {
      'Kitchen Renovation': [
        {
          id: 'kitchen_units',
          name: 'Kitchen Units',
          category: 'finishing',
          unit: 'per linear meter',
          priceRange: { min: 300, max: 1200, average: 650 },
          availability: 'in_stock',
          wasteFactor: 0.05
        },
        {
          id: 'worktop',
          name: 'Worktop',
          category: 'finishing',
          unit: 'per m²',
          priceRange: { min: 80, max: 400, average: 180 },
          availability: 'order_required',
          leadTime: 7,
          wasteFactor: 0.1
        }
      ],
      'Bathroom Remodel': [
        {
          id: 'bathroom_suite',
          name: 'Bathroom Suite',
          category: 'finishing',
          unit: 'per unit',
          priceRange: { min: 400, max: 2000, average: 900 },
          availability: 'in_stock',
          wasteFactor: 0.02
        },
        {
          id: 'tiles',
          name: 'Ceramic Tiles',
          category: 'finishing',
          unit: 'per m²',
          priceRange: { min: 15, max: 80, average: 35 },
          availability: 'in_stock',
          wasteFactor: 0.15
        }
      ]
    };

    return materialDb[projectType] || [
      {
        id: 'general_materials',
        name: 'General Construction Materials',
        category: 'other',
        unit: 'per project',
        priceRange: { min: 500, max: 2000, average: 1000 },
        availability: 'in_stock',
        wasteFactor: 0.1
      }
    ];
  }

  /**
   * Get base tools for different project types
   */
  private getBaseToolsForProject(projectType: string): Partial<ToolHirePricing>[] {
    const toolDb: Record<string, Partial<ToolHirePricing>[]> = {
      'Kitchen Renovation': [
        {
          id: 'cordless_drill',
          name: 'Cordless Drill/Driver',
          category: 'power_tools',
          dailyRate: 15,
          supplier: 'Local Tool Hire',
          availability: 'available',
          minimumHire: 1
        },
        {
          id: 'circular_saw',
          name: 'Circular Saw',
          category: 'power_tools',
          dailyRate: 25,
          supplier: 'Local Tool Hire',
          availability: 'available',
          minimumHire: 1
        }
      ],
      'Bathroom Remodel': [
        {
          id: 'tile_cutter',
          name: 'Electric Tile Cutter',
          category: 'power_tools',
          dailyRate: 30,
          supplier: 'Local Tool Hire',
          availability: 'limited',
          minimumHire: 1
        },
        {
          id: 'angle_grinder',
          name: 'Angle Grinder',
          category: 'power_tools',
          dailyRate: 20,
          supplier: 'Local Tool Hire',
          availability: 'available',
          minimumHire: 1
        }
      ]
    };

    return toolDb[projectType] || [
      {
        id: 'basic_tools',
        name: 'Basic Tool Set',
        category: 'hand_tools',
        dailyRate: 20,
        supplier: 'Local Tool Hire',
        availability: 'available',
        minimumHire: 1
      }
    ];
  }

  /**
   * Get labor types for different project types
   */
  private getLaborTypesForProject(projectType: string): Partial<LaborPricing>[] {
    return [
      {
        tradeType: 'general',
        skillLevel: 'skilled',
        hourlyRate: { min: 25, max: 45, average: 35 },
        availability: 'medium'
      },
      {
        tradeType: 'carpenter',
        skillLevel: 'skilled',
        hourlyRate: { min: 30, max: 50, average: 40 },
        availability: 'medium'
      }
    ];
  }

  /**
   * Get aggregates for different project types
   */
  private getAggregatesForProject(projectType: string): Partial<AggregatePricing>[] {
    return [
      {
        type: 'sand',
        unit: 'tonne',
        priceRange: { min: 25, max: 45, average: 35 },
        supplier: 'Local Supplier',
        deliveryArea: ['Local area'],
        minimumOrder: 1,
        deliveryCost: 25
      }
    ];
  }

  // Helper methods for price adjustments
  private adjustPriceForContext(priceRange: any, context: PricingContext) {
    const multiplier = this.getRegionMultiplier(context.location.region) * 
                     this.getSeasonalMultiplier() *
                     this.getScaleMultiplier(context.projectScale);

    return {
      min: Math.round(priceRange.min * multiplier),
      max: Math.round(priceRange.max * multiplier),
      average: Math.round(priceRange.average * multiplier)
    };
  }

  private adjustToolRateForContext(baseRate: number, context: PricingContext): number {
    const multiplier = this.getRegionMultiplier(context.location.region);
    return Math.round(baseRate * multiplier);
  }

  private adjustLaborRateForContext(hourlyRate: any, context: PricingContext) {
    const multiplier = this.getRegionMultiplier(context.location.region) * 
                     this.calculateDemandMultiplier(context);

    return {
      min: Math.round(hourlyRate.min * multiplier),
      max: Math.round(hourlyRate.max * multiplier),
      average: Math.round(hourlyRate.average * multiplier)
    };
  }

  private getRegionMultiplier(region: string): number {
    const regionMultipliers: Record<string, number> = {
      'London': 1.3,
      'South East': 1.15,
      'South West': 1.05,
      'Scotland': 0.95,
      'North East': 0.85,
      'North West': 0.9,
      'Wales': 0.88,
      'Northern Ireland': 0.82
    };
    return regionMultipliers[region] || 1.0;
  }

  private getSeasonalMultiplier(): number {
    const month = new Date().getMonth();
    // Spring/Summer premium (construction season)
    if (month >= 3 && month <= 8) return 1.1;
    // Winter discount
    if (month >= 11 || month <= 1) return 0.95;
    return 1.0;
  }

  private getScaleMultiplier(scale: string): number {
    const scaleMultipliers = {
      'small': 1.1, // Small projects pay premium
      'medium': 1.0,
      'large': 0.9 // Large projects get bulk discount
    };
    return scaleMultipliers[scale as keyof typeof scaleMultipliers] || 1.0;
  }

  private calculateDemandMultiplier(context: PricingContext): number {
    // Simplified demand calculation - in production would use real market data
    const baseDemand = 1.0;
    
    // High demand periods
    if (context.projectType.includes('Extension') || context.projectType.includes('Conversion')) {
      return baseDemand + 0.15; // 15% premium for complex work
    }
    
    return baseDemand;
  }

  private getAccessibilityMultiplier(context: PricingContext): number {
    // For MVP, return standard multiplier
    // In production, could factor in urban density, parking, access roads, etc.
    return 1.0;
  }

  /**
   * Cache management
   */
  private generateCacheKey(context: PricingContext): string {
    return `${context.location.region}-${context.projectType}-${context.projectScale}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < this.config.cacheDurationMs;
  }

  /**
   * Fallback pricing when APIs fail
   */
  private async getFallbackPricing(context: PricingContext): Promise<PricingResponse> {
    console.log('📊 Generating fallback pricing estimates');
    
    return {
      materials: this.getBaseMaterialsForProject(context.projectType) as MaterialPricing[],
      toolHire: this.getBaseToolsForProject(context.projectType) as ToolHirePricing[],
      labor: this.getLaborTypesForProject(context.projectType) as LaborPricing[],
      aggregates: this.getAggregatesForProject(context.projectType) as AggregatePricing[],
      contextFactors: {
        regionMultiplier: 1.0,
        seasonalMultiplier: 1.0,
        demandMultiplier: 1.0,
        accessibilityMultiplier: 1.0
      },
      recommendations: [{
        type: 'cost_saving',
        message: 'Pricing estimates based on historical data. Verify with local suppliers for current rates.',
        impact: 'Estimates may vary ±20% from current market rates'
      }],
      lastUpdated: new Date().toISOString(),
      source: 'fallback_estimates'
    };
  }

  /**
   * Health check for pricing service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; details: any }> {
    try {
      // Quick test with minimal context
      const testContext: PricingContext = {
        location: { region: 'London' },
        projectType: 'test',
        projectScale: 'small'
      };
      
      await this.getPricingData(testContext);
      
      return {
        status: 'healthy',
        details: {
          cacheSize: this.cache.size,
          lastUpdate: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Clear pricing cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('📊 Pricing cache cleared');
  }
}