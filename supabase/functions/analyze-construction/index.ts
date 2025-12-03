/**
 * Simplified Analyze Construction Edge Function
 * Single provider architecture - focused on pricing and materials
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createResponse, createErrorResponse, getEnvironment, debugLog } from '../_shared/env.ts';
import { AIMiddleware, SimplifiedMiddlewareConfig } from './middleware.ts';
import {
  AnalysisRequest,
  AnalysisResponse,
  ContextualAnalysisRequest,
  ProjectAnalysis,
} from './types.ts';

console.log('🏗️ Analyze Construction Edge Function - Simplified Single Provider Mode');

/**
 * Transform analysis response for mobile app compatibility
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
      totalDays: totalDays || 5,
    },
    // Preserve professional cost breakdown if available
    professionalCosts: (analysis as any).pricingEnhancement?.professionalCosts,
    confidenceBreakdown: (analysis as any).pricingEnhancement?.confidenceBreakdown,
    professionalAdvice: (analysis as any).pricingEnhancement?.professionalAdvice,
    enhancedPricing: (analysis as any).pricingEnhancement
      ? {
          dataSource: (analysis as any).pricingEnhancement.dataSource,
          materialCount: (analysis as any).pricingEnhancement.marketData?.materials?.length || 0,
          confidenceScore: (analysis as any).pricingEnhancement.confidenceScore,
          enhancementApplied: (analysis as any).pricingEnhancement.enhancementApplied,
        }
      : null,
  };
}

// Simplified configuration - single provider
const getMiddlewareConfig = (): SimplifiedMiddlewareConfig => {
  const env = getEnvironment();

  // Use environment variable or default to gemini for testing
  const provider = env.AI_PROVIDER === 'openai' ? 'openai' : 'gemini';

  return {
    provider,
    timeoutMs: 20000, // 20 seconds timeout
    enablePricingEnhancement: true, // Always enhance with pricing data
  };
};

let aiMiddleware: AIMiddleware | null = null;

Deno.serve(async req => {
  try {
    const env = getEnvironment();
    debugLog('Request received', { method: req.method, url: req.url });

    // Initialize middleware on first request
    if (!aiMiddleware) {
      const config = getMiddlewareConfig();
      aiMiddleware = new AIMiddleware(config);

      aiMiddleware.initializeProvider(
        env.GEMINI_API_KEY,
        env.OPENAI_API_KEY,
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      console.log(`✅ AI Middleware initialized with ${config.provider} provider`);
    }

    // Handle CORS
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight' });
    }

    // Parse request
    const body = await req.json();
    debugLog('Request body', body);

    // Build analysis request with context
    const analysisRequest: ContextualAnalysisRequest = {
      imageUri: body.imageUri,
      message: body.message,
      sessionId: body.sessionId || `session_${Date.now()}`,
      userId: body.userId || 'anonymous',
      context: {
        projectType: body.projectType,
        location: body.location || 'UK',
        budgetRange: body.budgetRange,
        userPreferences: body.userPreferences || [],
      },
      history: body.history || [],
    };

    // Quick health check endpoint
    if (body.healthCheck === true) {
      console.log('🏥 Health check requested');
      const health = await aiMiddleware.healthCheck();
      return createResponse({
        success: true,
        health,
        provider: getMiddlewareConfig().provider,
      });
    }

    // Perform analysis with validation
    console.log('🔍 Starting analysis with validation...');
    const analysis = await aiMiddleware.analyzeImageWithValidation(analysisRequest);

    // Transform for mobile compatibility
    const transformedAnalysis = transformAnalysisForMobile(analysis);

    // Build response
    const response: AnalysisResponse = {
      success: true,
      data: transformedAnalysis,
      aiProvider: analysis.aiProvider,
      processingTimeMs: analysis.processingTimeMs,
      confidence: analysis.confidence,
    };

    debugLog('Analysis complete', {
      projectType: analysis.projectType,
      confidence: analysis.confidence,
      provider: analysis.aiProvider,
      timeMs: analysis.processingTimeMs,
      hasProfessionalCosts: !!transformedAnalysis.professionalCosts,
      hasEnhancedPricing: !!transformedAnalysis.enhancedPricing,
      materialCount: transformedAnalysis.enhancedPricing?.materialCount,
    });

    return createResponse(response);
  } catch (error) {
    console.error('Edge function error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';

    debugLog('Error details', {
      message: errorMessage,
      stack: errorStack,
    });

    return createErrorResponse(errorMessage, 500);
  }
});

console.log('🚀 Edge function ready');
