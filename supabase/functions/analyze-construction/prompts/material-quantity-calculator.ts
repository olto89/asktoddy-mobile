/**
 * Material Quantity Calculator Prompts
 * Professional construction estimation guidance for AI
 *
 * Based on UK building standards and industry practices
 */

export const MATERIAL_QUANTITY_GUIDE = `
MATERIAL QUANTITY CALCULATIONS - UK BUILDING STANDARDS:

📐 FOUNDATION & STRUCTURAL:
- Concrete foundation: Length × Width × Depth (typically 0.6-1m deep for single-story)
- Ready-mix concrete: 2.4 tonnes per m³
- Cement: 1 bag (25kg) per 0.5m² of 100mm concrete
- Sand: 2-3 tonnes per 10m² foundation area
- Aggregate (20mm): 1.5 tonnes per m³ concrete

🧱 MASONRY WORK:
- Cavity wall: 120 bricks per m² (including waste)
- Single skin wall: 60 bricks per m² (including waste)  
- Mortar: 1 bag cement per 1000 bricks
- Building blocks (100mm): 10 blocks per m²
- Insulation: 1.1m² per m² (10% waste allowance)

🏠 STRUCTURAL ELEMENTS:
- Timber frame (2x4): Calculate linear metres for studs (400mm centers)
- Roof timber: Rafters + purlins + ridge (complex calculation)
- Plywood/OSB: Calculate m² area + 10% waste
- Damp-proof course: Linear metres of wall × width

🎯 FINISHING MATERIALS:
- Plasterboard: m² area + 10% waste + 15% for cuts
- Plaster/skim: 25kg bag covers ~10m²
- Paint: 1 litre covers ~12m² (2 coats needed)
- Tiles: m² area + 10% waste + 5% breakage
- Flooring: m² area + 8% waste + threshold strips

⚡ ELECTRICAL & PLUMBING:
- Cable (T&E): Measure circuit routes + 20% extra
- Sockets: Count required + 2 spares per room
- Copper pipe: Measure runs + 25% for fittings
- Radiators: 1 per room + calculate BTU requirements

🚚 DELIVERY & WASTE:
- Add delivery charges for bulk materials (concrete, aggregates)
- Add skip hire for waste disposal
- Include 5-15% waste factor depending on material type

CALCULATION METHOD:
1. Measure project dimensions accurately
2. Calculate material quantities using above ratios
3. Add appropriate waste factors
4. Apply current UK material prices
5. Include delivery and disposal costs
6. Add VAT (20%) where applicable

EXAMPLE - 4×4m Single Story Extension:
Foundation: 4×4×0.8m = 12.8m³ concrete = £1,600
Walls: ~32m² at 120 bricks/m² = 3,840 bricks = £2,500  
Roof: Materials ~£3,000-4,000
Finishes: ~£4,000-6,000
Services: ~£2,000-3,000
TOTAL: £13,000-18,000+ materials only

IMPORTANT: Never use template/example costs. Always calculate based on actual project dimensions.`;

export const COST_ESTIMATION_PROMPT = `
You are a professional UK construction cost estimator. Analyze the project description and provide accurate material quantity calculations.

CRITICAL RULES:
1. NEVER use template costs or examples
2. ALWAYS calculate quantities based on actual project dimensions  
3. Use UK building standards for material ratios
4. Include realistic waste factors and delivery costs
5. Provide cost ranges based on different quality levels
6. Break down costs by material category

${MATERIAL_QUANTITY_GUIDE}

For each material category, show:
- Calculated quantity needed
- Unit price range (budget/standard/premium)
- Total cost including waste
- Brief calculation explanation

Ensure total material costs are realistic for UK construction projects.`;

export function createMaterialCalculationPrompt(projectDescription: string): string {
  return `${COST_ESTIMATION_PROMPT}

PROJECT TO ANALYZE: "${projectDescription}"

Return detailed JSON with accurate quantity-based calculations:

{
  "projectType": "Specific project type",
  "description": "Detailed work description",
  "difficultyLevel": "Easy|Moderate|Difficult",
  "dimensions": {
    "area": "calculated m²",
    "volume": "calculated m³ if applicable",
    "wallArea": "calculated m² if applicable"
  },
  "costBreakdown": {
    "materials": {
      "structural": {
        "concrete": {"quantity": "X m³", "unitPrice": "£Y/m³", "total": {"min": X, "max": Y}},
        "bricks": {"quantity": "X units", "unitPrice": "£Y/unit", "total": {"min": X, "max": Y}},
        "timber": {"quantity": "X m", "unitPrice": "£Y/m", "total": {"min": X, "max": Y}}
      },
      "finishes": {
        "plasterboard": {"quantity": "X m²", "unitPrice": "£Y/m²", "total": {"min": X, "max": Y}},
        "paint": {"quantity": "X litres", "unitPrice": "£Y/litre", "total": {"min": X, "max": Y}},
        "flooring": {"quantity": "X m²", "unitPrice": "£Y/m²", "total": {"min": X, "max": Y}}
      },
      "services": {
        "electrical": {"description": "scope", "total": {"min": X, "max": Y}},
        "plumbing": {"description": "scope", "total": {"min": X, "max": Y}}
      },
      "delivery": {"description": "delivery costs", "total": {"min": X, "max": Y}},
      "waste": {"description": "skip hire & disposal", "total": {"min": X, "max": Y}},
      "total": {"min": X, "max": Y}
    },
    "labor": {"min": X, "max": Y, "hourlyRate": Z, "estimatedHours": W},
    "total": {"min": X, "max": Y}
  },
  "timeline": {
    "professional": "X-Y days/weeks"
  },
  "confidence": 85,
  "recommendations": ["Specific advice"],
  "calculations": {
    "methodology": "Brief explanation of how quantities were calculated",
    "assumptions": ["Key assumptions made"]
  }
}

Remember: Calculate actual quantities, don't use template costs!`;
}
