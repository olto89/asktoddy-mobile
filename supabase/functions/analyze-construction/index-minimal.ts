/**
 * MINIMAL Analyze Construction Edge Function
 * Single provider, no health checks, minimal API usage
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

console.log('🏗️ MINIMAL Analyze Construction Edge Function');

// Simple Gemini API call function
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Parse cost range from AI response
function parseCostRange(text: string): { min: number; max: number } | null {
  const costMatch = text.match(/£([\d,]+)(?:\s*[-–]\s*£([\d,]+))?/);
  if (costMatch) {
    const min = parseInt(costMatch[1].replace(/,/g, ''));
    const max = costMatch[2] ? parseInt(costMatch[2].replace(/,/g, '')) : min;
    return { min, max };
  }
  return null;
}

Deno.serve(async req => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { message, sessionId, analysisType } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers,
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers,
      });
    }

    console.log(`📝 Processing: ${message.substring(0, 100)}...`);

    // Create focused UK construction analysis prompt
    const analysisPrompt = `You are a UK construction cost estimator. Analyze this project and provide a realistic cost estimate.

Project: ${message}

Please provide:
1. Brief project analysis (2-3 sentences)
2. Realistic UK cost range in format: £X,000 - £Y,000
3. Key cost factors

Keep response concise and focused on costs. Use current UK construction market rates including materials, labor, and typical overheads.`;

    // Single API call - no retries to preserve quota
    const aiResponse = await callGemini(analysisPrompt, geminiApiKey);

    // Parse cost range
    const costRange = parseCostRange(aiResponse);

    // Build response
    const analysisResult = {
      response: aiResponse,
      costBreakdown: costRange
        ? {
            totalCost: costRange,
          }
        : null,
      confidence: 75,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      provider: 'gemini-minimal',
    };

    console.log(
      `✅ Analysis complete: ${costRange ? `£${costRange.min.toLocaleString()}-£${costRange.max.toLocaleString()}` : 'No cost parsed'}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: analysisResult,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        error: true,
        message: `Analysis failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers }
    );
  }
});
