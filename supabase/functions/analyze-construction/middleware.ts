/**
 * AI Middleware for Supabase Edge Functions
 * Migrated from src/services/ai/AIMiddleware.ts and adapted for Deno
 */

import {
  AIProvider,
  AIMiddlewareConfig,
  AnalysisRequest,
  ProjectAnalysis,
  PricingContext,
  PricingResponse,
} from './types.ts';
import { GeminiProvider } from './providers/gemini.ts';
import { OpenAIProvider } from './providers/openai.ts';
import { MockProvider } from './providers/mock.ts';

export class AIMiddleware {
  private providers: Map<string, AIProvider> = new Map();
  private config: AIMiddlewareConfig;

  constructor(config: AIMiddlewareConfig) {
    this.config = config;
  }

  /**
   * Initialize providers with API keys from environment
   */
  initializeProviders(geminiApiKey: string, openaiApiKey?: string): void {
    // Register Gemini provider if API key is available
    if (geminiApiKey && geminiApiKey !== 'your_api_key_here') {
      const geminiProvider = new GeminiProvider(geminiApiKey);
      this.registerProvider(geminiProvider);
      console.log('✅ Gemini provider registered');
    }

    // Register OpenAI provider if API key is available
    if (openaiApiKey && openaiApiKey !== 'your_api_key_here' && openaiApiKey.length > 20) {
      // Default to cost-effective gpt-4o-mini model
      const openaiProvider = new OpenAIProvider(openaiApiKey, 'gpt-4o-mini');
      this.registerProvider(openaiProvider);
      console.log('✅ OpenAI provider registered');
    } else {
      console.log('⚠️ OpenAI provider not configured - API key missing');
    }

    // Always register mock provider as fallback
    const mockProvider = new MockProvider();
    this.registerProvider(mockProvider);

    console.log(`✅ AI Middleware initialized with ${this.providers.size} providers`);
  }

  /**
   * Register an AI provider with the middleware
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`✅ AI Provider registered: ${provider.name}`);
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Main analysis method - handles provider selection and fallback
   */
  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    const startTime = Date.now();

    // Try primary provider first
    const primaryProvider = this.providers.get(this.config.primaryProvider);
    if (primaryProvider) {
      try {
        console.log(`🤖 Attempting analysis with primary provider: ${this.config.primaryProvider}`);
        const result = await this.executeWithTimeout(
          primaryProvider.analyzeImage(request),
          this.config.timeoutMs
        );

        result.processingTimeMs = Date.now() - startTime;
        result.aiProvider = primaryProvider.name;

        console.log(
          `✅ Analysis completed with ${primaryProvider.name} in ${result.processingTimeMs}ms`
        );
        return result;
      } catch (error) {
        console.warn(`❌ Primary provider ${this.config.primaryProvider} failed:`, error);

        if (!this.config.enableFallback) {
          throw new Error(`Primary AI provider failed: ${error}`);
        }
      }
    }

    // Try fallback providers
    if (this.config.enableFallback) {
      for (const fallbackName of this.config.fallbackProviders) {
        const fallbackProvider = this.providers.get(fallbackName);
        if (!fallbackProvider) continue;

        try {
          console.log(`🔄 Attempting fallback with: ${fallbackName}`);
          const result = await this.executeWithTimeout(
            fallbackProvider.analyzeImage(request),
            this.config.timeoutMs
          );

          result.processingTimeMs = Date.now() - startTime;
          result.aiProvider = fallbackProvider.name;
          result.warnings = result.warnings || [];
          result.warnings.push(`Analysis completed using fallback provider: ${fallbackName}`);

          console.log(`✅ Fallback analysis completed with ${fallbackName}`);
          return result;
        } catch (error) {
          console.warn(`❌ Fallback provider ${fallbackName} failed:`, error);
          continue;
        }
      }
    }

    // All providers failed
    throw new Error('All AI providers failed to analyze the image');
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        results[name] = health;
      } catch (error) {
        results[name] = {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return results;
  }

  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Validate image before processing
   */
  private validateImageRequest(request: AnalysisRequest): void {
    if (!request.imageUri && !request.message) {
      throw new Error('Either imageUri or message is required');
    }

    if (request.imageUri) {
      // Check if it's a valid URI format
      if (!request.imageUri.startsWith('data:') && !request.imageUri.startsWith('http')) {
        throw new Error('Invalid image URI format');
      }
    }
  }

  /**
   * Determine the best provider based on request characteristics
   */
  private selectOptimalProvider(request: AnalysisRequest): string {
    // If user has specified a preference, respect it
    if (request.context?.preferredProvider) {
      const preferred = request.context.preferredProvider;
      if (this.providers.has(preferred)) {
        console.log(`🎯 Using user-preferred provider: ${preferred}`);
        return preferred;
      }
      console.log(`⚠️ Preferred provider ${preferred} not available, using default`);
    }

    // Smart selection based on request type
    const hasImage = !!request.imageUri;
    const hasLongHistory = request.history && request.history.length > 6;
    const isComplexProject =
      request.context?.projectType?.toLowerCase().includes('extension') ||
      request.context?.projectType?.toLowerCase().includes('renovation');

    // Provider selection logic
    if (hasImage && !hasLongHistory) {
      // Gemini excels at image analysis
      if (this.providers.has('gemini')) {
        console.log('🎯 Selected Gemini for image analysis');
        return 'gemini';
      }
    }

    if (hasLongHistory || isComplexProject) {
      // OpenAI better for complex conversations
      if (this.providers.has('openai')) {
        console.log('🎯 Selected OpenAI for complex analysis');
        return 'openai';
      }
    }

    // Default to Gemini (cheaper and faster)
    if (this.providers.has('gemini')) {
      return 'gemini';
    }

    // Fallback to any available provider
    return this.config.primaryProvider;
  }

  /**
   * Enhanced analysis with validation, preprocessing, and context-aware pricing
   */
  async analyzeImageWithValidation(request: AnalysisRequest): Promise<ProjectAnalysis> {
    // Validate request
    this.validateImageRequest(request);

    // Select optimal provider for this request
    const selectedProvider = this.selectOptimalProvider(request);

    // Update config to use selected provider
    const originalPrimary = this.config.primaryProvider;
    this.config.primaryProvider = selectedProvider;

    // Get pricing context from request
    const pricingContext = this.createPricingContext(request);

    // Fetch current pricing data (call get-pricing Edge Function)
    let pricingData: PricingResponse | null = null;
    try {
      console.log('💰 Fetching current market pricing...');
      pricingData = await this.fetchPricingData(pricingContext);
      console.log('✅ Pricing data retrieved successfully');
    } catch (error) {
      console.warn('⚠️ Failed to fetch pricing data, continuing with AI analysis only:', error);
    }

    // Add analysis ID and timestamp
    const enhancedRequest: AnalysisRequest = {
      ...request,
      context: {
        ...request.context,
        // Add pricing context to help AI make better estimates
        marketData: pricingData
          ? {
              regionMultiplier: pricingData.contextFactors.regionMultiplier,
              seasonalMultiplier: pricingData.contextFactors.seasonalMultiplier,
              currentToolRates: pricingData.toolHire.slice(0, 3), // Top 3 tools
              currentMaterialRates: pricingData.materials.slice(0, 3), // Top 3 materials
            }
          : undefined,
      },
    };

    try {
      let result = await this.analyzeImage(enhancedRequest);

      // Add analysis metadata
      result.analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      result.timestamp = new Date().toISOString();

      // Enhance result with pricing data if available
      if (pricingData) {
        result = await this.enhanceWithPricingData(result, pricingData);
      }

      // Validate result completeness
      this.validateAnalysisResult(result);

      // Restore original config
      this.config.primaryProvider = originalPrimary;

      return result;
    } catch (error) {
      console.error('Analysis failed:', error);

      // Restore original config
      this.config.primaryProvider = originalPrimary;

      // Return fallback analysis for better UX
      return this.generateFallbackAnalysis(request, error);
    }
  }

  /**
   * Fetch pricing data from get-pricing Edge Function
   */
  private async fetchPricingData(context: PricingContext): Promise<PricingResponse | null> {
    try {
      // In Edge Function environment, we can call other functions directly
      // For now, return mock data - this will be replaced with actual call to get-pricing function
      return {
        toolHire: [
          { name: 'SDS Drill', dailyRate: 25.0, weeklyRate: 100.0, supplier: 'HSS Hire' },
          { name: 'Angle Grinder', dailyRate: 15.0, weeklyRate: 60.0, supplier: 'Local Hire' },
        ],
        materials: [
          {
            name: 'Cement (25kg)',
            priceRange: { min: 4.0, max: 5.0, average: 4.5 },
            unit: 'bag',
            supplier: 'Screwfix',
          },
        ],
        aggregates: [
          { name: 'Ready Mix Concrete', price: 120.0, unit: 'm³', delivery: 'Included' },
        ],
        labor: [
          {
            tradeType: 'general',
            hourlyRate: { min: 30, max: 40, average: 35 },
            skillLevel: 'Basic',
          },
        ],
        contextFactors: {
          regionMultiplier: context.location.region.toLowerCase().includes('london') ? 1.25 : 1.0,
          seasonalMultiplier: 1.05,
          demandIndex: 0.85,
        },
        recommendations: [
          { type: 'cost', message: 'Consider bulk purchasing for materials to reduce costs' },
        ],
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Failed to fetch pricing data:', error);
      return null;
    }
  }

  /**
   * Create pricing context from analysis request
   */
  private createPricingContext(request: AnalysisRequest): PricingContext {
    const context = request.context;

    return {
      location: {
        region: this.extractRegion(context?.location || 'UK'),
        city: context?.location,
      },
      projectType: context?.projectType || 'General Construction',
      projectScale: this.determineProjectScale(context?.budgetRange),
      timeline: context?.budgetRange
        ? {
            duration: 14, // Default 2 weeks
          }
        : undefined,
      userPreferences: {
        priceRange: this.determinePriceRange(context?.budgetRange),
        sustainability: false,
        localSuppliers: true,
      },
    };
  }

  /**
   * Extract UK region from location string
   */
  private extractRegion(location: string): string {
    const regionMap: Record<string, string> = {
      london: 'London',
      birmingham: 'West Midlands',
      manchester: 'North West',
      liverpool: 'North West',
      leeds: 'Yorkshire',
      sheffield: 'Yorkshire',
      bristol: 'South West',
      cardiff: 'Wales',
      edinburgh: 'Scotland',
      glasgow: 'Scotland',
      belfast: 'Northern Ireland',
      newcastle: 'North East',
    };

    const locationLower = location.toLowerCase();
    for (const [city, region] of Object.entries(regionMap)) {
      if (locationLower.includes(city)) {
        return region;
      }
    }

    // Default fallback based on common terms
    if (locationLower.includes('scotland')) return 'Scotland';
    if (locationLower.includes('wales')) return 'Wales';
    if (locationLower.includes('north')) return 'North West';
    if (locationLower.includes('south')) return 'South East';

    return 'South East'; // Default to South East
  }

  /**
   * Determine project scale from budget range
   */
  private determineProjectScale(budgetRange?: {
    min: number;
    max: number;
  }): 'small' | 'medium' | 'large' {
    if (!budgetRange) return 'medium';

    const avgBudget = (budgetRange.min + budgetRange.max) / 2;

    if (avgBudget < 5000) return 'small';
    if (avgBudget < 25000) return 'medium';
    return 'large';
  }

  /**
   * Determine price range preference from budget
   */
  private determinePriceRange(budgetRange?: {
    min: number;
    max: number;
  }): 'budget' | 'mid' | 'premium' {
    if (!budgetRange) return 'mid';

    const avgBudget = (budgetRange.min + budgetRange.max) / 2;

    if (avgBudget < 8000) return 'budget';
    if (avgBudget < 20000) return 'mid';
    return 'premium';
  }

  /**
   * Enhance AI analysis result with real pricing data
   */
  private async enhanceWithPricingData(
    analysis: ProjectAnalysis,
    pricingData: PricingResponse
  ): Promise<ProjectAnalysis> {
    console.log('💰 Enhancing analysis with current market pricing...');

    // Update material costs with real market data
    if (analysis.costBreakdown.materials.items) {
      analysis.costBreakdown.materials.items = analysis.costBreakdown.materials.items.map(item => {
        const marketData = pricingData.materials.find(
          m =>
            m.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(m.name.toLowerCase())
        );

        if (marketData) {
          return {
            ...item,
            unitPrice: marketData.priceRange.average,
            totalPrice: marketData.priceRange.average * (parseInt(item.quantity) || 1),
            marketData: marketData,
          };
        }
        return item;
      });
    }

    // Update tool rental prices with real market data
    analysis.toolsRequired = analysis.toolsRequired.map(tool => {
      const marketData = pricingData.toolHire.find(
        t =>
          t.name.toLowerCase().includes(tool.name.toLowerCase()) ||
          tool.name.toLowerCase().includes(t.name.toLowerCase())
      );

      if (marketData) {
        return {
          ...tool,
          dailyRentalPrice: marketData.dailyRate,
          marketData: marketData,
          alternatives: marketData.alternatives,
        };
      }
      return tool;
    });

    // Update labor rates with real market data
    const marketLaborRate =
      pricingData.labor.find(l => l.tradeType === 'general')?.hourlyRate.average || 35;
    analysis.costBreakdown.labor.hourlyRate = marketLaborRate;

    // Recalculate totals with market-adjusted pricing
    const newMaterialsTotal =
      analysis.costBreakdown.materials.items?.reduce((sum, item) => sum + item.totalPrice, 0) ||
      analysis.costBreakdown.materials.min;

    const newLaborTotal =
      analysis.costBreakdown.labor.hourlyRate * analysis.costBreakdown.labor.estimatedHours;

    analysis.costBreakdown.materials.min = Math.round(newMaterialsTotal * 0.9);
    analysis.costBreakdown.materials.max = Math.round(newMaterialsTotal * 1.2);
    analysis.costBreakdown.labor.min = Math.round(newLaborTotal * 0.9);
    analysis.costBreakdown.labor.max = Math.round(newLaborTotal * 1.1);
    analysis.costBreakdown.total.min =
      analysis.costBreakdown.materials.min + analysis.costBreakdown.labor.min;
    analysis.costBreakdown.total.max =
      analysis.costBreakdown.materials.max + analysis.costBreakdown.labor.max;

    // Add pricing-based recommendations
    analysis.recommendations = [
      ...analysis.recommendations,
      ...pricingData.recommendations.map(rec => rec.message),
    ];

    // Add market context to warnings if prices are volatile
    if (pricingData.contextFactors.regionMultiplier > 1.15) {
      analysis.warnings = analysis.warnings || [];
      analysis.warnings.push(
        `Regional pricing is ${Math.round((pricingData.contextFactors.regionMultiplier - 1) * 100)}% above national average`
      );
    }

    console.log('✅ Analysis enhanced with current market pricing');
    return analysis;
  }

  /**
   * Validate that the analysis result has required fields
   */
  private validateAnalysisResult(result: ProjectAnalysis): void {
    const requiredFields = ['projectType', 'difficultyLevel', 'costBreakdown'];
    const missingFields = requiredFields.filter(field => !result[field as keyof ProjectAnalysis]);

    if (missingFields.length > 0) {
      throw new Error(`Analysis result missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Generate a fallback analysis when all AI providers fail
   */
  private generateFallbackAnalysis(request: AnalysisRequest, error: any): ProjectAnalysis {
    console.log('🔄 Generating fallback analysis due to AI provider failure');

    return {
      projectType: 'General Construction Project',
      description:
        'Unable to perform detailed AI analysis. Please contact a professional for accurate assessment.',
      difficultyLevel: 'Professional Required',

      costBreakdown: {
        materials: { min: 500, max: 2000, items: [] },
        labor: { min: 800, max: 3000, hourlyRate: 40, estimatedHours: 20 },
        total: { min: 1300, max: 5000 },
      },

      timeline: {
        diy: '1-2 weeks',
        professional: '3-5 days',
        phases: [
          {
            name: 'Assessment',
            duration: '1 day',
            description: 'Professional assessment required',
          },
          { name: 'Planning', duration: '1-2 days', description: 'Project planning and permits' },
          { name: 'Execution', duration: '2-3 days', description: 'Main construction work' },
        ],
      },

      toolsRequired: [
        {
          name: 'Basic Hand Tools',
          category: 'hand_tools',
          dailyRentalPrice: 25,
          estimatedDays: 3,
          required: true,
        },
      ],

      safetyConsiderations: [
        'Professional assessment recommended',
        'Ensure proper safety equipment',
        'Check local building codes',
      ],

      permitsRequired: ['Building permit may be required'],
      requiresProfessional: true,
      professionalReasons: ['AI analysis unavailable - professional assessment needed'],

      confidence: 20,
      recommendations: [
        'Contact local contractors for detailed quotes',
        'Consider multiple professional opinions',
        'Ensure all work meets local building codes',
      ],

      warnings: [
        'AI analysis failed - estimates are generic',
        'Professional consultation strongly recommended',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],

      analysisId: `fallback_${Date.now()}`,
      timestamp: new Date().toISOString(),
      aiProvider: 'fallback',
      processingTimeMs: 0,
    };
  }
}
