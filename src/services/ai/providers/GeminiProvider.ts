import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIProvider, AnalysisRequest, ProjectAnalysis, QuoteBreakdown } from '../types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initialize();
  }

  private initialize(): void {
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      console.warn('❌ Gemini: Invalid API key provided');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // Use the working model from our web app
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      console.log('✅ Gemini provider initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini provider:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.model) return false;

    try {
      // Quick health check with a simple prompt
      await this.model.generateContent('Test');
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number }> {
    if (!this.model) {
      return { status: 'down' };
    }

    const startTime = Date.now();
    try {
      await this.model.generateContent('Health check');
      const latency = Date.now() - startTime;

      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      return { status: 'down' };
    }
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    try {
      // Convert image to format Gemini can process
      const imageData = await this.prepareImageData(request.imageUri);

      // Create comprehensive analysis prompt
      const prompt = this.createAnalysisPrompt(request);

      // Send to Gemini
      const result = await this.model.generateContent([prompt, imageData]);

      const response = await result.response;
      const text = response.text();

      // Parse and validate the response
      return this.parseGeminiResponse(text);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw new Error(
        `Gemini analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
      } else if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
        // Handle local file URIs (React Native)
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        imageData = Buffer.from(arrayBuffer).toString('base64');
        mimeType = blob.type || 'image/jpeg';
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
    const { additionalContext } = request;

    return `You are a highly experienced construction contractor and estimator with 20+ years in the industry. Analyze this construction project image and provide a comprehensive, accurate quote and project analysis.

CONTEXT:
${additionalContext?.projectType ? `Project Type: ${additionalContext.projectType}` : ''}
${additionalContext?.budgetRange ? `Budget Range: £${additionalContext.budgetRange.min} - £${additionalContext.budgetRange.max}` : ''}
${additionalContext?.location ? `Location: ${additionalContext.location}` : 'UK-based project'}

ANALYSIS REQUIREMENTS:
1. VISUAL INSPECTION: Carefully examine the image for:
   - Room/space dimensions (estimate from visible references)
   - Current condition of surfaces, fixtures, and materials
   - Structural elements visible
   - Complexity factors (electrical, plumbing, access)
   - Quality of existing work

2. PROJECT IDENTIFICATION: Determine the specific type of work needed

3. ACCURATE COSTING (2024 UK market rates):
   - Materials: Include VAT, waste factors, delivery
   - Labor: Use current UK trade rates (£200-400/day skilled)
   - Account for regional variations
   - Include hidden costs (building control, skips, etc.)

4. REALISTIC TIMELINES: Factor in preparation, drying times, inspections

5. TOOL REQUIREMENTS: Specify tools needed with realistic rental costs

CRITICAL: Return ONLY a valid JSON object with this exact structure:

{
  "projectType": "Specific project description",
  "description": "Detailed description of work needed",
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
        "description": "What happens in this phase"
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
      "alternatives": ["Alternative tools"]
    }
  ],
  "safetyConsiderations": ["Safety point 1", "Safety point 2"],
  "permitsRequired": ["Required permits"],
  "requiresProfessional": true,
  "professionalReasons": ["Reason if professional required"],
  "confidence": 85,
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "warnings": ["Warning 1 if any"]
}

Ensure all costs are in GBP (£) and realistic for 2024 UK market rates.`;
  }

  private parseGeminiResponse(text: string): ProjectAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and enhance the response
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
        confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
        recommendations: parsed.recommendations || [],
        warnings: parsed.warnings || [],

        // Will be set by middleware
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
