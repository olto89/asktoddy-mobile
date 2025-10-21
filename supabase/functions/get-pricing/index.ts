/**
 * Get Pricing Edge Function
 * Provides comprehensive UK construction pricing data
 * ENHANCED: Real market data with regional and seasonal adjustments
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createResponse, createErrorResponse, getEnvironment, debugLog } from "../_shared/env.ts"
import { UKPricingService } from "./pricing-service.ts"
import { PricingRequest } from "./types.ts"

console.log("💰 Get Pricing Edge Function initialized with UK market data")

// Initialize pricing service
const pricingService = new UKPricingService()

Deno.serve(async (req) => {
  try {
    const env = getEnvironment()
    debugLog("Pricing request received", { method: req.method, url: req.url })
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight handled' }, 200)
    }
    
    // Health check endpoint
    if (req.method === 'GET') {
      return createResponse({
        service: 'get-pricing',
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: env.APP_ENV,
        dataSources: {
          ukMarketData: true,
          regionalPricing: true,
          seasonalAdjustments: true,
          labourRates: true,
          toolHireRates: true,
          materialPrices: true,
          aggregateRates: true,
          vatIncluded: true
        },
        coverage: {
          regions: 12,
          toolCategories: 5,
          materialCategories: 6,
          labourTrades: 8,
          lastDataUpdate: '2024-01-15'
        }
      })
    }
    
    // Main pricing endpoint
    if (req.method === 'POST') {
      const startTime = Date.now()
      
      try {
        const requestData: PricingRequest = await req.json()
        debugLog("Pricing request", requestData)
        
        // Enhanced validation
        if (!requestData.location || !requestData.projectType) {
          return createErrorResponse('Location and projectType are required', 400)
        }
        
        // Validate project scale
        if (requestData.projectScale && !['small', 'medium', 'large'].includes(requestData.projectScale)) {
          return createErrorResponse('ProjectScale must be small, medium, or large', 400)
        }
        
        // Process through comprehensive pricing service
        const pricingResponse = await pricingService.getPricingData(requestData)
        
        // Add processing metadata
        const response = {
          ...pricingResponse,
          processingTimeMs: Date.now() - startTime,
          request: {
            location: requestData.location,
            projectType: requestData.projectType,
            projectScale: requestData.projectScale || 'medium'
          }
        }
        
        debugLog("Pricing response compiled", { 
          processingTime: response.processingTimeMs,
          toolCount: response.toolHire.length,
          materialCount: response.materials.length,
          regionMultiplier: response.contextFactors.regionMultiplier,
          seasonalMultiplier: response.contextFactors.seasonalMultiplier
        })
        
        return createResponse(response)
        
      } catch (error) {
        console.error('Pricing processing error:', error)
        
        const errorResponse = {
          success: false,
          error: {
            code: 'PRICING_FAILED',
            message: error instanceof Error ? error.message : 'Unknown pricing error',
            details: error
          },
          processingTimeMs: Date.now() - startTime
        }
        
        return createErrorResponse(errorResponse.error.message, 500, errorResponse)
      }
    }
    
    return createErrorResponse('Method not allowed', 405)
    
  } catch (error) {
    console.error('Get Pricing Error:', error)
    return createErrorResponse('Internal server error', 500, { error: error.message })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-pricing' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
