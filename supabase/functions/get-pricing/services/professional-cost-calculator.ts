/**
 * Professional Cost Calculator Service
 * Implements RICS standard cost breakdown and confidence scoring
 * Used for generating professional-grade construction quotes
 */

import { ProfessionalCostCategories, ConfidenceScoring } from '../types.ts';

export interface RawCostInputs {
  materials: { name: string; cost: number; wastage?: number }[];
  labour: { trade: string; hours: number; rate: number }[];
  plantAndEquipment: { item: string; cost: number }[];
  projectScale: 'small' | 'medium' | 'large';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  location: 'london' | 'southeast' | 'southwest' | 'midlands' | 'north' | 'scotland' | 'wales';
  urgency: 'standard' | 'urgent';
}

export interface ProfessionalCostResult {
  costBreakdown: ProfessionalCostCategories;
  confidenceScore: ConfidenceScoring;
  recommendedContingency: number;
  professionalAdvice: string[];
}

/**
 * Standard industry rates and factors based on RICS guidance
 */
const PROFESSIONAL_FACTORS = {
  // Preliminaries as % of direct costs
  preliminaries: {
    small: 8, // 8% for small jobs (under £10k)
    medium: 12, // 12% for medium jobs (£10k-£50k)
    large: 15, // 15% for large jobs (over £50k)
  },

  // Overheads as % of direct costs
  overheads: {
    small: 5, // 5% for small contractors
    medium: 8, // 8% for medium contractors
    large: 10, // 10% for large contractors
  },

  // Profit margins as %
  profit: {
    competitive: 10, // 10% in competitive markets
    standard: 15, // 15% standard markup
    premium: 20, // 20% for specialist work
  },

  // Contingency factors
  contingency: {
    spring: 12, // 12% spring contingency
    summer: 8, // 8% summer (best weather)
    autumn: 15, // 15% autumn (weather risk)
    winter: 20, // 20% winter (highest risk)
  },

  // VAT rate
  vat: 0.2, // 20% UK standard VAT
};

/**
 * Calculate professional cost breakdown following RICS standards
 */
export function calculateProfessionalCosts(inputs: RawCostInputs): ProfessionalCostResult {
  // Calculate direct costs
  const materialsCost = calculateMaterialsCost(inputs.materials);
  const labourCost = calculateLabourCost(inputs.labour);
  const plantCost = calculatePlantCost(inputs.plantAndEquipment);

  const directCosts = materialsCost.total + labourCost.total + plantCost.total;

  // Calculate indirect costs based on project scale
  const preliminariesRate = PROFESSIONAL_FACTORS.preliminaries[inputs.projectScale];
  const overheadsRate = PROFESSIONAL_FACTORS.overheads[inputs.projectScale];

  const preliminaries = calculatePreliminaries(directCosts, preliminariesRate);
  const overheads = calculateOverheads(directCosts, overheadsRate);

  // Calculate profit (standard 15% for most jobs)
  const profitRate =
    inputs.urgency === 'urgent'
      ? PROFESSIONAL_FACTORS.profit.premium
      : PROFESSIONAL_FACTORS.profit.standard;
  const profit = {
    percentage: profitRate,
    amount: (directCosts + preliminaries.total + overheads.total) * (profitRate / 100),
  };

  // Calculate contingency based on season
  const contingencyRate = PROFESSIONAL_FACTORS.contingency[inputs.season];
  const contingency = calculateContingency(directCosts, contingencyRate, inputs.season);

  // Calculate subtotal and VAT
  const subtotalExVAT =
    directCosts + preliminaries.total + overheads.total + profit.amount + contingency.amount;
  const vat = {
    rate: PROFESSIONAL_FACTORS.vat,
    amount: subtotalExVAT * PROFESSIONAL_FACTORS.vat,
  };

  const grandTotal = subtotalExVAT + vat.amount;

  // Build cost breakdown
  const costBreakdown: ProfessionalCostCategories = {
    materials: materialsCost,
    labour: labourCost,
    plantAndEquipment: plantCost,
    preliminaries,
    overheads,
    profit,
    contingency,
    vat,
    subtotalExVAT,
    grandTotal,
  };

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(inputs, costBreakdown);

  // Generate professional advice
  const professionalAdvice = generateProfessionalAdvice(inputs, costBreakdown, confidenceScore);

  return {
    costBreakdown,
    confidenceScore,
    recommendedContingency: contingencyRate,
    professionalAdvice,
  };
}

/**
 * Calculate materials cost with wastage
 */
function calculateMaterialsCost(materials: { name: string; cost: number; wastage?: number }[]) {
  const subtotal = materials.reduce((sum, item) => sum + item.cost, 0);

  // Calculate weighted average wastage
  const totalWastage = materials.reduce((sum, item) => {
    const wastage = item.wastage || 0.1; // Default 10% wastage
    return sum + item.cost * wastage;
  }, 0);

  const wastagePercentage = subtotal > 0 ? (totalWastage / subtotal) * 100 : 10;

  return {
    subtotal,
    wastagePercentage,
    wastageAmount: totalWastage,
    total: subtotal + totalWastage,
  };
}

/**
 * Calculate labour costs
 */
function calculateLabourCost(labour: { trade: string; hours: number; rate: number }[]) {
  const subtotal = labour.reduce((sum, item) => sum + item.hours * item.rate, 0);
  return {
    subtotal,
    total: subtotal,
  };
}

/**
 * Calculate plant and equipment costs
 */
function calculatePlantCost(plant: { item: string; cost: number }[]) {
  const subtotal = plant.reduce((sum, item) => sum + item.cost, 0);
  return {
    subtotal,
    total: subtotal,
  };
}

/**
 * Calculate preliminaries (site setup, management, etc.)
 */
function calculatePreliminaries(directCosts: number, percentage: number) {
  const total = directCosts * (percentage / 100);

  return {
    siteSetup: total * 0.25, // 25% for site setup
    siteManagement: total * 0.35, // 35% for site management
    healthAndSafety: total * 0.15, // 15% for H&S
    insurance: total * 0.15, // 15% for insurance
    utilities: total * 0.1, // 10% for utilities
    total,
    percentage,
  };
}

/**
 * Calculate overheads
 */
function calculateOverheads(directCosts: number, percentage: number) {
  const total = directCosts * (percentage / 100);

  return {
    officeOverheads: total,
    percentage,
    total,
  };
}

/**
 * Calculate seasonal contingency
 */
function calculateContingency(directCosts: number, percentage: number, season: string) {
  const amount = directCosts * (percentage / 100);

  const weatherRiskMap = {
    spring: 'Moderate - occasional rain, unpredictable conditions',
    summer: 'Low - optimal working conditions, minimal delays',
    autumn: 'Increasing - more frequent rain, shorter daylight hours',
    winter: 'High - frost, snow risk, limited working hours',
  };

  return {
    percentage,
    amount,
    weatherRisk: weatherRiskMap[season] || 'Moderate weather risk',
    description: `${percentage}% contingency applied for ${season} project timing`,
  };
}

/**
 * Calculate confidence scoring based on multiple factors
 */
function calculateConfidenceScore(
  inputs: RawCostInputs,
  costs: ProfessionalCostCategories
): ConfidenceScoring {
  const now = new Date().toISOString();

  // Calculate individual factor scores
  const materialAvailability = calculateMaterialAvailabilityScore(inputs);
  const labourAvailability = calculateLabourAvailabilityScore(inputs);
  const priceStability = calculatePriceStabilityScore(inputs);
  const seasonalFactors = calculateSeasonalScore(inputs);
  const dataFreshness = calculateDataFreshnessScore();
  const onsAccuracy = calculateONSAccuracyScore();

  // Calculate weighted overall score
  const factors = [
    { score: materialAvailability.score, weight: 0.2 }, // 20% weight
    { score: labourAvailability.score, weight: 0.25 }, // 25% weight
    { score: priceStability.score, weight: 0.2 }, // 20% weight
    { score: seasonalFactors.score, weight: 0.15 }, // 15% weight
    { score: dataFreshness.score, weight: 0.1 }, // 10% weight
    { score: onsAccuracy.score, weight: 0.1 }, // 10% weight
  ];

  const overall = Math.round(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0)
  );

  // Generate recommendations
  const recommendations = generateConfidenceRecommendations([
    materialAvailability,
    labourAvailability,
    priceStability,
    seasonalFactors,
    dataFreshness,
    onsAccuracy,
  ]);

  return {
    overall,
    factors: {
      materialAvailability,
      labourAvailability,
      priceStability,
      seasonalFactors,
      dataFreshness,
      onsAccuracy,
    },
    recommendations,
    lastCalculated: now,
  };
}

/**
 * Calculate material availability confidence score
 */
function calculateMaterialAvailabilityScore(inputs: RawCostInputs) {
  // Base score depends on season and urgency
  let score = 80; // Base confidence

  if (inputs.season === 'spring' || inputs.season === 'summer') {
    score += 10; // Higher availability in good weather
  }

  if (inputs.urgency === 'urgent') {
    score -= 20; // Harder to source materials quickly
  }

  return {
    score: Math.min(95, Math.max(30, score)),
    description:
      score > 80
        ? 'Good material availability expected'
        : score > 60
          ? 'Moderate material availability, some delays possible'
          : 'Limited material availability, delays likely',
    impact: score < 60 ? ('high' as const) : score < 80 ? ('medium' as const) : ('low' as const),
  };
}

/**
 * Calculate labour availability confidence score
 */
function calculateLabourAvailabilityScore(inputs: RawCostInputs) {
  let score = 75; // Base confidence

  // Seasonal adjustments
  if (inputs.season === 'summer') {
    score -= 15; // High demand in summer
  } else if (inputs.season === 'winter') {
    score -= 10; // Some contractors reduce winter work
  }

  // Location adjustments
  if (inputs.location === 'london') {
    score -= 10; // High competition in London
  }

  if (inputs.urgency === 'urgent') {
    score -= 15; // Harder to book urgent labour
  }

  return {
    score: Math.min(95, Math.max(30, score)),
    description:
      score > 75
        ? 'Good labour availability'
        : score > 55
          ? 'Moderate labour availability, booking ahead recommended'
          : 'Limited labour availability, extended lead times likely',
    impact: score < 55 ? ('high' as const) : score < 75 ? ('medium' as const) : ('low' as const),
  };
}

/**
 * Calculate price stability score
 */
function calculatePriceStabilityScore(inputs: RawCostInputs) {
  let score = 85; // Base stability

  // Seasonal price volatility
  if (inputs.season === 'spring') {
    score -= 10; // Spring price increases
  }

  return {
    score,
    description: 'Material and labour prices relatively stable',
    impact: 'low' as const,
  };
}

/**
 * Calculate seasonal factors score
 */
function calculateSeasonalScore(inputs: RawCostInputs) {
  const seasonScores = {
    summer: 90, // Optimal conditions
    spring: 75, // Good conditions
    autumn: 60, // Challenging conditions
    winter: 45, // Difficult conditions
  };

  const score = seasonScores[inputs.season];

  return {
    score,
    description:
      inputs.season === 'summer'
        ? 'Excellent working conditions expected'
        : inputs.season === 'winter'
          ? 'Challenging weather conditions likely'
          : 'Moderate working conditions expected',
    impact: score < 60 ? ('high' as const) : score < 80 ? ('medium' as const) : ('low' as const),
  };
}

/**
 * Calculate data freshness score
 */
function calculateDataFreshnessScore() {
  return {
    score: 90, // Our enhanced database is recent
    description: 'Pricing data updated regularly with market rates',
    impact: 'low' as const,
  };
}

/**
 * Calculate ONS accuracy score
 */
function calculateONSAccuracyScore() {
  return {
    score: 85, // Good ONS integration
    description: 'ONS construction indices provide reliable inflation adjustments',
    impact: 'medium' as const,
  };
}

/**
 * Generate confidence improvement recommendations
 */
function generateConfidenceRecommendations(factors: any[]) {
  const recommendations: any[] = [];

  // Check each factor for improvement opportunities
  factors.forEach(factor => {
    if (factor.score < 70 && factor.impact === 'high') {
      recommendations.push({
        priority: 'high' as const,
        action: `Address ${factor.description.toLowerCase()}`,
        impact: 'Could improve quote accuracy by 10-15%',
      });
    }
  });

  // Add general recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low' as const,
      action: 'Quote confidence is good - consider getting multiple supplier quotes',
      impact: 'Could refine pricing by 3-5%',
    });
  }

  return recommendations;
}

/**
 * Generate professional advice based on cost breakdown and confidence
 */
function generateProfessionalAdvice(
  inputs: RawCostInputs,
  costs: ProfessionalCostCategories,
  confidence: ConfidenceScoring
): string[] {
  const advice: string[] = [];

  // Advice based on confidence score
  if (confidence.overall >= 85) {
    advice.push('Quote confidence is high - costs should be reliable within ±5%');
  } else if (confidence.overall >= 70) {
    advice.push('Quote confidence is good - costs should be reliable within ±10%');
  } else {
    advice.push('Quote confidence is moderate - recommend additional supplier quotes');
  }

  // Seasonal advice
  if (inputs.season === 'winter') {
    advice.push('Winter project: Allow extra time for weather delays and higher contingency');
  } else if (inputs.season === 'summer') {
    advice.push('Summer project: Book contractors early due to high seasonal demand');
  }

  // Scale advice
  if (inputs.projectScale === 'small') {
    advice.push('Small project: Consider combining with other work to reduce overhead costs');
  } else if (inputs.projectScale === 'large') {
    advice.push('Large project: Ensure adequate cash flow for staged payments');
  }

  // VAT advice
  advice.push('VAT shown separately - may be reclaimable if you are VAT registered');

  // Contingency advice
  if (costs.contingency.percentage > 15) {
    advice.push(
      `Higher contingency (${costs.contingency.percentage}%) applied due to seasonal risks`
    );
  }

  return advice;
}
