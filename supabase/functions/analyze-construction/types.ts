/**
 * TypeScript type definitions for analyze-construction Edge Function
 * Migrated from src/services/ai/types.ts and adapted for Deno
 */

// Core analysis types
export interface QuoteBreakdown {
  materials: {
    min: number;
    max: number;
    items: MaterialItem[];
  };
  labor: {
    min: number;
    max: number;
    hourlyRate: number;
    estimatedHours: number;
  };
  total: {
    min: number;
    max: number;
  };
}

export interface MaterialItem {
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
  category: 'structural' | 'finishing' | 'electrical' | 'plumbing' | 'other';
  marketData?: any; // Enhanced with real pricing data
}

export interface ToolRequirement {
  name: string;
  category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety';
  dailyRentalPrice: number;
  estimatedDays: number;
  required: boolean;
  alternatives?: string[];
  marketData?: any; // Enhanced with real pricing data
}

export interface ProjectAnalysis {
  projectType: string;
  description: string;
  difficultyLevel:
    | 'Easy'
    | 'Moderate'
    | 'Difficult'
    | 'Professional Required'
    | 'Information Needed'
    | 'Preliminary Estimate';

  // Response type for new conversation logic
  responseType?: 'conversation' | 'estimation' | 'quote';

  // Conversation mode fields
  questionsAsked?: string[];
  informationNeeded?: string[];

  // Estimation mode fields
  roughEstimate?: {
    min: number;
    max: number;
    caveats: string[];
  };

  // Cost breakdown
  costBreakdown: QuoteBreakdown;

  // Timeline estimates
  timeline: {
    diy: string;
    professional: string;
    phases: Array<{
      name: string;
      duration: string;
      description: string;
    }>;
  };

  // Tools and equipment
  toolsRequired: ToolRequirement[];

  // Safety and compliance
  safetyConsiderations: string[];
  permitsRequired: string[];
  requiresProfessional: boolean;
  professionalReasons?: string[];

  // Additional data
  confidence: number; // 0-100% confidence in analysis
  recommendations: string[];
  warnings?: string[];

  // Metadata
  analysisId: string;
  timestamp: string;
  aiProvider: string;
  processingTimeMs: number;
}

// Request/Response types for Edge Function
export interface AnalysisRequest {
  imageUri?: string;
  message?: string;
  context?: {
    projectType?: string;
    budgetRange?: { min: number; max: number };
    location?: string;
    userPreferences?: string[];
    preferredProvider?: 'gemini' | 'openai' | 'auto'; // User's AI provider preference
  };
  history?: Message[];
  userId?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: {
    type: 'image' | 'video' | 'pdf';
    uri: string;
    name: string;
  }[];
}

export interface AnalysisResponse {
  success: boolean;
  data?: ProjectAnalysis;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  processingTimeMs: number;
  aiProvider: string;
}

// AI Provider interfaces
export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis>;
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number }>;
}

export interface AIMiddlewareConfig {
  primaryProvider: string;
  fallbackProviders: string[];
  timeoutMs: number;
  retryAttempts: number;
  enableFallback: boolean;
}

// Pricing integration types
export interface PricingContext {
  location: {
    region: string;
    city?: string;
  };
  projectType: string;
  projectScale: 'small' | 'medium' | 'large';
  timeline?: {
    duration?: number; // days
  };
  userPreferences?: {
    priceRange?: 'budget' | 'mid' | 'premium';
    sustainability?: boolean;
    localSuppliers?: boolean;
  };
}

export interface PricingResponse {
  toolHire: Array<{
    name: string;
    dailyRate: number;
    weeklyRate: number;
    supplier: string;
    alternatives?: string[];
  }>;
  materials: Array<{
    name: string;
    priceRange: {
      min: number;
      max: number;
      average: number;
    };
    unit: string;
    supplier: string;
  }>;
  aggregates: Array<{
    name: string;
    price: number;
    unit: string;
    delivery: string;
  }>;
  labor: Array<{
    tradeType: string;
    hourlyRate: {
      min: number;
      max: number;
      average: number;
    };
    skillLevel: string;
  }>;
  contextFactors: {
    regionMultiplier: number;
    seasonalMultiplier: number;
    demandIndex: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
  }>;
  lastUpdated: string;
}
