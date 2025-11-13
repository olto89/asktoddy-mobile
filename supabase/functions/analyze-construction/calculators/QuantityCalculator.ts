/**
 * Construction Quantity Calculator - ChatGPT-style Material Estimation
 *
 * Replicates ChatGPT's accurate material calculation approach:
 * 1. Step-by-step calculations with shown work
 * 2. Standard construction ratios and formulas
 * 3. Realistic waste factors and practical adjustments
 */

export interface ProjectDimensions {
  length: number;
  width: number;
  height?: number;
  floors?: number;
  roomCount?: number;
  projectType: 'extension' | 'renovation' | 'new_build' | 'conversion';
}

export interface MaterialQuantity {
  name: string;
  quantity: number;
  unit: string;
  calculation: string;
  unitPrice: number;
  totalCost: number;
  wasteFactor: number;
  category: 'structural' | 'finishing' | 'services' | 'roofing';
}

export interface QuantityCalculation {
  materials: MaterialQuantity[];
  totalCost: { min: number; max: number };
  calculations: string[];
  assumptions: string[];
}

export class ConstructionQuantityCalculator {
  /**
   * Calculate material quantities using ChatGPT-style step-by-step approach
   */
  static calculateMaterials(
    dimensions: ProjectDimensions,
    description: string,
    qualityLevel: 'budget' | 'standard' | 'premium' = 'standard'
  ): QuantityCalculation {
    const calculations: string[] = [];
    const assumptions: string[] = [];
    const materials: MaterialQuantity[] = [];

    // STEP 1: Calculate basic areas and volumes
    const floorArea = dimensions.length * dimensions.width;
    const wallHeight = dimensions.height || 2.5; // Standard ceiling height
    const perimeterLength = 2 * (dimensions.length + dimensions.width);
    const wallArea = perimeterLength * wallHeight;

    calculations.push(`Floor area: ${dimensions.length}m × ${dimensions.width}m = ${floorArea}m²`);
    calculations.push(
      `Perimeter: 2 × (${dimensions.length}m + ${dimensions.width}m) = ${perimeterLength}m`
    );
    calculations.push(`Wall area: ${perimeterLength}m × ${wallHeight}m = ${wallArea}m²`);

    // STEP 2: Adjust for openings (windows, doors)
    const openingsArea = this.estimateOpenings(floorArea, dimensions.projectType);
    const netWallArea = wallArea - openingsArea;
    calculations.push(
      `Wall area less openings: ${wallArea}m² - ${openingsArea}m² = ${netWallArea}m²`
    );
    assumptions.push(
      `Estimated ${openingsArea}m² for windows and doors based on typical ${dimensions.projectType} layouts`
    );

    // STEP 3: Calculate structural materials
    if (dimensions.projectType === 'extension') {
      // Foundation concrete
      const foundationDepth = 0.8; // Standard depth in meters
      const foundationWidth = 0.6; // Standard width
      const foundationVolume = perimeterLength * foundationWidth * foundationDepth;
      const concreteTonnes = foundationVolume * 2.4; // Concrete density

      materials.push({
        name: 'Ready Mix Concrete C25 (Foundation)',
        quantity: Math.ceil(foundationVolume),
        unit: 'm³',
        calculation: `${perimeterLength}m × 0.6m × 0.8m = ${foundationVolume.toFixed(1)}m³`,
        unitPrice: this.getUnitPrice('concrete_c25', qualityLevel),
        totalCost: Math.ceil(foundationVolume) * this.getUnitPrice('concrete_c25', qualityLevel),
        wasteFactor: 0.05,
        category: 'structural',
      });

      // Bricks for cavity walls
      const bricksPerSqm = 120; // Including 10% waste
      const totalBricks = Math.ceil(netWallArea * bricksPerSqm);

      materials.push({
        name: 'Engineering Bricks',
        quantity: totalBricks,
        unit: 'bricks',
        calculation: `${netWallArea.toFixed(1)}m² × 120 bricks/m² = ${totalBricks} bricks`,
        unitPrice: this.getUnitPrice('engineering_brick', qualityLevel),
        totalCost: totalBricks * this.getUnitPrice('engineering_brick', qualityLevel),
        wasteFactor: 0.1,
        category: 'structural',
      });

      calculations.push(
        `Foundation concrete: ${perimeterLength}m × 0.6m × 0.8m = ${foundationVolume.toFixed(1)}m³`
      );
      calculations.push(
        `Bricks needed: ${netWallArea.toFixed(1)}m² × 120/m² = ${totalBricks} bricks`
      );

      // Cement for mortar
      const cementBags = Math.ceil(totalBricks / 1000); // 1 bag per 1000 bricks
      materials.push({
        name: 'Cement 25kg (Mortar)',
        quantity: cementBags,
        unit: 'bags',
        calculation: `${totalBricks} bricks ÷ 1000 = ${cementBags} bags`,
        unitPrice: this.getUnitPrice('cement_25kg', qualityLevel),
        totalCost: cementBags * this.getUnitPrice('cement_25kg', qualityLevel),
        wasteFactor: 0.05,
        category: 'structural',
      });
    }

    // STEP 4: Calculate finishing materials

    // Plasterboard for internal walls
    const plasterboardSheetArea = 2.88; // 2.4m × 1.2m standard sheet
    const plasterboardSheets = Math.ceil((netWallArea * 1.15) / plasterboardSheetArea); // 15% waste

    materials.push({
      name: 'Plasterboard 12.5mm (2400x1200)',
      quantity: plasterboardSheets,
      unit: 'sheets',
      calculation: `${netWallArea.toFixed(1)}m² × 1.15 waste ÷ 2.88m² per sheet = ${plasterboardSheets} sheets`,
      unitPrice: this.getUnitPrice('plasterboard_12_5mm', qualityLevel),
      totalCost: plasterboardSheets * this.getUnitPrice('plasterboard_12_5mm', qualityLevel),
      wasteFactor: 0.15,
      category: 'finishing',
    });

    // Paint for walls and ceilings (2 coats needed)
    const paintableArea = netWallArea + floorArea; // Walls + ceiling
    const paintCoverage = 6; // m² per litre for 2 coats (was 12, too optimistic)
    const paintLitres = Math.ceil(paintableArea / paintCoverage);
    const paintTins = Math.max(2, Math.ceil(paintLitres / 10)); // Minimum 2 tins for any room

    materials.push({
      name: 'Emulsion Paint (10L)',
      quantity: paintTins,
      unit: 'tins',
      calculation: `(${netWallArea.toFixed(1)}m² walls + ${floorArea}m² ceiling) ÷ 6m²/L (2 coats) = ${paintLitres}L = ${paintTins} tins`,
      unitPrice: this.getUnitPrice('emulsion_paint_10l', qualityLevel),
      totalCost: paintTins * this.getUnitPrice('emulsion_paint_10l', qualityLevel),
      wasteFactor: 0.05,
      category: 'finishing',
    });

    // Floor tiles
    const tileArea = floorArea * 1.1; // 10% waste
    materials.push({
      name: 'Ceramic Floor Tiles',
      quantity: Math.ceil(tileArea),
      unit: 'm²',
      calculation: `${floorArea}m² × 1.1 waste factor = ${tileArea.toFixed(1)}m²`,
      unitPrice: this.getUnitPrice('ceramic_tiles_m2', qualityLevel),
      totalCost: Math.ceil(tileArea) * this.getUnitPrice('ceramic_tiles_m2', qualityLevel),
      wasteFactor: 0.1,
      category: 'finishing',
    });

    calculations.push(
      `Plasterboard: ${netWallArea.toFixed(1)}m² ÷ 2.88m² per sheet = ${plasterboardSheets} sheets`
    );
    calculations.push(`Paint coverage: ${paintableArea.toFixed(1)}m² ÷ 12m²/L = ${paintLitres}L`);
    calculations.push(`Floor tiles: ${floorArea}m² + 10% waste = ${tileArea.toFixed(1)}m²`);

    // STEP 5: Calculate electrical and plumbing estimates
    if (this.needsServices(description)) {
      const socketCount = Math.max(4, Math.floor(floorArea / 4)); // Min 4, or 1 per 4m²
      const lightingPoints = Math.max(2, Math.floor(floorArea / 8)); // Min 2, or 1 per 8m²

      materials.push({
        name: '13A Socket Outlets',
        quantity: socketCount,
        unit: 'units',
        calculation: `${floorArea}m² ÷ 4m² per socket = ${socketCount} sockets`,
        unitPrice: this.getUnitPrice('socket_13a', qualityLevel),
        totalCost: socketCount * this.getUnitPrice('socket_13a', qualityLevel),
        wasteFactor: 0.05,
        category: 'services',
      });

      // Cable calculation (rough estimate)
      const cableLength = Math.ceil(perimeterLength * 1.5 + floorArea * 0.5); // Perimeter + distribution
      materials.push({
        name: 'Twin & Earth Cable 2.5mm',
        quantity: cableLength,
        unit: 'metres',
        calculation: `${perimeterLength}m perimeter × 1.5 + ${floorArea}m² × 0.5 = ${cableLength}m`,
        unitPrice: this.getUnitPrice('cable_twin_earth', qualityLevel),
        totalCost: cableLength * this.getUnitPrice('cable_twin_earth', qualityLevel),
        wasteFactor: 0.2,
        category: 'services',
      });

      calculations.push(`Electrical sockets: ${floorArea}m² ÷ 4 = ${socketCount} sockets`);
      calculations.push(`Cable estimate: ${cableLength}m for circuits and distribution`);
    }

    // STEP 6: Calculate totals
    let totalMin = 0;
    let totalMax = 0;

    materials.forEach(material => {
      const costWithWaste = material.totalCost * (1 + material.wasteFactor);
      totalMin += costWithWaste * 0.9; // 10% price variation
      totalMax += costWithWaste * 1.1;
    });

    // Add VAT
    totalMin *= 1.2;
    totalMax *= 1.2;

    assumptions.push('Prices include 10% price variation and 20% VAT');
    assumptions.push('Standard waste factors applied based on material type');
    assumptions.push(`Quality level: ${qualityLevel} (affects material specifications)`);

    return {
      materials,
      totalCost: { min: Math.round(totalMin), max: Math.round(totalMax) },
      calculations,
      assumptions,
    };
  }

  /**
   * Estimate openings area based on project type
   */
  private static estimateOpenings(floorArea: number, projectType: string): number {
    const ratios = {
      extension: 0.15, // 15% of wall area for windows/doors
      renovation: 0.12, // 12% - existing openings
      new_build: 0.18, // 18% - more generous openings
      conversion: 0.1, // 10% - limited new openings
    };

    const ratio = ratios[projectType] || 0.15;
    return floorArea * ratio * 2.5; // Approximate based on floor area
  }

  /**
   * Check if services are needed based on description
   */
  private static needsServices(description: string): boolean {
    const serviceKeywords = ['electrical', 'socket', 'lighting', 'plumbing', 'kitchen', 'bathroom'];
    return serviceKeywords.some(keyword => description.toLowerCase().includes(keyword));
  }

  /**
   * Get unit prices based on quality level
   */
  private static getUnitPrice(materialType: string, qualityLevel: string): number {
    const prices = {
      concrete_c25: { budget: 120, standard: 140, premium: 160 },
      engineering_brick: { budget: 0.55, standard: 0.65, premium: 0.85 },
      cement_25kg: { budget: 4.2, standard: 4.95, premium: 5.8 },
      plasterboard_12_5mm: { budget: 8.5, standard: 10.25, premium: 12.0 },
      emulsion_paint_10l: { budget: 35, standard: 48, premium: 65 },
      ceramic_tiles_m2: { budget: 15, standard: 28, premium: 45 },
      socket_13a: { budget: 3.2, standard: 5.85, premium: 8.5 },
      cable_twin_earth: { budget: 1.85, standard: 2.15, premium: 2.45 },
    };

    return prices[materialType]?.[qualityLevel] || 0;
  }
}

/**
 * Create ChatGPT-style prompt with calculated quantities
 */
export function createQuantityBasedPrompt(
  projectDescription: string,
  dimensions: ProjectDimensions,
  qualityLevel: 'budget' | 'standard' | 'premium' = 'standard'
): string {
  const calculation = ConstructionQuantityCalculator.calculateMaterials(
    dimensions,
    projectDescription,
    qualityLevel
  );

  return `PROFESSIONAL QUANTITY SURVEYOR ANALYSIS

You are a construction expert. I have ALREADY CALCULATED all material quantities using professional methods. Your job is to use these exact figures and provide labor/timeline estimates.

PROJECT: ${projectDescription}
DIMENSIONS: ${dimensions.length}m × ${dimensions.width}m (${dimensions.length * dimensions.width}m²)

⚠️ CRITICAL: Use EXACTLY these pre-calculated material quantities. Do NOT change them:

${calculation.materials
  .map(m => `${m.name}: ${m.quantity} ${m.unit} @ £${m.unitPrice} = £${m.totalCost}`)
  .join('\n')}

MATERIAL TOTAL: £${calculation.totalCost.min} - £${calculation.totalCost.max}

CALCULATION PROOF:
${calculation.calculations.join('\n')}

YOUR TASK: Return this EXACT JSON structure with the PRE-CALCULATED materials:

{
  "responseType": "quote",
  "projectType": "${dimensions.projectType} (${dimensions.length}×${dimensions.width}m)",
  "description": "Detailed analysis with pre-calculated quantities",
  "costBreakdown": {
    "materials": {
      "total": {"min": ${calculation.totalCost.min}, "max": ${calculation.totalCost.max}},
      "items": [
${calculation.materials
  .map(
    m =>
      `        {"name": "${m.name}", "quantity": ${m.quantity}, "unit": "${m.unit}", "unitPrice": ${m.unitPrice}, "totalCost": ${m.totalCost}}`
  )
  .join(',\n')}
      ]
    },
    "labor": {"min": [calculate based on 5-10 days work], "max": [calculate], "hourlyRate": 35, "estimatedHours": [calculate]},
    "total": {"min": [materials + labor min], "max": [materials + labor max]}
  },
  "timeline": {"professional": "[estimate timeline]"},
  "confidence": 90,
  "calculations": {
    "methodology": "Professional quantity surveying with industry-standard ratios",
    "assumptions": ["${calculation.assumptions.join('", "')}"]
  }
}

REMEMBER: The material quantities are FINAL. Only calculate labor and combine totals.`;
}
