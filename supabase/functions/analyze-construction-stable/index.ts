/**
 * Stable Construction Analysis - Server-Side Material Calculations
 *
 * This endpoint provides 100% reliable material cost calculations
 * by using server-side calculations instead of AI for quantities.
 */

// Deno edge runtime types
import { createResponse, createErrorResponse } from '../_shared/env.ts';
import {
  ProjectAnalysisService,
  SimpleProjectInfo,
} from '../analyze-construction/services/ProjectAnalysisService.ts';
import { DimensionExtractor } from '../analyze-construction/utils/DimensionExtractor.ts';

console.log('🏗️ Stable Construction Analysis initialized');

Deno.serve(async req => {
  try {
    console.log('📥 Request received:', { method: req.method, url: req.url });

    // Handle CORS
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight handled' }, 200);
    }

    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    const body = await req.json();
    const { message, context } = body;

    if (!message) {
      return createErrorResponse('Message is required', 400);
    }

    console.log('🔍 Processing message:', message.substring(0, 100) + '...');

    // Extract dimensions from message
    const extractedDimensions = DimensionExtractor.extractDimensions(message);

    if (!extractedDimensions) {
      return createErrorResponse(
        'Unable to extract project dimensions from description. Please include dimensions like "4x4 meters" or "16m²"',
        400
      );
    }

    console.log('📐 Extracted dimensions:', extractedDimensions);

    // Extract additional project information
    const qualityLevel = DimensionExtractor.extractQualityLevel(message);
    const features = DimensionExtractor.extractFeatures(message);

    // Build project info
    const projectInfo: SimpleProjectInfo = {
      dimensions: {
        length: extractedDimensions.length,
        width: extractedDimensions.width,
        height: extractedDimensions.height,
      },
      description: message,
      location: context?.location || 'UK',
      features,
      qualityLevel,
    };

    console.log('🎯 Project specification:', {
      dimensions: projectInfo.dimensions,
      qualityLevel,
      features,
      location: projectInfo.location,
    });

    // Calculate using stable server-side method
    const result = ProjectAnalysisService.analyzeProject(projectInfo);

    if (!result.success) {
      return createErrorResponse('Analysis failed', 500);
    }

    console.log('✅ Analysis completed successfully in', result.processingTimeMs, 'ms');

    // Add extraction metadata to response
    result.data.extractionInfo = {
      dimensionSource: extractedDimensions.source,
      dimensionConfidence: extractedDimensions.confidence,
      qualityLevel,
      featuresDetected: features,
    };

    return createResponse(
      {
        success: true,
        data: result.data,
        processingTimeMs: result.processingTimeMs,
        method: 'stable-server-side',
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error('❌ Stable analysis failed:', error);
    return createErrorResponse(
      `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});

/*
USAGE EXAMPLE:

POST /analyze-construction-stable
{
  "message": "I want to build a 4x4 meter single story extension for my kitchen with standard finishes and basic electrical with 4 sockets",
  "context": {
    "location": "Cambridge"
  }
}

RESPONSE:
{
  "success": true,
  "data": {
    "projectType": "Single-Story Extension (4m × 4m, 16m²)",
    "description": "Professional analysis for 16m² extension with 12 calculated materials...",
    "costBreakdown": {
      "materials": {
        "total": {"min": 8420, "max": 8845},
        "items": [
          {"name": "Ready Mix Concrete C25 (Foundation)", "quantity": 8, "unit": "m³", "unitPrice": 140, "totalCost": 1176},
          {"name": "Engineering Bricks", "quantity": 4080, "unit": "bricks", "unitPrice": 0.65, "totalCost": 2918},
          {"name": "Plasterboard 12.5mm (2400x1200)", "quantity": 14, "unit": "sheets", "unitPrice": 10.25, "totalCost": 165}
        ],
        "breakdown": {"structural": 6420, "finishing": 1240, "services": 185, "roofing": 0}
      },
      "labor": {"min": 3360, "max": 5040, "hourlyRate": 35, "estimatedHours": 120},
      "total": {"min": 11780, "max": 13885}
    },
    "timeline": {"professional": "3 weeks", "totalDays": 15},
    "confidence": 95,
    "calculations": {
      "methodology": "Server-side calculation using UK building standards",
      "assumptions": ["Floor area: 16m²", "Net wall area: 34.0m² (after openings)", "Foundation: 7.7m³ concrete needed"]
    }
  },
  "processingTimeMs": 12,
  "method": "stable-server-side"
}
*/
