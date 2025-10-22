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
  };
  recommendations: PricingRecommendation[];
  lastUpdated: string;
  dataSource: 'average_market_data' | 'api_partnership' | 'manual_update';
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
