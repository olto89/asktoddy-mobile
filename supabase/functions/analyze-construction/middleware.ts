/**
 * Simplified AI Middleware for Supabase Edge Functions
 * Single provider architecture - no complex fallback logic
 */

import {
  AIProvider,
  AnalysisRequest,
  ProjectAnalysis,
  PricingContext,
  PricingResponse,
} from './types.ts';
import { GeminiProvider } from './providers/gemini.ts';
import { OpenAIProvider } from './providers/openai.ts';
import { ContextManager } from './context/ContextManager.ts';
import { PricingEnhancer, EnhancementOptions } from './pricing/PricingEnhancer.ts';

export interface SimplifiedMiddlewareConfig {
  provider: 'gemini' | 'openai'; // Single provider selection
  timeoutMs: number;
  enablePricingEnhancement: boolean;
}

export class AIMiddleware {
  private provider: AIProvider | null = null;
  private config: SimplifiedMiddlewareConfig;
  private pricingEnhancer: PricingEnhancer;
  private contextManager?: ContextManager;

  constructor(config: SimplifiedMiddlewareConfig) {
    this.config = config;
    this.pricingEnhancer = new PricingEnhancer(true);
  }

  /**
   * Initialize single provider based on configuration
   */
  initializeProvider(
    geminiApiKey?: string,
    openaiApiKey?: string,
    supabaseUrl?: string,
    supabaseServiceKey?: string
  ): void {
    // Initialize context manager if credentials available
    if (supabaseUrl && supabaseServiceKey) {
      this.contextManager = new ContextManager(supabaseUrl, supabaseServiceKey);
      console.log('✅ Context manager initialized');
    }

    // Initialize the single configured provider
    switch (this.config.provider) {
      case 'gemini':
        if (!geminiApiKey || geminiApiKey === 'your_api_key_here') {
          throw new Error('Gemini API key not configured');
        }
        this.provider = new GeminiProvider(geminiApiKey, this.contextManager);
        console.log('✅ Gemini provider initialized');
        break;

      case 'openai':
        if (!openaiApiKey || openaiApiKey === 'your_api_key_here') {
          throw new Error('OpenAI API key not configured');
        }
        this.provider = new OpenAIProvider(openaiApiKey);
        console.log('✅ OpenAI provider initialized');
        break;

      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Simple health check
   */
  async healthCheck(): Promise<Record<string, any>> {
    if (!this.provider) {
      return { status: 'down', error: 'Provider not initialized' };
    }

    try {
      const health = await this.provider.healthCheck();
      return {
        provider: this.config.provider,
        ...health,
      };
    } catch (error) {
      return {
        provider: this.config.provider,
        status: 'down',
        error: error.message,
      };
    }
  }

  /**
   * Main analysis method - single provider, no fallback
   */
  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const startTime = Date.now();

    try {
      console.log(`🤖 Analyzing with ${this.config.provider}...`);
      console.log(
        `📋 Request: message="${request.message?.substring(0, 50)}...", hasImage=${!!request.imageUri}`
      );

      const result = await this.executeWithTimeout(
        this.provider.analyzeImage(request),
        this.config.timeoutMs
      );

      result.processingTimeMs = Date.now() - startTime;
      result.aiProvider = this.config.provider;

      console.log(`✅ Analysis completed in ${result.processingTimeMs}ms`);
      return result;
    } catch (error) {
      console.error(`❌ Provider ${this.config.provider} failed:`, error);
      throw new Error(`AI analysis failed: ${error?.message || error}`);
    }
  }

  /**
   * Analysis with validation and optional pricing enhancement
   */
  async analyzeImageWithValidation(request: AnalysisRequest): Promise<ProjectAnalysis> {
    console.log('🔍 Step 1: Validating request...');
    this.validateImageRequest(request);

    console.log('🔍 Step 2: Performing AI analysis...');
    let result = await this.analyzeImage(request);

    // Enhanced pricing if enabled
    if (this.config.enablePricingEnhancement && !result.pricingEnhancement) {
      console.log('💰 Step 3: Enhancing with real-time pricing...');

      try {
        const pricingContext: PricingContext = {
          projectType: result.projectType || 'general',
          location: request.context?.location || 'UK',
          includeVAT: true,
        };

        const pricingResponse = await this.pricingEnhancer.enhanceAnalysis(result, {
          includeToolHire: true,
          includeLabor: true,
          projectComplexity: result.difficultyLevel || 'moderate',
        });

        if (pricingResponse.success && pricingResponse.enhancedAnalysis) {
          result = pricingResponse.enhancedAnalysis;
          console.log('✅ Pricing enhancement successful');
        }
      } catch (error) {
        console.warn('⚠️ Pricing enhancement failed, using base analysis:', error);
      }
    }

    console.log('✅ Analysis complete with validation');
    return result;
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    return Promise.race([promise, timeout]);
  }

  /**
   * Validate image request
   */
  private validateImageRequest(request: AnalysisRequest): void {
    if (!request.imageUri && !request.message) {
      throw new Error('Either imageUri or message is required');
    }

    if (request.imageUri) {
      const validPrefixes = ['data:', 'http:', 'https:', 'file:'];
      const hasValidPrefix = validPrefixes.some(prefix => request.imageUri!.startsWith(prefix));
      if (!hasValidPrefix) {
        throw new Error('Invalid image URI format');
      }

      if (request.imageUri.startsWith('data:')) {
        const [header] = request.imageUri.split(',');
        if (!header.includes('image/') && !header.includes('application/pdf')) {
          throw new Error('Data URI must be an image or PDF');
        }
      }
    }
  }
}
