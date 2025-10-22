/**
 * Edge Function AI Service
 * Lightweight client that delegates all AI processing to Supabase Edge Function
 * Replaces the 455-line AIMiddleware with API calls
 */

import { AnalysisRequest, ProjectAnalysis } from './types';
import { config } from '../../config';

interface AnalysisResponse {
  success: boolean;
  data?: ProjectAnalysis;
  error?: {
    message: string;
    details?: any;
  };
  processingTimeMs?: number;
  aiProvider?: string;
}

class AIServiceEdge {
  private baseUrl: string;
  private isInitialized = false;

  constructor() {
    // Use Supabase Edge Function URL
    this.baseUrl = `${config.supabase.url}/functions/v1/analyze-construction`;
  }

  /**
   * Initialize the AI service (now just validates endpoint)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Edge AI Service...');

    try {
      // Health check to validate the edge function is available
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Edge function health check failed: ${response.status}`);
      }

      const health = await response.json();
      console.log('✅ Edge AI Service initialized:', health);

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Edge AI Service:', error);
      throw error;
    }
  }

  /**
   * Analyze image using Edge Function
   * All AI processing happens server-side
   */
  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    console.log('📸 Sending analysis request to Edge Function...');

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Edge function failed: ${response.status} - ${error}`);
      }

      const result: AnalysisResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Analysis failed');
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${processingTime}ms using ${result.aiProvider}`);

      return result.data;
    } catch (error) {
      console.error('❌ Edge AI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Process chat message using Edge Function
   */
  async processChat(message: string, context?: any): Promise<ProjectAnalysis> {
    return this.analyzeImage({
      message,
      analysisType: 'chat',
      location: context?.location,
      previousAnalysis: context?.previousAnalysis,
    });
  }

  /**
   * Get available providers (from Edge Function)
   */
  async getAvailableProviders(): Promise<string[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
      });

      if (response.ok) {
        const health = await response.json();
        return health.middleware?.availableProviders || [];
      }
    } catch (error) {
      console.error('Failed to get providers:', error);
    }
    return [];
  }

  /**
   * Clean up resources (no-op for Edge Function)
   */
  cleanup(): void {
    this.isInitialized = false;
    console.log('🧹 Edge AI Service cleaned up');
  }
}

// Export singleton instance
export const AIService = new AIServiceEdge();
export default AIService;
