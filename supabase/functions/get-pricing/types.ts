/**
 * UK Construction Pricing Types
 * Based on realistic 2024 market data
 */

export interface PricingRequest {
  location: string;
  projectType: string;
  materials?: string[];
  tools?: string[];
  timeline?: string;
  projectScale?: 'small' | 'medium' | 'large';
  urgency?: 'standard' | 'urgent';
  enhanceWithONS?: boolean; // Default true - whether to use ONS-enhanced pricing
}

export interface PricingResponse {
  toolHire: ToolHireRate[];
  materials: MaterialPrice[];
  aggregates: AggregateRate[];
  labour: LabourRate[];
  contextFactors: {
    regionMultiplier: number;
    seasonalMultiplier: number;
    demandIndex: number;
    vatRate: number;
    contingencyPercentage?: number;
    weatherRisk?: string;
    // ONS-enhanced fields
    onsInflationRate?: number;
    onsIndexValue?: number;
    onsLastUpdate?: string;
    marketTrend?: 'increasing' | 'decreasing' | 'stable';
  };
  recommendations: PricingRecommendation[];
  lastUpdated: string;
  dataSource:
    | 'average_market_data'
    | 'api_partnership'
    | 'manual_update'
    | 'ons_enhanced'
    | 'ons_estimated';
}

export interface ToolHireRate {
  id: string;
  name: string;
  category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety' | 'access';
  dailyRate: number;
  weeklyRate: number;
  monthlyRate?: number;
  supplier: string;
  location?: string;
  availability: 'high' | 'medium' | 'low';
  alternatives?: string[];
  description: string;
}

export interface MaterialPrice {
  id: string;
  name: string;
  category:
    | 'structural'
    | 'finishing'
    | 'electrical'
    | 'plumbing'
    | 'insulation'
    | 'roofing'
    | 'flooring';
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  unit: string;
  supplier: string;
  wasteFactor: number; // percentage (e.g., 0.1 for 10%)
  vat: 'included' | 'excluded';
  deliveryCharge?: number;
  minimumOrder?: number;
  leadTimeDays?: number;
  // ONS-enhanced fields
  onsEnhanced?: boolean;
  onsInflationAdjustment?: number;
  lastONSUpdate?: string;
}

export interface AggregateRate {
  id: string;
  name: string;
  type: 'concrete' | 'sand' | 'gravel' | 'stone' | 'soil';
  pricePerTonne?: number;
  pricePerCubicMetre?: number;
  deliveryCharge: number;
  minimumOrder: number;
  supplier: string;
  region: string;
  // ONS-enhanced fields
  onsEnhanced?: boolean;
  onsInflationAdjustment?: number;
}

export interface LabourRate {
  id: string;
  tradeType: string;
  skillLevel: 'apprentice' | 'competent' | 'skilled' | 'expert';
  hourlyRate: {
    min: number;
    max: number;
    average: number;
  };
  dailyRate: {
    min: number;
    max: number;
    average: number;
  };
  region: string;
  inDemand: boolean;
  certificationRequired?: string[];
  // ONS-enhanced fields
  onsEnhanced?: boolean;
  onsInflationAdjustment?: number;
}

export interface PricingRecommendation {
  type: 'cost_saving' | 'quality' | 'timing' | 'supplier';
  message: string;
  priority: 'high' | 'medium' | 'low';
  potentialSaving?: number;
}

export interface RegionData {
  name: string;
  multiplier: number;
  majorCities: string[];
  averageDeliveryCharge: number;
  labourAvailability: 'high' | 'medium' | 'low';
}

export interface SeasonalFactors {
  spring: number; // March-May
  summer: number; // June-August
  autumn: number; // September-November
  winter: number; // December-February
}

export interface ContingencyFactors {
  spring: {
    percentage: number; // Base contingency %
    weatherRisk: string; // Description of weather risks
    laborAvailability: string; // Impact on labor
  };
  summer: {
    percentage: number;
    weatherRisk: string;
    laborAvailability: string;
  };
  autumn: {
    percentage: number;
    weatherRisk: string;
    laborAvailability: string;
  };
  winter: {
    percentage: number;
    weatherRisk: string;
    laborAvailability: string;
  };
}

/**
 * Professional Cost Categories - RICS Standard Structure
 * Used for detailed quote breakdowns following industry standards
 */
export interface ProfessionalCostCategories {
  // Direct costs
  materials: {
    subtotal: number;
    wastagePercentage: number;
    wastageAmount: number;
    total: number;
  };
  labour: {
    subtotal: number;
    total: number;
  };
  plantAndEquipment: {
    subtotal: number;
    total: number;
  };

  // Indirect costs
  preliminaries: {
    siteSetup: number;
    siteManagement: number;
    healthAndSafety: number;
    insurance: number;
    utilities: number;
    total: number;
    percentage: number; // % of direct costs (typically 8-15%)
  };

  overheads: {
    officeOverheads: number;
    percentage: number; // % of direct costs (typically 5-10%)
    total: number;
  };

  profit: {
    percentage: number; // % markup (typically 10-20%)
    amount: number;
  };

  contingency: {
    percentage: number; // % buffer (typically 5-15%)
    amount: number;
    weatherRisk: string;
    description: string;
  };

  vat: {
    rate: number; // UK standard 20%
    amount: number;
  };

  // Totals
  subtotalExVAT: number;
  grandTotal: number;
}

/**
 * Quote Confidence Scoring System
 * Measures reliability and accuracy of pricing estimates
 */
export interface ConfidenceScoring {
  overall: number; // 0-100 percentage score

  factors: {
    materialAvailability: {
      score: number; // 0-100
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    labourAvailability: {
      score: number;
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    priceStability: {
      score: number;
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    seasonalFactors: {
      score: number;
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    dataFreshness: {
      score: number;
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    onsAccuracy: {
      score: number;
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
  };

  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }[];

  lastCalculated: string;
}
