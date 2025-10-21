/**
 * Analyze Construction Edge Function
 * Handles AI-powered construction analysis and chat responses
 * MIGRATED: All 455 lines of AIMiddleware now in Edge Function
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createResponse, createErrorResponse, getEnvironment, debugLog } from "../_shared/env.ts"
import { AIMiddleware } from "./middleware.ts"
import { AnalysisRequest, AnalysisResponse } from "./types.ts"

console.log("🏗️ Analyze Construction Edge Function initialized with AI Middleware")

// Initialize AI Middleware with configuration
const middlewareConfig = {
  primaryProvider: 'gemini',
  fallbackProviders: ['mock'],
  timeoutMs: 30000,
  retryAttempts: 2,
  enableFallback: true
}

let aiMiddleware: AIMiddleware | null = null

Deno.serve(async (req) => {
  try {
    const env = getEnvironment()
    debugLog("Request received", { method: req.method, url: req.url })
    
    // Initialize middleware on first request
    if (!aiMiddleware) {
      aiMiddleware = new AIMiddleware(middlewareConfig)
      aiMiddleware.initializeProviders(env.GEMINI_API_KEY, env.OPENAI_API_KEY)
      console.log('✅ AI Middleware initialized')
    }
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight handled' }, 200)
    }
    
    // Health check endpoint
    if (req.method === 'GET') {
      const providerHealth = await aiMiddleware.healthCheck()
      
      return createResponse({
        service: 'analyze-construction',
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: env.APP_ENV,
        middleware: {
          initialized: !!aiMiddleware,
          availableProviders: aiMiddleware.getAvailableProviders(),
          providerHealth: providerHealth
        },
        providers: {
          gemini: !!env.GEMINI_API_KEY,
          openai: !!env.OPENAI_API_KEY
        }
      })
    }
    
    // Main analysis endpoint
    if (req.method === 'POST') {
      const startTime = Date.now()
      
      try {
        const requestData: AnalysisRequest = await req.json()
        debugLog("Analysis request", requestData)
        
        // Validate request
        if (!requestData.message && !requestData.imageUri) {
          return createErrorResponse('Either message or imageUri is required', 400)
        }
        
        // Process through AI Middleware (all 455 lines of business logic)
        const analysis = await aiMiddleware.analyzeImageWithValidation(requestData)
        
        const response: AnalysisResponse = {
          success: true,
          data: analysis,
          processingTimeMs: Date.now() - startTime,
          aiProvider: analysis.aiProvider
        }
        
        debugLog("Analysis completed", { 
          provider: analysis.aiProvider, 
          processingTime: response.processingTimeMs,
          confidence: analysis.confidence
        })
        
        return createResponse(response)
        
      } catch (error) {
        console.error('Analysis processing error:', error)
        
        const response: AnalysisResponse = {
          success: false,
          error: {
            code: 'ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Unknown analysis error',
            details: error
          },
          processingTimeMs: Date.now() - startTime,
          aiProvider: 'error'
        }
        
        return createErrorResponse(response.error.message, 500, response)
      }
    }
    
    return createErrorResponse('Method not allowed', 405)
    
  } catch (error) {
    console.error('Analyze Construction Error:', error)
    return createErrorResponse('Internal server error', 500, { error: error.message })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/analyze-construction' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
