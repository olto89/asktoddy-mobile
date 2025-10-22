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
  difficultyLevel: 'Easy' | 'Moderate' | 'Difficult' | 'Professional Required';

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
  warnings: string[];

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
  imageUri: string;
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
  userId?: string;
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
