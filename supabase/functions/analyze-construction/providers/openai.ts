/**
 * OpenAI Provider for Supabase Edge Functions
 * Ready for activation when API key is provided
 * Supports GPT-4 Vision and GPT-4o models
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis, QuoteBreakdown } from '../types.ts';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;
  private endpoint = 'https://api.openai.com/v1/chat/completions';

  constructor(
    apiKey: string,
    model: 'gpt-4-vision-preview' | 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini'
  ) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_api_key_here' || this.apiKey.length < 20) {
      console.log('⚠️ OpenAI provider not configured - API key missing or invalid');
      return false;
    }

    try {
      // Quick health check with minimal tokens
      const response = await this.callOpenAI([{ role: 'user', content: 'Hi' }], { max_tokens: 5 });
      return response !== null;
    } catch (error) {
      console.error('OpenAI availability check failed:', error);
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number }> {
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      return { status: 'down' };
    }

    const startTime = Date.now();
    try {
      await this.callOpenAI([{ role: 'user', content: 'Health check' }], { max_tokens: 5 });

      const latency = Date.now() - startTime;

      return {
        status: latency < 3000 ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return { status: 'down' };
    }
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    try {
      const messages = this.buildMessages(request);

      // Call OpenAI with structured output
      const response = await this.callOpenAI(messages, {
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' }, // Ensure JSON response
      });

      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate the response
      return this.parseOpenAIResponse(response);
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw new Error(
        `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildMessages(request: AnalysisRequest): any[] {
    const messages: any[] = [];

    // System prompt for construction expertise
    messages.push({
      role: 'system',
      content: `You are a highly experienced UK construction contractor and estimator with 20+ years in the industry. 
      Analyze construction projects and provide comprehensive, accurate quotes using current 2024 UK market rates.
      Always return responses in valid JSON format.`,
    });

    // Build user message with context
    const userContent: any[] = [
      {
        type: 'text',
        text: this.createAnalysisPrompt(request),
      },
    ];

    // Add image if provided
    if (request.imageUri) {
      if (request.imageUri.startsWith('data:')) {
        // Data URL - extract base64
        const base64Image = request.imageUri.split(',')[1];
        userContent.push({
          type: 'image_url',
          image_url: {
            url: request.imageUri,
            detail: 'high', // High detail for construction analysis
          },
        });
      } else if (request.imageUri.startsWith('http')) {
        // URL - pass directly
        userContent.push({
          type: 'image_url',
          image_url: {
            url: request.imageUri,
            detail: 'high',
          },
        });
      }
    }

    messages.push({
      role: 'user',
      content: userContent,
    });

    // Add conversation history if available
    if (request.history && request.history.length > 0) {
      // Add last 4 messages for context (2 rounds of conversation)
      const relevantHistory = request.history.slice(-4);
      relevantHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }

    return messages;
  }

  private createAnalysisPrompt(request: AnalysisRequest): string {
    const { context } = request;

    return `Analyze this construction project and provide a detailed quote and analysis.

CONTEXT:
${context?.projectType ? `Project Type: ${context.projectType}` : ''}
${context?.budgetRange ? `Budget Range: £${context.budgetRange.min} - £${context.budgetRange.max}` : ''}
${context?.location ? `Location: ${context.location}` : 'UK-based project'}
${request.message ? `User Description: "${request.message}"` : ''}

REQUIREMENTS:
1. Identify the specific type of construction work needed
2. Provide accurate cost estimates using 2024 UK market rates
3. Include VAT, waste factors, and delivery charges
4. Consider regional variations (London +35%, etc.)
5. Provide realistic timelines with preparation and drying times
6. Specify required tools with rental costs
7. List safety considerations and permit requirements

IMPORTANT: Return ONLY a valid JSON object with this structure:

{
  "projectType": "Specific project description",
  "description": "Detailed analysis of work required",
  "difficultyLevel": "Easy|Moderate|Difficult|Professional Required",
  "costBreakdown": {
    "materials": {
      "min": 0,
      "max": 0,
      "items": [
        {
          "name": "Material name",
          "quantity": "Amount with units",
          "unitPrice": 0,
          "totalPrice": 0,
          "category": "structural|finishing|electrical|plumbing|other"
        }
      ]
    },
    "labor": {
      "min": 0,
      "max": 0,
      "hourlyRate": 0,
      "estimatedHours": 0
    },
    "total": {
      "min": 0,
      "max": 0
    }
  },
  "timeline": {
    "diy": "X days/weeks",
    "professional": "X days",
    "phases": [
      {
        "name": "Phase name",
        "duration": "X days",
        "description": "Work in this phase"
      }
    ]
  },
  "toolsRequired": [
    {
      "name": "Tool name",
      "category": "power_tools|hand_tools|heavy_machinery|safety",
      "dailyRentalPrice": 0,
      "estimatedDays": 0,
      "required": true,
      "alternatives": []
    }
  ],
  "safetyConsiderations": ["Safety points"],
  "permitsRequired": ["Required permits"],
  "requiresProfessional": false,
  "professionalReasons": [],
  "confidence": 85,
  "recommendations": ["Recommendations"],
  "warnings": []
}`;
  }

  private async callOpenAI(messages: any[], options: any = {}): Promise<string | null> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI');
      }

      // Log token usage for cost tracking
      if (data.usage) {
        console.log(
          `📊 OpenAI token usage - Input: ${data.usage.prompt_tokens}, Output: ${data.usage.completion_tokens}, Cost: $${this.estimateCost(data.usage)}`
        );
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private estimateCost(usage: any): string {
    // Rough cost estimates per 1K tokens (varies by model)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    };

    const modelCosts = costs[this.model] || costs['gpt-4o-mini'];
    const inputCost = (usage.prompt_tokens / 1000) * modelCosts.input;
    const outputCost = (usage.completion_tokens / 1000) * modelCosts.output;

    return (inputCost + outputCost).toFixed(4);
  }

  private parseOpenAIResponse(text: string): ProjectAnalysis {
    try {
      // Parse JSON response
      const parsed = JSON.parse(text);

      // Validate and ensure all required fields
      return {
        projectType: parsed.projectType || 'Construction Project',
        description: parsed.description || 'Project analysis completed',
        difficultyLevel: parsed.difficultyLevel || 'Moderate',
        costBreakdown: this.validateCostBreakdown(parsed.costBreakdown),
        timeline: parsed.timeline || {
          diy: '1-2 weeks',
          professional: '3-5 days',
          phases: [],
        },
        toolsRequired: parsed.toolsRequired || [],
        safetyConsiderations: parsed.safetyConsiderations || [],
        permitsRequired: parsed.permitsRequired || [],
        requiresProfessional: parsed.requiresProfessional || false,
        professionalReasons: parsed.professionalReasons || [],
        confidence: Math.min(100, Math.max(0, parsed.confidence || 80)),
        recommendations: parsed.recommendations || [],
        warnings: parsed.warnings || [],

        // Metadata (set by middleware)
        analysisId: '',
        timestamp: '',
        aiProvider: this.name,
        processingTimeMs: 0,
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }

  private validateCostBreakdown(breakdown: any): QuoteBreakdown {
    if (!breakdown) {
      return {
        materials: { min: 100, max: 500, items: [] },
        labor: { min: 200, max: 800, hourlyRate: 35, estimatedHours: 8 },
        total: { min: 300, max: 1300 },
      };
    }

    const materials = breakdown.materials || { min: 100, max: 500, items: [] };
    const labor = breakdown.labor || { min: 200, max: 800, hourlyRate: 35, estimatedHours: 8 };

    return {
      materials: {
        min: Math.max(0, materials.min || 0),
        max: Math.max(materials.min || 0, materials.max || 0),
        items: Array.isArray(materials.items) ? materials.items : [],
      },
      labor: {
        min: Math.max(0, labor.min || 0),
        max: Math.max(labor.min || 0, labor.max || 0),
        hourlyRate: Math.max(20, labor.hourlyRate || 35),
        estimatedHours: Math.max(1, labor.estimatedHours || 8),
      },
      total: {
        min: (materials.min || 0) + (labor.min || 0),
        max: (materials.max || 0) + (labor.max || 0),
      },
    };
  }
}

/**
 * Model Comparison Guide:
 *
 * gpt-4-vision-preview:
 * - Best for: Complex image analysis, detailed material identification
 * - Cost: Highest (~$10 per 1M input tokens)
 * - Speed: Slowest (3-5 seconds)
 * - When to use: Premium users, complex multi-trade projects
 *
 * gpt-4o:
 * - Best for: Balanced performance and cost
 * - Cost: Medium (~$5 per 1M input tokens)
 * - Speed: Fast (1-2 seconds)
 * - When to use: Standard analysis with good accuracy
 *
 * gpt-4o-mini:
 * - Best for: Quick, cost-effective analysis
 * - Cost: Lowest (~$0.15 per 1M input tokens)
 * - Speed: Very fast (<1 second)
 * - When to use: Default choice, simple projects
 */
