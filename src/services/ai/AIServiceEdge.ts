/**
 * Edge Function AI Service
 * Lightweight client that delegates all AI processing to Supabase Edge Function
 * Replaces the 455-line AIMiddleware with API calls
 */

import { AnalysisRequest, ContextualAnalysisRequest, ProjectAnalysis } from './types';
import { config } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private currentSessionId: string | null = null;

  constructor() {
    // Use Supabase Edge Function URL
    this.baseUrl = `${config.supabase.url}/functions/v1/analyze-construction`;
    this.loadOrCreateSession();
  }

  /**
   * Load existing session ID or create new one
   */
  private async loadOrCreateSession(): Promise<void> {
    try {
      const existingSessionId = await AsyncStorage.getItem('conversation_session_id');
      if (existingSessionId) {
        this.currentSessionId = existingSessionId;
        console.log('📱 Loaded existing conversation session:', existingSessionId);
      } else {
        await this.createNewSession();
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      await this.createNewSession();
    }
  }

  /**
   * Create a new conversation session
   */
  async createNewSession(): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSessionId = sessionId;

    try {
      await AsyncStorage.setItem('conversation_session_id', sessionId);
      console.log('🆕 Created new conversation session:', sessionId);
    } catch (error) {
      console.error('Failed to save session ID:', error);
    }

    return sessionId;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
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

      if (response.ok) {
        const health = await response.json();
        console.log('✅ Edge AI Service initialized:', health);
      } else {
        console.warn('⚠️ Edge function health check failed, but continuing:', response.status);
        // Don't throw error - allow the service to work even if health check fails
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('⚠️ Failed to initialize Edge AI Service, but continuing:', error);
      // Don't throw error - allow fallback behavior
      this.isInitialized = true;
    }
  }

  /**
   * Analyze image or message using Edge Function with contextual memory
   * All AI processing happens server-side
   */
  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Ensure session is ready
    if (!this.currentSessionId) {
      await this.loadOrCreateSession();
    }

    const startTime = Date.now();
    console.log('📸 Sending contextual analysis request to Edge Function...');

    try {
      // Convert to contextual request if sessionId is available
      const contextualRequest: ContextualAnalysisRequest = {
        ...request,
        sessionId: this.currentSessionId!,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(contextualRequest),
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
      console.log(
        `✅ Contextual analysis completed in ${processingTime}ms using ${result.aiProvider}`
      );
      console.log(
        `🧠 Response type: ${result.data.responseType}, Confidence: ${result.data.confidence}%`
      );

      return result.data;
    } catch (error) {
      console.error('❌ Edge AI contextual analysis failed:', error);
      throw error;
    }
  }

  /**
   * Process chat message using Edge Function with contextual memory
   */
  async processChat(message: string, context?: any): Promise<ProjectAnalysis> {
    return this.analyzeImage({
      message,
      analysisType: 'chat',
      context: context?.location
        ? {
            location: context.location,
            projectType: context?.projectType,
          }
        : undefined,
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
