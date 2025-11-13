/**
 * Anthropic Claude Provider for Supabase Edge Functions
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis, QuoteBreakdown } from '../types.ts';
import type { ContextualAnalysisRequest } from '../context/types.ts';
import { ContextManager } from '../context/ContextManager.ts';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private apiKey: string;
  private model = 'claude-3-haiku-20240307'; // Fast and cost-effective
  private endpoint = 'https://api.anthropic.com/v1/messages';
  private contextManager?: ContextManager;

  constructor(apiKey: string, contextManager?: ContextManager) {
    this.apiKey = apiKey;
    this.contextManager = contextManager;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      return false;
    }

    try {
      const response = await this.makeRequest('Health check');
      return response !== null;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { status: 'down', error: 'No API key' };
    }

    const startTime = Date.now();
    try {
      await this.makeRequest('Health check');
      const latency = Date.now() - startTime;

      return {
        status: latency < 3000 ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Anthropic health check failed:', errorMsg);

      if (errorMsg.includes('429') || errorMsg.includes('rate')) {
        return { status: 'degraded', error: 'Rate limited', latency: 0 };
      }

      return { status: 'down', error: errorMsg };
    }
  }

  async analyzeImage(
    request: AnalysisRequest | ContextualAnalysisRequest
  ): Promise<ProjectAnalysis> {
    try {
      const prompt = await this.createAnalysisPrompt(request);
      const response = await this.makeRequest(prompt);
      const analysis = this.parseResponse(response);

      // Update conversation context if ContextManager is available
      if (this.contextManager && 'sessionId' in request) {
        await this.updateConversationContext(request as ContextualAnalysisRequest, analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Anthropic analysis failed:', error);
      throw new Error(
        `Anthropic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async makeRequest(prompt: string): Promise<string> {
    // Retry logic for rate limiting
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content && data.content[0] && data.content[0].text) {
          return data.content[0].text;
        }
        throw new Error('Invalid response format from Anthropic');
      }

      // Check if it's a rate limit error
      if (response.status === 429) {
        console.log(
          `⏳ Anthropic rate limited, retrying in ${delay}ms... (${retries} retries left)`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        retries--;
        continue;
      }

      // Other errors - don't retry
      const errorBody = await response.text();
      console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    throw new Error('Anthropic API rate limited after 3 retries');
  }

  private async createAnalysisPrompt(
    request: AnalysisRequest | ContextualAnalysisRequest
  ): Promise<string> {
    const { additionalContext } = request;

    return `You are a highly experienced construction contractor and estimator. Analyze this construction request and provide a comprehensive, accurate quote.

CONTEXT:
${additionalContext?.projectType ? `Project Type: ${additionalContext.projectType}` : ''}
${additionalContext?.location ? `Location: ${additionalContext.location}` : 'UK-based project'}

USER REQUEST: "${request.message || 'Project analysis needed'}"

CRITICAL: Return ONLY a valid JSON object with this structure:

{
  "projectType": "Specific project description",
  "description": "Detailed description of work needed",
  "difficultyLevel": "Easy|Moderate|Difficult|Professional Required",
  "costBreakdown": {
    "materials": {"min": 0, "max": 0},
    "labor": {"min": 0, "max": 0, "hourlyRate": 0, "estimatedHours": 0},
    "total": {"min": 0, "max": 0}
  },
  "timeline": {
    "diy": "X days/weeks",
    "professional": "X days"
  },
  "requiresProfessional": true,
  "professionalReasons": ["Reason if required"],
  "confidence": 85,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Use realistic 2024 UK market rates. All costs in GBP.`;
  }

  private parseResponse(text: string): ProjectAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Anthropic response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        projectType: parsed.projectType || 'Construction Project',
        description: parsed.description || 'Project analysis completed',
        difficultyLevel: parsed.difficultyLevel || 'Moderate',
        costBreakdown: this.validateCostBreakdown(parsed.costBreakdown),
        timeline: parsed.timeline || {
          diy: '1-2 weeks',
          professional: '3-5 days',
        },
        requiresProfessional: parsed.requiresProfessional || false,
        professionalReasons: parsed.professionalReasons || [],
        confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
        recommendations: parsed.recommendations || [],

        // Set by middleware
        analysisId: '',
        timestamp: '',
        aiProvider: this.name,
        processingTimeMs: 0,
        toolsRequired: [],
        safetyConsiderations: [],
        permitsRequired: [],
        warnings: [],
      };
    } catch (error) {
      throw new Error(`Failed to parse Anthropic response: ${error}`);
    }
  }

  private validateCostBreakdown(breakdown: any): QuoteBreakdown {
    if (!breakdown) {
      return {
        materials: { min: 100, max: 500, items: [] },
        labor: { min: 200, max: 800, hourlyRate: 30, estimatedHours: 8 },
        total: { min: 300, max: 1300 },
      };
    }

    const materials = breakdown.materials || { min: 100, max: 500 };
    const labor = breakdown.labor || { min: 200, max: 800, hourlyRate: 30, estimatedHours: 8 };

    return {
      materials: {
        min: Math.max(0, materials.min || 0),
        max: Math.max(materials.min || 0, materials.max || 0),
        items: [],
      },
      labor: {
        min: Math.max(0, labor.min || 0),
        max: Math.max(labor.min || 0, labor.max || 0),
        hourlyRate: Math.max(20, labor.hourlyRate || 30),
        estimatedHours: Math.max(1, labor.estimatedHours || 8),
      },
      total: {
        min: (materials.min || 0) + (labor.min || 0),
        max: (materials.max || 0) + (labor.max || 0),
      },
    };
  }

  private async updateConversationContext(
    request: ContextualAnalysisRequest,
    analysis: ProjectAnalysis
  ): Promise<void> {
    if (!this.contextManager) return;

    try {
      await this.contextManager.updateConversationSession(
        request.sessionId,
        request.userId || 'anonymous',
        {
          userMessage: request.message || '',
          aiResponse: analysis.description,
          projectType: analysis.projectType,
          confidence: analysis.confidence,
        }
      );
    } catch (error) {
      console.warn('Failed to update conversation context:', error);
    }
  }
}
