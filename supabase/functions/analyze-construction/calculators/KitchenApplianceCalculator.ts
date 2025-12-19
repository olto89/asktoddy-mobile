/**
 * Kitchen Appliance Calculator - Standard UK appliance costs
 * Essential items missing from current quotes
 */

export interface AppliancePackage {
  name: string;
  items: ApplianceItem[];
  totalCost: {
    min: number;
    max: number;
  };
}

export interface ApplianceItem {
  name: string;
  description: string;
  required: boolean;
  priceRange: {
    budget: number;
    mid: number;
    premium: number;
  };
}

export class KitchenApplianceCalculator {
  private static readonly APPLIANCES: ApplianceItem[] = [
    {
      name: 'Built-in Electric Oven',
      description: 'Single electric oven with grill function',
      required: true,
      priceRange: { budget: 250, mid: 500, premium: 1200 },
    },
    {
      name: 'Ceramic Hob',
      description: '4-ring ceramic or induction hob',
      required: true,
      priceRange: { budget: 150, mid: 350, premium: 800 },
    },
    {
      name: 'Extractor Hood',
      description: 'Built-in or chimney style extractor',
      required: true,
      priceRange: { budget: 80, mid: 200, premium: 500 },
    },
    {
      name: 'Integrated Dishwasher',
      description: 'Standard 60cm integrated dishwasher',
      required: false,
      priceRange: { budget: 280, mid: 450, premium: 800 },
    },
    {
      name: 'Under-counter Fridge',
      description: 'Integrated fridge or fridge-freezer',
      required: false,
      priceRange: { budget: 200, mid: 400, premium: 1200 },
    },
    {
      name: 'Microwave (Built-in)',
      description: 'Built-in microwave unit',
      required: false,
      priceRange: { budget: 150, mid: 300, premium: 600 },
    },
  ];

  // Installation costs per appliance
  private static readonly INSTALLATION_COSTS = {
    oven: { min: 50, max: 120 },
    hob: { min: 80, max: 150 }, // May need electrical work
    extractor: { min: 100, max: 200 }, // Ducting required
    dishwasher: { min: 80, max: 150 },
    fridge: { min: 40, max: 80 },
    microwave: { min: 60, max: 120 },
  };

  /**
   * Calculate appliance costs based on quality tier and requirements
   */
  static calculateAppliances(
    qualityTier: 'budget' | 'mid' | 'premium' = 'mid',
    includeLuxuryItems = false
  ): AppliancePackage {
    let totalMin = 0;
    let totalMax = 0;
    const selectedItems: (ApplianceItem & { selectedPrice: number; installCost: number })[] = [];

    for (const appliance of this.APPLIANCES) {
      // Include if required or luxury items requested
      if (!appliance.required && !includeLuxuryItems) continue;

      const basePrice = appliance.priceRange[qualityTier];
      const installKey = appliance.name.toLowerCase().includes('oven')
        ? 'oven'
        : appliance.name.toLowerCase().includes('hob')
          ? 'hob'
          : appliance.name.toLowerCase().includes('extractor')
            ? 'extractor'
            : appliance.name.toLowerCase().includes('dishwasher')
              ? 'dishwasher'
              : appliance.name.toLowerCase().includes('fridge')
                ? 'fridge'
                : 'microwave';

      const installCost = this.INSTALLATION_COSTS[installKey] || { min: 50, max: 100 };

      selectedItems.push({
        ...appliance,
        selectedPrice: basePrice,
        installCost: (installCost.min + installCost.max) / 2,
      });

      // Calculate price range (±20% variation)
      const itemMin = basePrice * 0.85 + installCost.min;
      const itemMax = basePrice * 1.15 + installCost.max;

      totalMin += itemMin;
      totalMax += itemMax;
    }

    return {
      name: `${qualityTier} Kitchen Appliance Package`,
      items: selectedItems.map(item => ({
        name: item.name,
        description: `${item.description} + installation`,
        required: item.required,
        priceRange: item.priceRange,
      })),
      totalCost: {
        min: Math.round(totalMin),
        max: Math.round(totalMax),
      },
    };
  }

  /**
   * Get appliance recommendations based on kitchen size
   */
  static getRecommendations(
    kitchenSize: number,
    budget: number
  ): {
    recommended: string[];
    optional: string[];
    warningsAndTips: string[];
  } {
    const isLargeKitchen = kitchenSize > 15;
    const isHighBudget = budget > 15000;

    const recommended = ['Built-in Electric Oven', 'Ceramic Hob', 'Extractor Hood'];

    const optional = [];
    const warningsAndTips = [];

    // Size-based recommendations
    if (isLargeKitchen) {
      optional.push('Integrated Dishwasher', 'Under-counter Fridge');
      warningsAndTips.push('Large kitchen - consider dishwasher for convenience');
    }

    // Budget-based recommendations
    if (isHighBudget) {
      optional.push('Microwave (Built-in)');
      warningsAndTips.push('Budget allows for premium appliance upgrades');
    } else {
      warningsAndTips.push('Consider appliance package deals for better value');
    }

    // General tips
    warningsAndTips.push(
      'All appliances require electrical connections - factor in electrician costs'
    );
    warningsAndTips.push(
      'Built-in appliances need precise measurements - order after kitchen fitting'
    );

    return { recommended, optional, warningsAndTips };
  }

  /**
   * Format appliances for AI prompt inclusion
   */
  static formatForPrompt(qualityTier: 'budget' | 'mid' | 'premium' = 'mid'): string {
    const package_ = this.calculateAppliances(qualityTier, false);

    const lines = [
      `Essential Kitchen Appliances (${qualityTier} tier):`,
      `Total cost: £${package_.totalCost.min} - £${package_.totalCost.max}`,
      '',
    ];

    for (const item of package_.items.filter(i => i.required)) {
      const price = this.APPLIANCES.find(a => a.name === item.name)?.priceRange[qualityTier] || 0;
      lines.push(`• ${item.name}: £${price} (+ installation)`);
    }

    return lines.join('\n');
  }
}
