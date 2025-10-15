import { AIMiddleware } from './AIMiddleware';
import { GeminiProvider } from './providers/GeminiProvider';
import { MockProvider } from './providers/MockProvider';
import { AnalysisRequest, ProjectAnalysis, AIMiddlewareConfig } from './types';
import { config } from '../../config';

class AIServiceClass {
  private middleware: AIMiddleware | null = null;
  private isInitialized = false;

  /**
   * Initialize the AI service with providers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🤖 Initializing AI Service...');

    // Configuration from central config
    const middlewareConfig: AIMiddlewareConfig = {
      primaryProvider: config.ai.primaryProvider,
      fallbackProviders: config.ai.fallbackProviders,
      timeoutMs: config.ai.timeoutMs,
      retryAttempts: 2,
      enableFallback: config.ai.enableFallback
    };

    // Create middleware
    this.middleware = new AIMiddleware(middlewareConfig);

    // Register providers
    await this.registerProviders();

    this.isInitialized = true;
    console.log('✅ AI Service initialized successfully');
  }

  /**
   * Register all available AI providers
   */
  private async registerProviders(): Promise<void> {
    if (!this.middleware) return;

    // Get API keys from config
    const geminiKey = config.ai.geminiApiKey;

    // Register Gemini provider if API key is available
    if (geminiKey && geminiKey !== 'your_api_key_here') {
      const geminiProvider = new GeminiProvider(geminiKey);
      this.middleware.registerProvider(geminiProvider);
      console.log('✅ Gemini provider registered');
    } else {
      console.warn('⚠️ Gemini API key not found - using fallback providers only');
    }

    // Always register mock provider as fallback
    const mockProvider = new MockProvider();
    this.middleware.registerProvider(mockProvider);
    console.log('✅ Mock provider registered as fallback');
  }

  /**
   * Analyze an image and return construction project analysis
   */
  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.middleware) {
      throw new Error('AI Service not properly initialized');
    }

    console.log(`🔍 Starting image analysis for: ${request.imageUri.substring(0, 50)}...`);

    try {
      const result = await this.middleware.analyzeImageWithValidation(request);
      
      console.log(`✅ Analysis completed: ${result.projectType} (confidence: ${result.confidence}%)`);
      
      return result;
    } catch (error) {
      console.error('❌ AI Service analysis failed:', error);
      throw error;
    }
  }

  /**
   * Quick health check of all AI providers
   */
  async healthCheck(): Promise<Record<string, any>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.middleware) {
      return { error: 'AI Service not initialized' };
    }

    return this.middleware.healthCheck();
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    if (!this.middleware) return [];
    return this.middleware.getAvailableProviders();
  }

  /**
   * Test the AI service with a sample image
   */
  async testAnalysis(): Promise<ProjectAnalysis> {
    const testRequest: AnalysisRequest = {
      imageUri: 'data:image/jpeg;base64,test', // Mock image
      additionalContext: {
        projectType: 'Kitchen Renovation',
        budgetRange: { min: 5000, max: 15000 },
        location: 'London, UK'
      }
    };

    return this.analyzeImage(testRequest);
  }

  /**
   * Enhanced analysis with user context
   */
  async analyzeImageWithContext(
    imageUri: string, 
    options: {
      projectType?: string;
      budgetMin?: number;
      budgetMax?: number;
      location?: string;
      userPreferences?: string[];
      userId?: string;
    } = {}
  ): Promise<ProjectAnalysis> {
    const request: AnalysisRequest = {
      imageUri,
      additionalContext: {
        projectType: options.projectType,
        budgetRange: options.budgetMin && options.budgetMax ? {
          min: options.budgetMin,
          max: options.budgetMax
        } : undefined,
        location: options.location,
        userPreferences: options.userPreferences
      },
      userId: options.userId
    };

    return this.analyzeImage(request);
  }

  /**
   * Batch analysis for multiple images
   */
  async analyzeBatch(requests: AnalysisRequest[]): Promise<ProjectAnalysis[]> {
    console.log(`🔍 Starting batch analysis for ${requests.length} images`);
    
    const results: ProjectAnalysis[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.analyzeImage(request);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze image: ${request.imageUri}`, error);
        // Continue with other images
      }
    }

    console.log(`✅ Batch analysis completed: ${results.length}/${requests.length} successful`);
    return results;
  }
}

// Export singleton instance
export const AIService = new AIServiceClass();
export default AIService;