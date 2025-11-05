// AI Service Types and Interfaces

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

// Enhanced Quote System for Structured Refinement
export interface StructuredQuoteBreakdown {
  projectType: string;
  totalCost: number;
  categories: Array<{
    id: string;
    name: string;
    cost: number;
    percentage: number;
    confidence: 'high' | 'medium' | 'low';
    notes?: string;
  }>;
  assumptions: string[];
  refinementSuggestions: string[];
}

export interface QuoteRefinementContext {
  projectType: string;
  currentIteration: number;
  maxIterations: number;
  userConcerns: string[];
  adjustmentsMade: Array<{
    category: string;
    change: string;
    reasoning: string;
  }>;
  validatedCategories: string[];
  finalQuote: boolean;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
  category: 'structural' | 'finishing' | 'electrical' | 'plumbing' | 'other';
}

export interface ToolRequirement {
  name: string;
  category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety';
  dailyRentalPrice: number;
  estimatedDays: number;
  required: boolean;
  alternatives?: string[];
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
  responseType?: 'conversation' | 'estimation' | 'quote';

  // Cost breakdown
  costBreakdown: QuoteBreakdown;
  roughEstimate?: {
    min: number;
    max: number;
    caveats: string[];
  };

  // Timeline estimates
  timeline: {
    diy: string;
    professional: string;
    totalDays?: number;
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
  warnings: string[];
  questionsAsked?: string[];
  informationNeeded?: string[];

  // Mobile app compatibility
  estimatedCost?: QuoteBreakdown;

  // Metadata
  analysisId: string;
  timestamp: string;
  aiProvider: string;
  processingTimeMs: number;
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AnalysisRequest {
  imageUri?: string;
  message?: string;
  additionalContext?: {
    projectType?: string;
    budgetRange?: { min: number; max: number };
    location?: string;
    userPreferences?: string[];
    // Enhanced with pricing context
    marketData?: {
      regionMultiplier?: number;
      seasonalMultiplier?: number;
      currentToolRates?: any[];
      currentMaterialRates?: any[];
    };
  };
  analysisType?: 'image' | 'chat';
  location?: string;
  previousAnalysis?: any;
  userId?: string;
}

// Extended interface for contextual analysis requests
export interface ContextualAnalysisRequest extends AnalysisRequest {
  sessionId: string;
  userId?: string;
  context?: {
    location?: string;
    city?: string;
    postcode?: string;
    region?: string;
    regionCode?: string;
    pricingMultiplier?: number;
    coordinates?: [number, number];
    projectType?: string;
    preferredProvider?: string;
  };
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

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
