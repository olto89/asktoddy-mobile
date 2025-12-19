/**
 * Project Material Mapper - Ensures correct materials for each project type
 * Fixes the random material selection issue
 */

export interface ProjectMaterialRequirement {
  projectType: string;
  essentialMaterials: string[];
  finishLevels: {
    budget: MaterialSet;
    mid: MaterialSet;
    premium: MaterialSet;
  };
  excludeMaterials: string[];
}

export interface MaterialSet {
  items: ProjectMaterial[];
  totalEstimate: {
    min: number;
    max: number;
  };
}

export interface ProjectMaterial {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  description: string;
}

export class ProjectMaterialMapper {
  private static readonly PROJECT_REQUIREMENTS: Record<string, ProjectMaterialRequirement> = {
    kitchen: {
      projectType: 'kitchen',
      essentialMaterials: [
        'kitchen_units_base',
        'kitchen_worktop',
        'kitchen_sink',
        'kitchen_tiles',
        'kitchen_appliances',
        'kitchen_electrical',
        'kitchen_paint',
      ],
      finishLevels: {
        budget: {
          items: [
            {
              id: 'kitchen_units_base',
              name: 'Budget Kitchen Units',
              category: 'finishing',
              quantity: 8, // 3x4m kitchen
              unit: 'unit',
              priceRange: { min: 120, max: 200, average: 160 },
              description: 'Flat-pack kitchen base units',
            },
            {
              id: 'kitchen_worktop_laminate',
              name: 'Laminate Worktop',
              category: 'finishing',
              quantity: 4,
              unit: 'linear meter',
              priceRange: { min: 60, max: 100, average: 80 },
              description: 'Budget laminate worktop',
            },
            {
              id: 'kitchen_appliances_budget',
              name: 'Budget Appliance Package',
              category: 'appliances',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 800, max: 1200, average: 1000 },
              description: 'Basic oven, hob, extractor + installation',
            },
            {
              id: 'kitchen_sink_budget',
              name: 'Budget Sink & Tap',
              category: 'plumbing',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 80, max: 150, average: 115 },
              description: 'Basic stainless steel sink with tap',
            },
          ],
          totalEstimate: { min: 2500, max: 4000 },
        },
        mid: {
          items: [
            {
              id: 'kitchen_units_mid',
              name: 'Mid-Range Kitchen Units',
              category: 'finishing',
              quantity: 8,
              unit: 'unit',
              priceRange: { min: 200, max: 350, average: 275 },
              description: 'Solid wood doors, soft-close hinges',
            },
            {
              id: 'kitchen_worktop_solid',
              name: 'Solid Surface Worktop',
              category: 'finishing',
              quantity: 4,
              unit: 'linear meter',
              priceRange: { min: 120, max: 200, average: 160 },
              description: 'Solid surface or engineered stone',
            },
            {
              id: 'kitchen_appliances_mid',
              name: 'Mid-Range Appliance Package',
              category: 'appliances',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 1200, max: 2000, average: 1600 },
              description: 'Quality oven, induction hob, integrated dishwasher',
            },
            {
              id: 'kitchen_sink_mid',
              name: 'Quality Sink & Tap',
              category: 'plumbing',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 200, max: 350, average: 275 },
              description: 'Undermount sink with mixer tap',
            },
          ],
          totalEstimate: { min: 4500, max: 7000 },
        },
        premium: {
          items: [
            {
              id: 'kitchen_units_premium',
              name: 'Premium Kitchen Units',
              category: 'finishing',
              quantity: 8,
              unit: 'unit',
              priceRange: { min: 400, max: 800, average: 600 },
              description: 'Bespoke hardwood units, premium hardware',
            },
            {
              id: 'kitchen_worktop_granite',
              name: 'Granite/Quartz Worktop',
              category: 'finishing',
              quantity: 4,
              unit: 'linear meter',
              priceRange: { min: 300, max: 500, average: 400 },
              description: 'Natural granite or engineered quartz',
            },
            {
              id: 'kitchen_appliances_premium',
              name: 'Premium Appliance Package',
              category: 'appliances',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 3000, max: 6000, average: 4500 },
              description: 'Premium brands: Bosch, Miele, integrated suite',
            },
          ],
          totalEstimate: { min: 8000, max: 15000 },
        },
      },
      excludeMaterials: [
        'cement',
        'concrete',
        'bricks',
        'roof_tiles',
        'insulation',
        'building_sand',
        'aggregate',
        'mortar',
      ],
    },

    bathroom: {
      projectType: 'bathroom',
      essentialMaterials: ['bathroom_suite', 'bathroom_tiles', 'bathroom_taps', 'bathroom_paint'],
      finishLevels: {
        budget: {
          items: [
            {
              id: 'bathroom_suite_budget',
              name: 'Budget Bathroom Suite',
              category: 'plumbing',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 300, max: 500, average: 400 },
              description: 'Basic white suite: toilet, basin, bath',
            },
            {
              id: 'bathroom_tiles_budget',
              name: 'Budget Ceramic Tiles',
              category: 'finishing',
              quantity: 15, // walls + floor
              unit: 'm²',
              priceRange: { min: 15, max: 25, average: 20 },
              description: 'Basic ceramic wall and floor tiles',
            },
          ],
          totalEstimate: { min: 800, max: 1500 },
        },
        mid: {
          items: [
            {
              id: 'bathroom_suite_mid',
              name: 'Mid-Range Bathroom Suite',
              category: 'plumbing',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 600, max: 1000, average: 800 },
              description: 'Quality suite with modern fittings',
            },
            {
              id: 'bathroom_tiles_mid',
              name: 'Quality Porcelain Tiles',
              category: 'finishing',
              quantity: 15,
              unit: 'm²',
              priceRange: { min: 25, max: 45, average: 35 },
              description: 'Porcelain tiles, modern designs',
            },
          ],
          totalEstimate: { min: 1500, max: 2500 },
        },
        premium: {
          items: [
            {
              id: 'bathroom_suite_premium',
              name: 'Premium Bathroom Suite',
              category: 'plumbing',
              quantity: 1,
              unit: 'set',
              priceRange: { min: 1500, max: 3000, average: 2250 },
              description: 'Designer suite, premium brands',
            },
          ],
          totalEstimate: { min: 3000, max: 6000 },
        },
      },
      excludeMaterials: [
        'kitchen_units',
        'kitchen_worktop',
        'kitchen_appliances',
        'cement',
        'concrete',
        'bricks',
      ],
    },
  };

  /**
   * Get correct materials for a project type and finish level
   */
  static getMaterialsForProject(
    projectType: string,
    finishLevel: 'budget' | 'mid' | 'premium' = 'mid',
    roomSize?: number
  ): MaterialSet {
    const normalizedType = this.normalizeProjectType(projectType);
    const requirements = this.PROJECT_REQUIREMENTS[normalizedType];

    if (!requirements) {
      console.warn(`Unknown project type: ${projectType}, defaulting to bathroom`);
      return this.PROJECT_REQUIREMENTS['bathroom'].finishLevels[finishLevel];
    }

    let materialSet = requirements.finishLevels[finishLevel];

    // Adjust quantities based on room size
    if (roomSize) {
      materialSet = this.adjustForRoomSize(materialSet, roomSize, normalizedType);
    }

    return materialSet;
  }

  /**
   * Check if a material should be excluded for a project type
   */
  static shouldExcludeMaterial(projectType: string, materialId: string): boolean {
    const normalizedType = this.normalizeProjectType(projectType);
    const requirements = this.PROJECT_REQUIREMENTS[normalizedType];

    if (!requirements) return false;

    return requirements.excludeMaterials.some(excluded =>
      materialId.toLowerCase().includes(excluded.toLowerCase())
    );
  }

  /**
   * Get finish level from user message
   */
  static extractFinishLevel(message: string): 'budget' | 'mid' | 'premium' {
    const lower = message.toLowerCase();

    if (
      lower.includes('budget') ||
      lower.includes('cheap') ||
      lower.includes('basic') ||
      lower.includes('low') ||
      lower.includes('lower')
    )
      return 'budget';

    if (
      lower.includes('premium') ||
      lower.includes('luxury') ||
      lower.includes('high') ||
      lower.includes('expensive') ||
      lower.includes('top')
    )
      return 'premium';

    return 'mid';
  }

  private static normalizeProjectType(projectType: string): string {
    const type = projectType.toLowerCase();

    if (type.includes('kitchen')) return 'kitchen';
    if (type.includes('bathroom') || type.includes('toilet') || type.includes('loo'))
      return 'bathroom';
    if (type.includes('extension') || type.includes('build')) return 'extension';
    if (type.includes('loft') || type.includes('attic')) return 'loft';

    // Default to bathroom for unknown types
    return 'bathroom';
  }

  private static adjustForRoomSize(
    materialSet: MaterialSet,
    roomSize: number,
    projectType: string
  ): MaterialSet {
    // Size multipliers
    const sizeMultiplier = roomSize / 12; // 12m² is standard kitchen/bathroom

    const adjustedItems = materialSet.items.map(item => {
      let adjustedQuantity = item.quantity;

      // Only adjust certain items based on size
      if (item.category === 'finishing' || item.category === 'tiles') {
        adjustedQuantity = Math.ceil(item.quantity * sizeMultiplier);
      }

      return {
        ...item,
        quantity: adjustedQuantity,
        priceRange: {
          ...item.priceRange,
          // Recalculate total for new quantity
        },
      };
    });

    return {
      items: adjustedItems,
      totalEstimate: {
        min: Math.round(materialSet.totalEstimate.min * sizeMultiplier),
        max: Math.round(materialSet.totalEstimate.max * sizeMultiplier),
      },
    };
  }

  /**
   * Format materials for AI prompt
   */
  static formatMaterialsForPrompt(
    projectType: string,
    finishLevel: 'budget' | 'mid' | 'premium'
  ): string {
    const materials = this.getMaterialsForProject(projectType, finishLevel);

    const lines = [
      `${finishLevel.toUpperCase()} ${projectType.toUpperCase()} MATERIALS:`,
      `Total estimate: £${materials.totalEstimate.min} - £${materials.totalEstimate.max}`,
      '',
    ];

    for (const item of materials.items) {
      lines.push(
        `• ${item.name}: ${item.quantity} ${item.unit} @ £${item.priceRange.average} = £${item.quantity * item.priceRange.average}`
      );
    }

    return lines.join('\n');
  }
}
