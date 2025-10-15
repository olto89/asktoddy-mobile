// Pricing Service Types

export interface PricingContext {
  location: {
    postcode?: string;
    region: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  projectType: string;
  projectScale: 'small' | 'medium' | 'large';
  timeline?: {
    startDate?: string;
    duration?: number; // days
  };
  userPreferences?: {
    priceRange?: 'budget' | 'mid' | 'premium';
    sustainability?: boolean;
    localSuppliers?: boolean;
  };
}

export interface MaterialPricing {
  id: string;
  name: string;
  category: 'structural' | 'finishing' | 'electrical' | 'plumbing' | 'insulation' | 'other';
  unit: string; // 'per m²', 'per linear meter', 'per unit', etc.
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  supplier?: string;
  location?: string;
  availability: 'in_stock' | 'order_required' | 'limited' | 'unavailable';
  leadTime?: number; // days
  wasteFactor: number; // percentage (e.g., 0.1 for 10%)
  lastUpdated: string;
  source: 'api' | 'manual' | 'estimated';
}

export interface ToolHirePricing {
  id: string;
  name: string;
  category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety' | 'access' | 'other';
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  deposit?: number;
  deliveryRadius?: number; // km
  supplier: string;
  location: string;
  availability: 'available' | 'limited' | 'unavailable';
  minimumHire?: number; // days
  alternatives?: string[]; // alternative tool IDs
  lastUpdated: string;
}

export interface LaborPricing {
  tradeType: 'general' | 'plumber' | 'electrician' | 'carpenter' | 'painter' | 'tiler' | 'plasterer' | 'roofer';
  skillLevel: 'apprentice' | 'skilled' | 'specialist' | 'master';
  region: string;
  hourlyRate: {
    min: number;
    max: number;
    average: number;
  };
  dayRate: {
    min: number;
    max: number;
    average: number;
  };
  availability: 'high' | 'medium' | 'low';
  demandMultiplier: number; // e.g., 1.2 for 20% higher due to demand
  seasonality?: {
    month: number;
    multiplier: number;
  }[];
  lastUpdated: string;
}

export interface AggregatePricing {
  type: 'sand' | 'gravel' | 'cement' | 'concrete' | 'mortar' | 'hardcore' | 'topsoil';
  grade?: string;
  unit: 'tonne' | 'm³' | 'bag' | 'bulk';
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  supplier: string;
  deliveryArea: string[];
  minimumOrder?: number;
  deliveryCost?: number;
  lastUpdated: string;
}

export interface PricingResponse {
  materials: MaterialPricing[];
  toolHire: ToolHirePricing[];
  labor: LaborPricing[];
  aggregates: AggregatePricing[];
  contextFactors: {
    regionMultiplier: number;
    seasonalMultiplier: number;
    demandMultiplier: number;
    accessibilityMultiplier: number;
  };
  recommendations: {
    type: 'cost_saving' | 'quality' | 'timing' | 'supplier';
    message: string;
    impact?: string; // estimated cost impact
  }[];
  lastUpdated: string;
  source: string;
}

export interface PricingConfig {
  enableRealTimeUpdates: boolean;
  cacheDurationMs: number;
  fallbackToEstimates: boolean;
  preferredSuppliers?: string[];
  maxDeliveryRadius?: number; // km
  priceVarianceThreshold: number; // alert if prices vary more than this %
}

// Enhanced types for AI integration
export interface EnhancedMaterialItem {
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
  category: string;
  // Enhanced with pricing context
  currentMarketPrice?: MaterialPricing;
  priceConfidence: 'high' | 'medium' | 'low';
  alternatives?: MaterialPricing[];
  costOptimizations?: {
    suggestion: string;
    potentialSaving: number;
  }[];
}

export interface EnhancedToolRequirement {
  name: string;
  category: string;
  dailyRentalPrice: number;
  estimatedDays: number;
  required: boolean;
  alternatives?: string[];
  // Enhanced with pricing context
  currentMarketRate?: ToolHirePricing;
  nearbySuppliers?: ToolHirePricing[];
  costOptimizations?: {
    suggestion: string;
    potentialSaving: number;
  }[];
}