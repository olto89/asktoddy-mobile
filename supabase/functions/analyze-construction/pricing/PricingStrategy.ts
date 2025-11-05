/**
 * PricingStrategy - Intelligent pricing aggregation and anonymization
 * Protects supplier identities while providing accurate market estimates
 */

export interface MarketPriceEstimate {
  item: string;
  marketPrice: {
    low: number; // 25th percentile
    typical: number; // Weighted average
    high: number; // 75th percentile
  };
  confidenceFactors: {
    dataPoints: number;
    priceVariance: number;
    lastUpdated: string;
    marketCoverage: 'excellent' | 'good' | 'limited';
  };
  hiringOptions: {
    daily: number;
    weekly: number;
    monthly: number;
    bestValue: 'daily' | 'weekly' | 'monthly';
  };
}

export interface AnonymizedQuote {
  totalEstimate: {
    equipment: number;
    materials: number;
    total: number;
    range: {
      min: number;
      max: number;
    };
  };
  marketInsights: string[];
  savingsOpportunities: string[];
  regionalAdjustment?: number;
  seasonalAdjustment?: number;
}

export class PricingStrategy {
  /**
   * Generate market-based pricing without revealing specific suppliers
   */
  static generateMarketEstimate(
    priceDataPoints: Array<{
      price: number;
      type: 'national' | 'regional' | 'local';
      date: string;
    }>
  ): MarketPriceEstimate['marketPrice'] {
    if (priceDataPoints.length === 0) {
      throw new Error('Insufficient pricing data');
    }

    // Sort prices for percentile calculation
    const sortedPrices = priceDataPoints.map(p => p.price).sort((a, b) => a - b);

    // Calculate percentiles
    const p25Index = Math.floor(sortedPrices.length * 0.25);
    const p75Index = Math.floor(sortedPrices.length * 0.75);

    // Weight prices by supplier type (national prices are more stable)
    const weightedPrices = priceDataPoints.map(point => {
      const weight = point.type === 'national' ? 1.2 : point.type === 'regional' ? 1.0 : 0.8;
      return point.price * weight;
    });

    const weightedAverage =
      weightedPrices.reduce((a, b) => a + b, 0) /
      priceDataPoints.reduce(
        (sum, p) => sum + (p.type === 'national' ? 1.2 : p.type === 'regional' ? 1.0 : 0.8),
        0
      );

    return {
      low: sortedPrices[p25Index],
      typical: Math.round(weightedAverage * 100) / 100,
      high: sortedPrices[p75Index],
    };
  }

  /**
   * Anonymize supplier-specific pricing into market bands
   */
  static anonymizePricing(
    supplierPrices: Array<{
      supplier: string;
      price: number;
      type: string;
    }>
  ): string {
    const marketEstimate = this.generateMarketEstimate(
      supplierPrices.map(s => ({
        price: s.price,
        type: s.type as any,
        date: new Date().toISOString(),
      }))
    );

    // Return market-based description without supplier names
    return (
      `Market rate: £${marketEstimate.typical}/day ` +
      `(typically £${marketEstimate.low}-${marketEstimate.high} across the market)`
    );
  }

  /**
   * Calculate smart averages with outlier handling
   */
  static calculateSmartAverage(prices: number[]): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    // Remove outliers (beyond 2 standard deviations)
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    );

    const filteredPrices = prices.filter(price => Math.abs(price - mean) <= 2 * stdDev);

    // If we removed too many outliers, use median instead
    if (filteredPrices.length < prices.length * 0.5) {
      const sorted = [...prices].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    }

    return filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length;
  }

  /**
   * Apply regional pricing adjustments
   */
  static applyRegionalAdjustment(basePrice: number, location: string): number {
    // Regional price multipliers based on UK market data
    const regionalMultipliers: Record<string, number> = {
      london: 1.35,
      'south-east': 1.25,
      'south-west': 1.15,
      midlands: 1.0,
      'north-west': 0.95,
      'north-east': 0.9,
      scotland: 0.95,
      wales: 0.92,
      'northern-ireland': 0.88,
    };

    const region = this.detectRegion(location);
    const multiplier = regionalMultipliers[region] || 1.0;

    return Math.round(basePrice * multiplier * 100) / 100;
  }

  /**
   * Generate pricing recommendations without revealing suppliers
   */
  static generatePricingRecommendations(
    itemType: string,
    duration: number, // in days
    location?: string
  ): string[] {
    const recommendations: string[] = [];

    // Duration-based recommendations
    if (duration > 5 && duration <= 7) {
      recommendations.push(
        'Consider weekly hire rates - typically 20-30% cheaper than daily rates for 5+ days'
      );
    } else if (duration > 20) {
      recommendations.push(
        'Monthly rates offer best value for projects over 3 weeks - usually 40-50% savings vs daily rates'
      );
    }

    // Item-specific recommendations
    if (itemType.toLowerCase().includes('digger') || itemType.toLowerCase().includes('excavator')) {
      recommendations.push(
        'Digger prices vary significantly by size - ensure you specify tonnage for accurate quotes'
      );
      if (duration < 3) {
        recommendations.push(
          'For short-term digger hire, consider operated hire which may be more cost-effective'
        );
      }
    }

    if (itemType.toLowerCase().includes('scaffold')) {
      recommendations.push(
        'Scaffolding is typically quoted per week with setup/takedown costs - factor in full project duration'
      );
    }

    // Location-based recommendations
    if (location) {
      const region = this.detectRegion(location);
      if (region === 'london' || region === 'south-east') {
        recommendations.push('Premium location - prices typically 25-35% higher than UK average');
      } else if (region === 'north-east' || region === 'wales') {
        recommendations.push('Competitive market area - good opportunity for negotiation');
      }
    }

    // General savings tips
    recommendations.push(
      'Package deals available when hiring multiple items - typical savings 10-15%'
    );

    return recommendations;
  }

  /**
   * Create anonymized quote summary
   */
  static createAnonymizedQuote(
    items: Array<{
      description: string;
      marketPrice: MarketPriceEstimate;
      quantity: number;
      duration: number;
    }>,
    location?: string
  ): AnonymizedQuote {
    let equipmentTotal = 0;
    let materialsTotal = 0;

    // Calculate totals
    items.forEach(item => {
      const dailyRate = item.marketPrice.marketPrice.typical;
      const itemTotal = dailyRate * item.quantity * item.duration;

      if (this.isEquipment(item.description)) {
        equipmentTotal += itemTotal;
      } else {
        materialsTotal += itemTotal;
      }
    });

    // Apply regional adjustment if location provided
    const regionalAdjustment = location ? this.getRegionalMultiplier(location) - 1 : 0;

    if (regionalAdjustment !== 0) {
      equipmentTotal *= 1 + regionalAdjustment;
      materialsTotal *= 1 + regionalAdjustment;
    }

    const total = equipmentTotal + materialsTotal;

    // Generate market insights
    const marketInsights = [
      `Based on analysis of ${items.length} items across the UK market`,
      'Prices reflect current market rates without supplier markup',
      'Actual quotes may vary ±15% based on availability and terms',
    ];

    // Generate savings opportunities
    const savingsOpportunities = [];

    if (total > 1000) {
      savingsOpportunities.push('Volume discount potential: 10-15% for orders over £1000');
    }

    if (items.some(i => i.duration > 5)) {
      savingsOpportunities.push('Weekly/monthly rates could reduce costs by 20-40%');
    }

    savingsOpportunities.push('Off-season hiring (Oct-Feb) typically 15-20% cheaper');

    return {
      totalEstimate: {
        equipment: Math.round(equipmentTotal),
        materials: Math.round(materialsTotal),
        total: Math.round(total),
        range: {
          min: Math.round(total * 0.85),
          max: Math.round(total * 1.15),
        },
      },
      marketInsights,
      savingsOpportunities,
      regionalAdjustment,
      seasonalAdjustment: this.getSeasonalAdjustment(),
    };
  }

  /**
   * Format pricing for AI responses
   */
  static formatPricingForAI(marketEstimate: MarketPriceEstimate): string {
    const { marketPrice, hiringOptions, confidenceFactors } = marketEstimate;

    let response = `**${marketEstimate.item}**\n`;
    response += `Market rate: £${marketPrice.typical}/day\n`;
    response += `Typical range: £${marketPrice.low}-${marketPrice.high}/day\n`;

    if (hiringOptions.weekly && hiringOptions.weekly < hiringOptions.daily * 7) {
      const weekSaving = Math.round((1 - hiringOptions.weekly / (hiringOptions.daily * 7)) * 100);
      response += `Weekly: £${hiringOptions.weekly} (${weekSaving}% saving)\n`;
    }

    if (hiringOptions.monthly && hiringOptions.monthly < hiringOptions.daily * 30) {
      const monthSaving = Math.round(
        (1 - hiringOptions.monthly / (hiringOptions.daily * 30)) * 100
      );
      response += `Monthly: £${hiringOptions.monthly} (${monthSaving}% saving)\n`;
    }

    // Add confidence indicator
    const confidenceEmoji =
      confidenceFactors.marketCoverage === 'excellent'
        ? '🟢'
        : confidenceFactors.marketCoverage === 'good'
          ? '🟡'
          : '🔴';

    response += `${confidenceEmoji} Confidence: ${confidenceFactors.marketCoverage} `;
    response += `(${confidenceFactors.dataPoints} suppliers analyzed)`;

    return response;
  }

  /**
   * Helper methods
   */

  private static isEquipment(description: string): boolean {
    const equipmentKeywords = [
      'digger',
      'excavator',
      'dumper',
      'scaffold',
      'mixer',
      'generator',
      'compactor',
      'hoist',
      'drill',
      'saw',
    ];

    return equipmentKeywords.some(keyword => description.toLowerCase().includes(keyword));
  }

  private static detectRegion(location: string): string {
    const locationLower = location.toLowerCase();

    // London and surroundings
    if (
      locationLower.includes('london') ||
      locationLower.includes('surrey') ||
      locationLower.includes('kent')
    ) {
      return 'london';
    }

    // South East
    if (
      locationLower.includes('sussex') ||
      locationLower.includes('hampshire') ||
      locationLower.includes('berkshire')
    ) {
      return 'south-east';
    }

    // South West
    if (
      locationLower.includes('devon') ||
      locationLower.includes('cornwall') ||
      locationLower.includes('bristol') ||
      locationLower.includes('gloucester')
    ) {
      return 'south-west';
    }

    // Midlands
    if (
      locationLower.includes('birmingham') ||
      locationLower.includes('leicester') ||
      locationLower.includes('nottingham') ||
      locationLower.includes('hinckley')
    ) {
      return 'midlands';
    }

    // North West
    if (
      locationLower.includes('manchester') ||
      locationLower.includes('liverpool') ||
      locationLower.includes('lake district')
    ) {
      return 'north-west';
    }

    // North East
    if (
      locationLower.includes('newcastle') ||
      locationLower.includes('durham') ||
      locationLower.includes('retford')
    ) {
      return 'north-east';
    }

    // Scotland
    if (
      locationLower.includes('scotland') ||
      locationLower.includes('edinburgh') ||
      locationLower.includes('glasgow')
    ) {
      return 'scotland';
    }

    // Wales
    if (
      locationLower.includes('wales') ||
      locationLower.includes('cardiff') ||
      locationLower.includes('swansea')
    ) {
      return 'wales';
    }

    return 'midlands'; // Default to midlands as baseline
  }

  private static getRegionalMultiplier(location: string): number {
    const multipliers: Record<string, number> = {
      london: 1.35,
      'south-east': 1.25,
      'south-west': 1.15,
      midlands: 1.0,
      'north-west': 0.95,
      'north-east': 0.9,
      scotland: 0.95,
      wales: 0.92,
    };

    return multipliers[this.detectRegion(location)] || 1.0;
  }

  private static getSeasonalAdjustment(): number {
    const month = new Date().getMonth();

    // Peak construction season (Apr-Sep): higher prices
    if (month >= 3 && month <= 8) {
      return 0.1; // 10% higher
    }

    // Off-season (Oct-Mar): lower prices
    return -0.15; // 15% lower
  }
}
