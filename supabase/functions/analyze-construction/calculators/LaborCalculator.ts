/**
 * Labor Calculator - Realistic UK construction labor estimates
 * Based on industry standards and real contractor timelines
 */

export interface LaborEstimate {
  totalHours: number;
  breakdown: TradeBreakdown[];
  totalCost: {
    min: number;
    max: number;
  };
  timeline: {
    days: number;
    weeks: number;
  };
}

export interface TradeBreakdown {
  trade: string;
  hours: number;
  dailyRate: number;
  totalCost: number;
}

export class LaborCalculator {
  // Realistic project timelines (in working days)
  private static readonly PROJECT_TIMELINES = {
    bathroom: {
      small: { min: 3, max: 5 }, // <4m²
      medium: { min: 4, max: 7 }, // 4-8m²
      large: { min: 6, max: 10 }, // >8m²
    },
    kitchen: {
      small: { min: 3, max: 5 }, // <10m²
      medium: { min: 4, max: 7 }, // 10-15m²
      large: { min: 6, max: 10 }, // >15m²
    },
    extension: {
      small: { min: 15, max: 25 }, // <20m²
      medium: { min: 20, max: 35 }, // 20-40m²
      large: { min: 30, max: 50 }, // >40m²
    },
    loft: {
      small: { min: 10, max: 15 }, // Velux only
      medium: { min: 15, max: 25 }, // Dormer
      large: { min: 20, max: 35 }, // Full conversion
    },
  };

  // Trade daily rates (8 hours/day)
  private static readonly TRADE_RATES = {
    plumber: { min: 250, max: 400, avg: 325 },
    electrician: { min: 280, max: 450, avg: 365 },
    carpenter: { min: 200, max: 350, avg: 275 },
    tiler: { min: 180, max: 300, avg: 240 },
    plasterer: { min: 170, max: 280, avg: 225 },
    painter: { min: 150, max: 250, avg: 200 },
    general_builder: { min: 180, max: 300, avg: 240 },
    bricklayer: { min: 200, max: 350, avg: 275 },
    roofer: { min: 220, max: 380, avg: 300 },
  };

  // Trade mix by project type (percentage of time)
  private static readonly TRADE_MIX = {
    bathroom: {
      plumber: 30,
      electrician: 10,
      tiler: 30,
      carpenter: 10,
      plasterer: 10,
      painter: 10,
    },
    kitchen: {
      carpenter: 25,
      plumber: 20,
      electrician: 20,
      tiler: 15,
      plasterer: 10,
      painter: 10,
    },
    extension: {
      bricklayer: 25,
      roofer: 15,
      carpenter: 20,
      plumber: 10,
      electrician: 10,
      plasterer: 10,
      painter: 10,
    },
    loft: {
      carpenter: 30,
      roofer: 20,
      electrician: 15,
      plumber: 15,
      plasterer: 10,
      painter: 10,
    },
  };

  static calculateLabor(
    projectType: string,
    roomSize: number,
    complexity: 'simple' | 'standard' | 'complex' = 'standard'
  ): LaborEstimate {
    // Normalize project type
    const type = this.normalizeProjectType(projectType);

    // Determine size category
    const sizeCategory = this.getSizeCategory(type, roomSize);

    // Get timeline in days
    const timeline = this.PROJECT_TIMELINES[type]?.[sizeCategory] || { min: 5, max: 10 };

    // Apply complexity multiplier
    const complexityMultiplier = {
      simple: 0.8,
      standard: 1.0,
      complex: 1.3,
    }[complexity];

    const daysMin = Math.ceil(timeline.min * complexityMultiplier);
    const daysMax = Math.ceil(timeline.max * complexityMultiplier);

    // Calculate total hours (8 hour work days)
    const totalHours = ((daysMin + daysMax) / 2) * 8;

    // Calculate trade breakdown
    const tradeMix = this.TRADE_MIX[type] || this.TRADE_MIX.bathroom;
    const breakdown = this.calculateTradeBreakdown(tradeMix, totalHours);

    // Calculate total cost
    const totalCostMin = breakdown.reduce((sum, trade) => sum + trade.totalCost * 0.85, 0); // -15% for competitive quote
    const totalCostMax = breakdown.reduce((sum, trade) => sum + trade.totalCost * 1.15, 0); // +15% for premium service

    return {
      totalHours,
      breakdown,
      totalCost: {
        min: Math.round(totalCostMin),
        max: Math.round(totalCostMax),
      },
      timeline: {
        days: Math.round((daysMin + daysMax) / 2),
        weeks: Math.ceil((daysMin + daysMax) / 2 / 5),
      },
    };
  }

  private static normalizeProjectType(projectType: string): string {
    const type = projectType.toLowerCase();
    if (type.includes('bathroom')) return 'bathroom';
    if (type.includes('kitchen')) return 'kitchen';
    if (type.includes('extension')) return 'extension';
    if (type.includes('loft') || type.includes('attic')) return 'loft';
    return 'bathroom'; // default
  }

  private static getSizeCategory(type: string, size: number): 'small' | 'medium' | 'large' {
    const thresholds = {
      bathroom: { small: 4, large: 8 },
      kitchen: { small: 10, large: 15 },
      extension: { small: 20, large: 40 },
      loft: { small: 15, large: 30 },
    };

    const threshold = thresholds[type] || thresholds.bathroom;

    if (size < threshold.small) return 'small';
    if (size > threshold.large) return 'large';
    return 'medium';
  }

  private static calculateTradeBreakdown(
    tradeMix: Record<string, number>,
    totalHours: number
  ): TradeBreakdown[] {
    const breakdown: TradeBreakdown[] = [];

    for (const [trade, percentage] of Object.entries(tradeMix)) {
      if (percentage === 0) continue;

      const hours = Math.round((totalHours * percentage) / 100);
      const rate = this.TRADE_RATES[trade] || this.TRADE_RATES.general_builder;
      const days = hours / 8;

      breakdown.push({
        trade,
        hours,
        dailyRate: rate.avg,
        totalCost: Math.round(days * rate.avg),
      });
    }

    return breakdown;
  }

  // Helper method to format labor for display
  static formatLaborBreakdown(estimate: LaborEstimate): string {
    const lines = [
      `Total: ${estimate.timeline.days} days (${estimate.totalHours} hours)`,
      `Cost: £${estimate.totalCost.min} - £${estimate.totalCost.max}`,
      '',
      'Trade Breakdown:',
    ];

    for (const trade of estimate.breakdown) {
      const days = (trade.hours / 8).toFixed(1);
      lines.push(`• ${trade.trade}: ${days} days @ £${trade.dailyRate}/day = £${trade.totalCost}`);
    }

    return lines.join('\n');
  }
}
