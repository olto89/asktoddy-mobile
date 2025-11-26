/**
 * Get Session Quote Edge Function
 * Returns current quote state for a session (for real-time updates)
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createResponse, createErrorResponse, getEnvironment } from '../_shared/env.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log('📊 Get Session Quote Edge Function initialized');

interface QuoteState {
  projectType: string;
  confidence: number;
  totalCost: {
    min: number;
    max: number;
  };
  keyItems: Array<{
    id: string;
    name: string;
    total: number;
    category: 'materials' | 'labor' | 'tools';
  }>;
  fullAnalysis?: any;
  lastUpdated: number;
}

/**
 * Extract key items from analysis for preview
 */
function extractKeyItems(analysis: any): QuoteState['keyItems'] {
  const keyItems: QuoteState['keyItems'] = [];

  try {
    // Extract top materials
    if (analysis.costBreakdown?.materials?.items) {
      const topMaterials = analysis.costBreakdown.materials.items
        .sort((a: any, b: any) => (b.total || b.totalPrice) - (a.total || a.totalPrice))
        .slice(0, 2);

      topMaterials.forEach((item: any, index: number) => {
        keyItems.push({
          id: `mat-${index}`,
          name: item.name || 'Material Item',
          total: item.total || item.totalPrice || 0,
          category: 'materials',
        });
      });
    }

    // Extract top labor
    if (analysis.costBreakdown?.labor?.items) {
      const topLabor = analysis.costBreakdown.labor.items
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 1);

      topLabor.forEach((item: any, index: number) => {
        keyItems.push({
          id: `lab-${index}`,
          name: item.name || 'Labor Item',
          total: item.total || 0,
          category: 'labor',
        });
      });
    }

    // If no detailed items, create summary items
    if (keyItems.length === 0) {
      if (analysis.costBreakdown?.materials) {
        keyItems.push({
          id: 'materials-summary',
          name: 'Materials & Supplies',
          total: analysis.costBreakdown.materials.max || 0,
          category: 'materials',
        });
      }

      if (analysis.costBreakdown?.labor) {
        keyItems.push({
          id: 'labor-summary',
          name: 'Professional Labor',
          total: analysis.costBreakdown.labor.max || 0,
          category: 'labor',
        });
      }
    }
  } catch (error) {
    console.error('Error extracting key items:', error);
  }

  return keyItems;
}

Deno.serve(async req => {
  try {
    const env = getEnvironment();

    // Handle CORS
    if (req.method === 'OPTIONS') {
      return createResponse({ message: 'CORS preflight' });
    }

    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse request
    const body = await req.json();
    const { sessionId, userId, includeFullAnalysis = false } = body;

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
    }

    // Initialize Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get latest conversation session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      console.error('Session query error:', sessionError);
      return createErrorResponse('Session not found', 404);
    }

    // Get the latest analysis from the session
    let latestAnalysis = null;

    // Check if we have a current analysis in the session
    if (sessionData.latest_analysis) {
      latestAnalysis = sessionData.latest_analysis;
    } else {
      // Fallback: get the most recent message with analysis
      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('analysis_result')
        .eq('session_id', sessionId)
        .eq('role', 'assistant')
        .not('analysis_result', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!messagesError && messages && messages.length > 0) {
        latestAnalysis = messages[0].analysis_result;
      }
    }

    if (!latestAnalysis) {
      return createResponse({
        success: true,
        quoteState: null,
        message: 'No quote data available yet',
      });
    }

    // Extract key information for quote state
    const keyItems = extractKeyItems(latestAnalysis);
    const totalCost = {
      min: latestAnalysis.costBreakdown?.total?.min || 0,
      max: latestAnalysis.costBreakdown?.total?.max || 0,
    };

    const quoteState: QuoteState = {
      projectType: latestAnalysis.projectType || 'Construction Project',
      confidence: latestAnalysis.confidence || 0,
      totalCost,
      keyItems,
      lastUpdated: new Date(sessionData.updated_at).getTime(),
    };

    // Include full analysis if requested
    if (includeFullAnalysis) {
      quoteState.fullAnalysis = latestAnalysis;
    }

    console.log('📊 Quote state retrieved:', {
      sessionId,
      projectType: quoteState.projectType,
      confidence: quoteState.confidence,
      totalCost: quoteState.totalCost,
      keyItemsCount: keyItems.length,
    });

    return createResponse({
      success: true,
      quoteState,
      sessionId,
      lastUpdated: quoteState.lastUpdated,
    });
  } catch (error) {
    console.error('Get session quote error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
});

console.log('🚀 Get Session Quote function ready');
