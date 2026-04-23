/**
 * Simple Gemini Provider - Minimal implementation with intelligent material calculation
 */

const IS_DEBUG = Deno.env.get('DEBUG') === 'true' || Deno.env.get('APP_ENV') === 'development';
const debug = (...args: unknown[]) => {
  if (IS_DEBUG) console.log(...args);
};

import { AIProvider, AnalysisRequest, ProjectAnalysis } from '../types.ts';
import { createMaterialCalculationPrompt } from '../prompts/material-quantity-calculator.ts';
import { createQuantityBasedPrompt, ProjectDimensions } from '../calculators/QuantityCalculator.ts';

export class GeminiSimpleProvider implements AIProvider {
  name = 'gemini-simple';
  private apiKey: string;
  private model = 'gemini-2.5-flash';
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.apiKey && this.apiKey !== 'your_api_key_here');
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { status: 'down', error: 'No API key' };
    }
    return { status: 'healthy', latency: 100 };
  }

  /**
   * Extract dimensions from user message (ChatGPT-style pattern recognition)
   */
  private extractDimensions(message: string): ProjectDimensions | null {
    const text = message.toLowerCase();

    // Look for dimension patterns like "4x4", "4m x 4m", "4 by 4", etc.
    const dimensionPatterns = [
      /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*m/g,
      /(\d+(?:\.\d+)?)\s*m\s*[x×]\s*(\d+(?:\.\d+)?)\s*m/g,
      /(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)\s*meter/g,
      /(\d+(?:\.\d+)?)\s*meter\s*by\s*(\d+(?:\.\d+)?)\s*meter/g,
      /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/g,
    ];

    let length = 0,
      width = 0;

    for (const pattern of dimensionPatterns) {
      const match = pattern.exec(text);
      if (match) {
        length = parseFloat(match[1]);
        width = parseFloat(match[2]);
        break;
      }
    }

    // If no dimensions found, return null
    if (length === 0 || width === 0) {
      return null;
    }

    // Determine project type from context
    let projectType: 'extension' | 'renovation' | 'new_build' | 'conversion' = 'extension';
    if (text.includes('extension')) projectType = 'extension';
    else if (text.includes('renovation') || text.includes('refurb')) projectType = 'renovation';
    else if (text.includes('new build') || text.includes('new house')) projectType = 'new_build';
    else if (text.includes('conversion') || text.includes('convert')) projectType = 'conversion';

    // Estimate height and floors
    let height = 2.5; // Default ceiling height
    if (text.includes('high ceiling')) height = 3.0;
    if (text.includes('low ceiling')) height = 2.3;

    let floors = 1;
    if (text.includes('two story') || text.includes('two-story') || text.includes('double story'))
      floors = 2;

    return {
      length,
      width,
      height,
      floors,
      projectType,
    };
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;

    debug('🤖 [GEMINI-SIMPLE] Starting analysis...');
    debug('📋 [GEMINI-SIMPLE] Request:', {
      hasMessage: !!request.message,
      hasImage: !!request.imageUri,
      message: request.message?.substring(0, 50) + '...',
    });

    // Extract dimensions from the message and use ChatGPT-style calculation
    const dimensions = this.extractDimensions(request.message || '');

    let prompt: string;
    if (dimensions) {
      // Use pre-calculated quantities (ChatGPT style)
      prompt = createQuantityBasedPrompt(request.message || '', dimensions);
    } else {
      // Fallback to standard prompt
      prompt = createMaterialCalculationPrompt(
        request.message || 'Construction project analysis needed'
      );
    }

    // NO RETRIES to preserve quota (was causing 3x API calls)
    let retries = 1; // Single attempt only
    let delay = 500;

    while (retries > 0) {
      try {
        debug(`🔄 [GEMINI-SIMPLE] API call (single attempt to preserve quota)...`);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (response.ok) {
          debug('✅ [GEMINI-SIMPLE] API call successful');
          const data = await response.json();

          if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response structure from Gemini API');
          }

          const responseText = data.candidates[0].content.parts[0].text;
          debug('📝 [GEMINI-SIMPLE] Response length:', responseText.length);

          return this.parseAndValidateResponse(responseText);
        }

        // Check for rate limiting
        if (response.status === 429) {
          debug(
            `⏳ [GEMINI-SIMPLE] Rate limited, retrying in ${delay}ms... (${retries} retries left)`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          retries--;
          continue;
        }

        // Other errors
        const error = await response.text();
        console.error(`❌ [GEMINI-SIMPLE] API error ${response.status}:`, error);
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      } catch (error) {
        console.error(`❌ [GEMINI-SIMPLE] Request failed:`, error.message);

        if (retries === 1) {
          // Last retry failed
          throw error;
        }

        retries--;
        debug(`🔄 [GEMINI-SIMPLE] Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('Gemini API failed after 3 retries');
  }

  private parseAndValidateResponse(responseText: string): ProjectAnalysis {
    debug('🔍 [GEMINI-SIMPLE] Parsing response...');

    try {
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(
          '❌ [GEMINI-SIMPLE] No JSON found in response:',
          responseText.substring(0, 200)
        );
        throw new Error('No JSON found in response');
      }

      debug('📄 [GEMINI-SIMPLE] JSON extracted, parsing...');
      const parsed = JSON.parse(jsonMatch[0]);

      debug('✅ [GEMINI-SIMPLE] Successfully parsed response');

      // Return with required fields
      const analysis = {
        projectType: parsed.projectType || 'Construction Project',
        description: parsed.description || 'Analysis completed',
        difficultyLevel: parsed.difficultyLevel || 'Moderate',
        costBreakdown: parsed.costBreakdown || {
          materials: { min: 100, max: 500, items: [] },
          labor: { min: 200, max: 800, hourlyRate: 35, estimatedHours: 8 },
          total: { min: 300, max: 1300 },
        },
        timeline: parsed.timeline || {
          diy: '1-2 weeks',
          professional: '3-5 days',
          phases: [{ name: 'Planning', duration: '1 day', description: 'Planning phase' }],
        },
        toolsRequired: parsed.toolsRequired || [],
        safetyConsiderations: parsed.safetyConsiderations || [],
        permitsRequired: parsed.permitsRequired || [],
        requiresProfessional: parsed.requiresProfessional || false,
        professionalReasons: parsed.professionalReasons || [],
        confidence: parsed.confidence || 85,
        recommendations: parsed.recommendations || [],
        warnings: [],
        analysisId: `simple_${Date.now()}`,
        timestamp: new Date().toISOString(),
        aiProvider: this.name,
        processingTimeMs: 0,
      };

      debug('🎯 [GEMINI-SIMPLE] Analysis complete:', {
        projectType: analysis.projectType,
        confidence: analysis.confidence,
        provider: analysis.aiProvider,
      });

      return analysis;
    } catch (parseError) {
      console.error('❌ [GEMINI-SIMPLE] Parse error:', parseError.message);
      console.error('❌ [GEMINI-SIMPLE] Raw response:', responseText.substring(0, 500));
      throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
    }
  }
}
