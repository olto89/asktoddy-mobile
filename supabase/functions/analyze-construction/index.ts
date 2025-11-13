/**
 * Analyze Construction Edge Function
 * Handles AI-powered construction analysis and chat responses
 * MIGRATED: All 455 lines of AIMiddleware now in Edge Function
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createResponse, createErrorResponse, getEnvironment, debugLog } from '../_shared/env.ts';
import { AIMiddleware } from './middleware.ts';
import { GeminiProvider } from './providers/gemini.ts';
import {
  AnalysisRequest,
  AnalysisResponse,
  ContextualAnalysisRequest,
  ProjectAnalysis,
} from './types.ts';

console.log('🏗️ Analyze Construction Edge Function initialized with AI Middleware');

/**
 * Transform analysis response for mobile app compatibility
 * Mobile app expects: estimatedCost.total and timeline.totalDays
 * Edge function provides: costBreakdown.total and timeline (without totalDays)
 */
function transformAnalysisForMobile(analysis: ProjectAnalysis): any {
  // Calculate total days from timeline phases
  let totalDays = 0;
  if (analysis.timeline?.phases) {
    for (const phase of analysis.timeline.phases) {
      const duration = phase.duration || '1 day';
      const days = parseInt(duration.match(/\d+/)?.[0] || '1');
      totalDays += days;
    }
  }

  // If no phases, estimate from professional timeline
  if (totalDays === 0 && analysis.timeline?.professional) {
    const professional = analysis.timeline.professional || '5 days';
    totalDays = parseInt(professional.match(/\d+/)?.[0] || '5');
  }

  return {
    ...analysis,
    // Add estimatedCost field for mobile compatibility
    estimatedCost: {
      total: analysis.costBreakdown?.total,
      materials: analysis.costBreakdown?.materials,
      labor: analysis.costBreakdown?.labor,
    },
    // Add totalDays to timeline for mobile compatibility
    timeline: {
      ...analysis.timeline,
      totalDays: totalDays || 5, // Default fallback
    },
  };
}

// Initialize AI Middleware with optimized simple Gemini provider
const middlewareConfig = {
  primaryProvider: 'gemini-simple',
  fallbackProviders: ['gemini', 'gemini-fallback'], // Complex Gemini, then alternative models
  timeoutMs: 15000, // Shorter timeout for faster responses
  retryAttempts: 1, // Fewer retries for speed
  enableFallback: true,
  providerRetryDelay: 1000, // Quick retry delay
  userFeedbackEnabled: true, // Show user which provider we're trying
};

let aiMiddleware: AIMiddleware | null = null;

Deno.serve(async req => {
  try {
    const env = getEnvironment();
    debugLog('Request received', { method: req.method, url: req.url });

    // Initialize middleware on first request
    if (!aiMiddleware) {
      aiMiddleware = new AIMiddleware(middlewareConfig);
      aiMiddleware.initializeProviders(
        env.GEMINI_API_KEY,
        env.OPENAI_API_KEY,
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        env.ANTHROPIC_API_KEY
      );

      const availableProviders = aiMiddleware.getAvailableProviders();
      console.log('✅ AI Middleware initialized with providers:', availableProviders);
      console.log('🔧 Fallback providers configured:', middlewareConfig.fallbackProviders);
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight handled' }, 200);
    }

    // Health check endpoint
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const isDebug = url.searchParams.get('debug') === 'true';

      const providerHealth = await aiMiddleware.healthCheck();

      const response = {
        service: 'analyze-construction',
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: env.APP_ENV,
        middleware: {
          initialized: !!aiMiddleware,
          availableProviders: aiMiddleware.getAvailableProviders(),
          providerHealth: providerHealth,
        },
        providers: {
          gemini: !!env.GEMINI_API_KEY,
          openai: !!env.OPENAI_API_KEY,
        },
      };

      if (isDebug) {
        response.debug = {
          geminiApiKey: env.GEMINI_API_KEY
            ? `${env.GEMINI_API_KEY.substring(0, 10)}...`
            : 'NOT_SET',
          openaiApiKey: env.OPENAI_API_KEY
            ? `${env.OPENAI_API_KEY.substring(0, 10)}...`
            : 'NOT_SET',
          supabaseUrl: env.SUPABASE_URL,
          appEnv: env.APP_ENV,
        };
      }

      console.log('🩺 Health check called', { debug: isDebug, providerHealth });
      return createResponse(response);
    }

    // Main analysis endpoint
    if (req.method === 'POST') {
      const startTime = Date.now();
      console.log('📝 POST request received at', new Date().toISOString());

      try {
        const requestData: AnalysisRequest | ContextualAnalysisRequest = await req.json();
        debugLog('Analysis request', requestData);

        // Validate request
        if (!requestData.message && !requestData.imageUri) {
          return createErrorResponse('Either message or imageUri is required', 400);
        }

        // Process through fixed AI Middleware (should work now with correct fallback providers)
        console.log('🤖 Calling fixed AI Middleware with correct provider registry');
        const analysis = await aiMiddleware.analyzeImageWithValidation(requestData);

        console.log('✅ AI Middleware completed:', {
          provider: analysis.aiProvider,
          projectType: analysis.projectType,
          confidence: analysis.confidence,
          processingTime: Date.now() - startTime,
          hasWarnings: !!(analysis.warnings && analysis.warnings.length > 0),
        });

        // Transform response for mobile app compatibility
        const transformedAnalysis = transformAnalysisForMobile(analysis);

        const response: AnalysisResponse = {
          success: true,
          data: transformedAnalysis,
          processingTimeMs: Date.now() - startTime,
          aiProvider: analysis.aiProvider,
        };

        debugLog('Analysis completed', {
          provider: analysis.aiProvider,
          processingTime: response.processingTimeMs,
          confidence: analysis.confidence,
        });

        return createResponse(response);
      } catch (error) {
        console.error('Analysis processing error:', error);

        const response: AnalysisResponse = {
          success: false,
          error: {
            code: 'ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Unknown analysis error',
            details: error,
          },
          processingTimeMs: Date.now() - startTime,
          aiProvider: 'error',
        };

        return createErrorResponse(response.error.message, 500, response);
      }
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Analyze Construction Error:', error);
    return createErrorResponse('Internal server error', 500, { error: error.message });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analyze-construction' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
