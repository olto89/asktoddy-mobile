/**
 * Generate Document Edge Function
 * Creates PDF quotes, project plans, and task lists
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createResponse, createErrorResponse, getEnvironment, debugLog } from "../_shared/env.ts"

console.log("📄 Generate Document Edge Function initialized")

Deno.serve(async (req) => {
  try {
    const env = getEnvironment()
    debugLog("Document request received", { method: req.method, url: req.url })
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight handled' }, 200)
    }
    
    // Health check endpoint
    if (req.method === 'GET') {
      return createResponse({
        service: 'generate-document',
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: env.APP_ENV,
        supportedFormats: ['pdf'],
        documentTypes: ['quote', 'timeline', 'tasklist']
      })
    }
    
    // Main document generation endpoint
    if (req.method === 'POST') {
      const requestData = await req.json()
      debugLog("Document generation request", requestData)
      
      // Basic validation
      if (!requestData.type || !requestData.projectType) {
        return createErrorResponse('Type and projectType are required', 400)
      }
      
      const validTypes = ['quote', 'timeline', 'tasklist']
      if (!validTypes.includes(requestData.type)) {
        return createErrorResponse(`Invalid document type. Must be one of: ${validTypes.join(', ')}`, 400)
      }
      
      // Mock document generation for now (will be replaced with real PDF logic)
      const documentData = {
        documentId: `${requestData.type}-${Date.now()}`,
        type: requestData.type,
        projectType: requestData.projectType,
        generatedAt: new Date().toISOString(),
        filename: `${requestData.projectType.toLowerCase().replace(/\s+/g, '-')}-${requestData.type}-${new Date().toISOString().split('T')[0]}.pdf`,
        size: '2.4 MB',
        pages: requestData.type === 'quote' ? 3 : requestData.type === 'timeline' ? 2 : 1,
        downloadUrl: `https://api.asktoddy.com/documents/${requestData.type}-${Date.now()}.pdf`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
      
      // Mock different response formats based on document type
      const response = {
        success: true,
        document: documentData,
        message: `${requestData.type.charAt(0).toUpperCase() + requestData.type.slice(1)} document generated successfully`,
        processingTimeMs: 1200
      }
      
      debugLog("Document generation response", response)
      return createResponse(response)
    }
    
    return createErrorResponse('Method not allowed', 405)
    
  } catch (error) {
    console.error('Generate Document Error:', error)
    return createErrorResponse('Internal server error', 500, { error: error.message })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-document' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
