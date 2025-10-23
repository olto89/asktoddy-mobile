/**
 * Gemini AI Provider for Supabase Edge Functions
 * Adapted from src/services/ai/providers/GeminiProvider.ts for Deno environment
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis, QuoteBreakdown } from '../types.ts';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private model = 'gemini-2.0-flash-exp';
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      return false;
    }

    try {
      // Quick health check with a simple prompt
      const response = await this.generateContent('Test health check');
      return response !== null;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number }> {
    if (!this.apiKey) {
      return { status: 'down' };
    }

    const startTime = Date.now();
    try {
      await this.generateContent('Health check');
      const latency = Date.now() - startTime;

      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return { status: 'down' };
    }
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    try {
      // Create comprehensive analysis prompt
      const prompt = this.createAnalysisPrompt(request);

      let response: string;

      if (request.imageUri) {
        // Image analysis
        const imageData = await this.prepareImageData(request.imageUri);
        response = await this.generateContentWithImage(prompt, imageData);
      } else if (request.message) {
        // Text-only analysis
        const contextualPrompt = `${prompt}\n\nUser message: "${request.message}"\n\nProvide analysis based on the user's description.`;
        response = await this.generateContent(contextualPrompt);
      } else {
        throw new Error('Either imageUri or message is required');
      }

      // Parse and validate the response
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw new Error(
        `Gemini analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async generateContent(prompt: string): Promise<string> {
    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private async generateContentWithImage(prompt: string, imageData: any): Promise<string> {
    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, imageData],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  private async prepareImageData(imageUri: string): Promise<any> {
    try {
      let imageData: string;
      let mimeType: string;

      if (imageUri.startsWith('data:')) {
        // Handle data URLs (from camera or converted images)
        const [mimeTypePart, base64Data] = imageUri.split(',');
        mimeType = mimeTypePart.split(':')[1].split(';')[0];
        imageData = base64Data;
      } else if (imageUri.startsWith('http')) {
        // Handle HTTP URLs by fetching the image
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        mimeType = response.headers.get('content-type') || 'image/jpeg';
      } else {
        throw new Error('Unsupported image URI format');
      }

      return {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      };
    } catch (error) {
      throw new Error(`Failed to prepare image data: ${error}`);
    }
  }

  private createAnalysisPrompt(request: AnalysisRequest): string {
    const { context, message, history } = request;

    return `You are a highly experienced construction contractor and estimator with 20+ years in the industry. You provide professional consultation by first assessing if you have enough information to give accurate quotes.

CONTEXT:
${context?.projectType ? `Project Type: ${context.projectType}` : ''}
${context?.location ? `Location: ${context.location}` : 'UK-based project'}
${history ? `Previous Conversation: ${JSON.stringify(history.slice(-3))}` : ''}

PHASE 1: INFORMATION ASSESSMENT
Analyze the user's input and conversation history to score information completeness (0-8 points total):

1. PROJECT TYPE CLARITY (0-2 points):
   - 0: Vague ("renovation", "work needed")
   - 1: General ("kitchen", "bathroom", "extension") 
   - 2: Specific ("single-story kitchen extension", "ensuite bathroom renovation")

2. SIZE AND SCOPE (0-2 points):
   - 0: No size mentioned
   - 1: Vague size ("small", "big", "standard")
   - 2: Specific dimensions (sqm, room count, measurements)

3. QUALITY REQUIREMENTS (0-2 points):
   - 0: No quality level mentioned
   - 1: General preference ("nice", "good quality")
   - 2: Specific finish level ("mid-range", "luxury", "budget", specific brands)

4. PROJECT CONSTRAINTS (0-2 points):
   - 0: No additional details
   - 1: Some context (budget range, timing, existing conditions)
   - 2: Detailed constraints (access issues, planning permission, structural work, utilities)

TOTAL SCORE: Add all points (0-8)

PHASE 2: RESPONSE MODE SELECTION
Based on total score:

• 0-2 POINTS: CONVERSATION MODE
- Ask 2-3 specific clarifying questions about the project
- Provide helpful guidance on information needed
- DO NOT provide cost estimates
- Be professional and educational

• 3-5 POINTS: ESTIMATION MODE  
- Provide very rough cost range with major caveats
- Ask for remaining critical details
- Include strong disclaimers about accuracy
- Return simplified JSON with ranges only

• 6-8 POINTS: QUOTE MODE
- Generate detailed cost breakdown
- Include comprehensive analysis
- Return full JSON structure with detailed quotes
- Include professional disclaimers

CRITICAL RESPONSE FORMATS:

FOR CONVERSATION MODE (0-2 points):
Return a JSON object with this structure:
{
  "responseType": "conversation",
  "projectType": "Extension",
  "message": "I'd love to help with your extension! To provide an accurate quote, I need some details:\n\n📐 **Size & Type:**\n- What type of extension? (single-story, two-story, conservatory)\n- Approximate dimensions or square meters?\n- How many rooms will it include?\n\n🏠 **Purpose & Finish:**\n- What's the main use? (kitchen, living space, bedrooms)\n- Desired finish level? (basic, mid-range, high-end)\n\n📋 **Additional Details:**\n- Do you have any photos, plans, or drawings?\n- What's your rough budget expectation?\n- Any specific challenges? (access, existing utilities)",
  "questionsAsked": ["extension type", "dimensions", "purpose", "finish level"],
  "informationNeeded": ["size", "scope", "quality"],
  "confidence": 0
}

FOR ESTIMATION MODE (3-5 points):
Return a JSON object with this structure:
{
  "responseType": "estimation", 
  "projectType": "Single-story Extension",
  "message": "Based on the details provided, here's a rough estimate with important caveats:",
  "roughEstimate": {
    "min": 8000,
    "max": 15000,
    "caveats": ["Site survey needed for accuracy", "Based on assumed standard finishes", "Prices subject to planning requirements"]
  },
  "questionsAsked": ["finish specifications", "existing layout", "access considerations"],
  "confidence": 50,
  "recommendations": ["Get site survey", "Consider planning permission requirements"]
}

FOR QUOTE MODE (6-8 points):
Return the full detailed JSON structure with costBreakdown, timeline, etc. (use existing format)

USER INPUT: "${message || 'No specific message provided'}"

Analyze the above input and respond accordingly.`;
  }

  private parseGeminiResponse(text: string): ProjectAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Handle different response types
      if (parsed.responseType === 'conversation') {
        // Conversation mode - ask clarifying questions
        return {
          projectType: parsed.projectType || 'Construction Project',
          description: parsed.message || 'I need more information to provide an accurate quote.',
          difficultyLevel: 'Information Needed',
          responseType: 'conversation',
          questionsAsked: parsed.questionsAsked || [],
          informationNeeded: parsed.informationNeeded || [],
          costBreakdown: {
            materials: { min: 0, max: 0, items: [] },
            labor: { min: 0, max: 0, hourlyRate: 0, estimatedHours: 0 },
            total: { min: 0, max: 0 },
          },
          timeline: {
            diy: 'Information needed',
            professional: 'Information needed',
            phases: [],
          },
          toolsRequired: [],
          safetyConsiderations: [],
          permitsRequired: [],
          requiresProfessional: false,
          professionalReasons: [],
          confidence: parsed.confidence || 0,
          recommendations: parsed.recommendations || [],
          warnings: [],
          analysisId: '',
          timestamp: '',
          aiProvider: this.name,
          processingTimeMs: 0,
        };
      }

      if (parsed.responseType === 'estimation') {
        // Estimation mode - rough estimates with caveats
        return {
          projectType: parsed.projectType || 'Construction Project',
          description: parsed.message || 'Rough estimate provided with caveats.',
          difficultyLevel: 'Preliminary Estimate',
          responseType: 'estimation',
          questionsAsked: parsed.questionsAsked || [],
          roughEstimate: parsed.roughEstimate,
          costBreakdown: {
            materials: {
              min: Math.round((parsed.roughEstimate?.min || 0) * 0.4),
              max: Math.round((parsed.roughEstimate?.max || 0) * 0.6),
              items: [],
            },
            labor: {
              min: Math.round((parsed.roughEstimate?.min || 0) * 0.4),
              max: Math.round((parsed.roughEstimate?.max || 0) * 0.4),
              hourlyRate: 35,
              estimatedHours: 20,
            },
            total: {
              min: parsed.roughEstimate?.min || 0,
              max: parsed.roughEstimate?.max || 0,
            },
          },
          timeline: {
            diy: 'Requires detailed assessment',
            professional: 'Requires detailed assessment',
            phases: [],
          },
          toolsRequired: [],
          safetyConsiderations: parsed.roughEstimate?.caveats || [],
          permitsRequired: [],
          requiresProfessional: true,
          professionalReasons: ['Detailed assessment required'],
          confidence: parsed.confidence || 50,
          recommendations: parsed.recommendations || [
            'Site survey recommended',
            'Get multiple quotes',
          ],
          warnings: parsed.roughEstimate?.caveats || [],
          analysisId: '',
          timestamp: '',
          aiProvider: this.name,
          processingTimeMs: 0,
        };
      }

      // Quote mode - full detailed response (existing logic)
      return {
        projectType: parsed.projectType || 'Construction Project',
        description: parsed.description || 'Project analysis completed',
        difficultyLevel: parsed.difficultyLevel || 'Moderate',
        responseType: 'quote',
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
        confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
        recommendations: parsed.recommendations || [],
        warnings: parsed.warnings || [],
        analysisId: '',
        timestamp: '',
        aiProvider: this.name,
        processingTimeMs: 0,
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error}`);
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

    // Ensure minimum viable cost structure
    const materials = breakdown.materials || { min: 100, max: 500, items: [] };
    const labor = breakdown.labor || { min: 200, max: 800, hourlyRate: 30, estimatedHours: 8 };

    return {
      materials: {
        min: Math.max(0, materials.min || 0),
        max: Math.max(materials.min || 0, materials.max || 0),
        items: Array.isArray(materials.items) ? materials.items : [],
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
}
