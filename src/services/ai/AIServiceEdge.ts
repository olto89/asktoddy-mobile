/**
 * Edge Function AI Service
 * Lightweight client that delegates all AI processing to Supabase Edge Function
 * Replaces the 455-line AIMiddleware with API calls
 */

import { AnalysisRequest, ContextualAnalysisRequest, ProjectAnalysis } from './types';
import { config } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../Logger';

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

// Timeout durations
const HEALTH_CHECK_TIMEOUT_MS = 10_000;
const ANALYSIS_TIMEOUT_MS = 60_000;

class AIServiceEdge {
  private baseUrl: string;
  private isInitialized = false;
  private currentSessionId: string | null = null;

  // Promise that resolves once the initial session load finishes.
  // Callers await this to avoid duplicate session creation.
  private sessionReady: Promise<void>;

  constructor() {
    // Use Supabase Edge Function URL
    this.baseUrl = `${config.supabase.url}/functions/v1/analyze-construction`;
    this.sessionReady = this.loadOrCreateSession();
  }

  /**
   * Load existing session ID or create new one
   */
  private async loadOrCreateSession(): Promise<void> {
    try {
      const existingSessionId = await AsyncStorage.getItem('conversation_session_id');
      if (existingSessionId) {
        this.currentSessionId = existingSessionId;
        logger.debug('📱 Loaded existing conversation session:', existingSessionId);
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
      logger.debug('🆕 Created new conversation session:', sessionId);
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

    logger.debug('🚀 Initializing Edge AI Service...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const health = await response.json();
        logger.debug('✅ Edge AI Service initialized:', health);
      } else {
        logger.warn('⚠️ Edge function health check failed, but continuing:', response.status);
      }

      this.isInitialized = true;
    } catch (error) {
      logger.warn('⚠️ Failed to initialize Edge AI Service, but continuing:', error);
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

    // Wait for the constructor's session load to finish (no-op if already done)
    await this.sessionReady;

    const startTime = Date.now();
    logger.debug('📸 Sending contextual analysis request to Edge Function...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 503: AI unavailable but fallback data provided
      if (response.status === 503) {
        const body = await response.json();
        if (body.fallbackData) {
          logger.warn('⚠️ AI unavailable, using fallback data');
          return { ...body.fallbackData, _isFallback: true };
        }
        throw new Error(body.error?.message || 'AI analysis temporarily unavailable');
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Edge function failed: ${response.status} - ${error}`);
      }

      const result: AnalysisResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Analysis failed');
      }

      const processingTime = Date.now() - startTime;
      logger.debug(
        `✅ Contextual analysis completed in ${processingTime}ms using ${result.aiProvider}`
      );
      logger.debug(
        `🧠 Response type: ${result.data.responseType}, Confidence: ${result.data.confidence}%`
      );

      return result.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        console.error('❌ AI analysis timed out after 60 seconds');
        throw new Error('AI analysis timed out. Please try again.');
      }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
    logger.debug('🧹 Edge AI Service cleaned up');
  }
}

// Export singleton instance
export const AIService = new AIServiceEdge();
export default AIService;
