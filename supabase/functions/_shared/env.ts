/**
 * Shared Environment Configuration for Supabase Edge Functions
 * Provides centralized access to environment variables
 */

export interface Environment {
  // AI Provider Keys
  GEMINI_API_KEY: string
  OPENAI_API_KEY?: string
  
  // Supabase Configuration
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // External APIs
  HSS_HIRE_API_KEY?: string
  SCREWFIX_API_KEY?: string
  
  // Application Config
  APP_ENV: string
  DEBUG: boolean
}

/**
 * Load and validate environment variables
 */
export function getEnvironment(): Environment {
  const env = {
    // AI Provider Keys
    GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY') || '',
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') || '',
    
    // Supabase Configuration
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    
    // External APIs
    HSS_HIRE_API_KEY: Deno.env.get('HSS_HIRE_API_KEY'),
    SCREWFIX_API_KEY: Deno.env.get('SCREWFIX_API_KEY'),
    
    // Application Config
    APP_ENV: Deno.env.get('APP_ENV') || 'development',
    DEBUG: Deno.env.get('DEBUG') === 'true' || Deno.env.get('APP_ENV') === 'development'
  }
  
  // Validate required environment variables
  const required = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter(key => !env[key as keyof Environment])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  return env
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

/**
 * Standard API response wrapper
 */
export function createResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...headers
      }
    }
  )
}

/**
 * Error response wrapper
 */
export function createErrorResponse(message: string, status = 500, details?: any) {
  return createResponse({
    error: true,
    message,
    details,
    timestamp: new Date().toISOString()
  }, status)
}

/**
 * Debug logging utility
 */
export function debugLog(message: string, data?: any) {
  const env = getEnvironment()
  if (env.DEBUG) {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }
}