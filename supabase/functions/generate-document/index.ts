/**
 * Generate Document Edge Function
 * Creates PDF quotes, project plans, and task lists
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createResponse, createErrorResponse, getEnvironment, debugLog } from '../_shared/env.ts';
import { PDFGenerator } from './pdf-generator.ts';
import type { DocumentRequest } from './types.ts';

console.log('📄 Generate Document Edge Function initialized');

Deno.serve(async req => {
  try {
    const env = getEnvironment();
    debugLog('Document request received', { method: req.method, url: req.url });

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight handled' }, 200);
    }

    // Health check endpoint
    if (req.method === 'GET') {
      return createResponse({
        service: 'generate-document',
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: env.APP_ENV,
        supportedFormats: ['pdf'],
        documentTypes: ['quote', 'timeline', 'tasklist'],
        features: [
          'professional-branding',
          'vat-calculations',
          'task-checklists',
          'mobile-optimized',
        ],
      });
    }

    // Main document generation endpoint
    if (req.method === 'POST') {
      const requestData: DocumentRequest = await req.json();
      debugLog('Document generation request', {
        type: requestData.type,
        projectType: requestData.projectType,
        hasAnalysis: !!requestData.analysis,
        hasPricing: !!requestData.pricing,
        hasUserDetails: !!requestData.userDetails,
      });

      try {
        // Validate the request
        PDFGenerator.validateRequest(requestData);

        // Generate the PDF
        const result = await PDFGenerator.generatePDF(requestData);

        // Return PDF as response with proper headers
        const headers = new Headers({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.document.filename}"`,
          'X-Document-ID': result.document.documentId,
          'X-Processing-Time': result.processingTimeMs.toString(),
          'X-Document-Pages': result.document.pages.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        });

        debugLog('PDF generated successfully', {
          documentId: result.document.documentId,
          filename: result.document.filename,
          size: result.document.size,
          pages: result.document.pages,
          processingTimeMs: result.processingTimeMs,
        });

        return new Response(result.pdfBuffer, { headers });
      } catch (validationError) {
        console.error('Document generation validation error:', validationError);
        return createErrorResponse(validationError.message, 400);
      }
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Generate Document Error:', error);
    return createErrorResponse('Internal server error', 500, { error: error.message });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-document' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
