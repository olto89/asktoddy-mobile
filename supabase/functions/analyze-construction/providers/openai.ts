/**
 * OpenAI Provider for Supabase Edge Functions
 * Ready for activation when API key is provided
 * Supports GPT-4 Vision and GPT-4o models
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis, QuoteBreakdown } from '../types.ts';
import type { ContextualAnalysisRequest, ContextualProjectAnalysis } from '../context/types.ts';
import { ContextManager } from '../context/ContextManager.ts';
import { ConversationIntelligence } from '../intelligence/ConversationIntelligence.ts';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;
  private endpoint = 'https://api.openai.com/v1/chat/completions';
  private contextManager?: ContextManager;

  constructor(
    apiKey: string,
    model: 'gpt-4-vision-preview' | 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini',
    contextManager?: ContextManager
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.contextManager = contextManager;
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

  async analyzeImage(
    request: AnalysisRequest | ContextualAnalysisRequest
  ): Promise<ProjectAnalysis> {
    try {
      // Create comprehensive analysis prompt with context
      const prompt = await this.createAnalysisPrompt(request);
      const messages = this.buildMessages(request, prompt);

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
      const analysis = this.parseOpenAIResponse(response);

      // Update conversation context if ContextManager is available
      if (this.contextManager && 'sessionId' in request) {
        await this.updateConversationContext(request as ContextualAnalysisRequest, analysis);
      }

      return analysis;
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw new Error(
        `OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildMessages(
    request: AnalysisRequest | ContextualAnalysisRequest,
    prompt: string
  ): any[] {
    const messages: any[] = [];

    // System prompt for construction expertise
    messages.push({
      role: 'system',
      content: `You are a highly experienced UK construction contractor and estimator with 20+ years in the industry. 
      Analyze construction projects and provide comprehensive, accurate quotes using current 2024 UK market rates.
      Always return responses in valid JSON format with the exact structure specified in the prompt.`,
    });

    // Build user message with context
    const userContent: any[] = [
      {
        type: 'text',
        text: prompt,
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

  private async createAnalysisPrompt(
    request: AnalysisRequest | ContextualAnalysisRequest
  ): Promise<string> {
    const { context, message, history } = request;

    // Get conversation context and intelligence insights if available
    let conversationSummary = '';
    let previouslyAskedQuestions: string[] = [];
    let currentCompleteness = 0;
    let conversationInsights: any = null;
    let flowRecommendations: any[] = [];

    if (this.contextManager && 'sessionId' in request) {
      const contextualRequest = request as ContextualAnalysisRequest;
      const conversationContext = await this.contextManager.getContext(
        contextualRequest.sessionId,
        contextualRequest.userId
      );

      if (conversationContext) {
        // Use enhanced conversation intelligence
        conversationSummary = ConversationIntelligence.generateEnhancedSummary(conversationContext);
        conversationInsights = ConversationIntelligence.analyzeConversation(conversationContext);
        flowRecommendations =
          ConversationIntelligence.generateFlowRecommendations(conversationContext);

        previouslyAskedQuestions = conversationContext.questionHistory.map(q => q.question);
        currentCompleteness = conversationContext.completenessScore;
      }
    }

    const contextSection = conversationSummary
      ? `ENHANCED CONVERSATION CONTEXT:
${conversationSummary}

CONVERSATION INTELLIGENCE INSIGHTS:
${
  conversationInsights
    ? `
- Current Focus: ${conversationInsights.currentFocus}
- Conversation Quality: ${conversationInsights.conversationQuality}%
- Information Gaps: ${conversationInsights.informationGaps.join(', ') || 'None'}
- Suggested Questions: ${conversationInsights.suggestedQuestions.slice(0, 2).join(' OR ')}
- Next Best Actions: ${conversationInsights.nextBestActions.join(', ')}
`
    : ''
}

FLOW RECOMMENDATIONS:
${
  flowRecommendations.length > 0
    ? `
Primary Recommendation: ${flowRecommendations[0].action} - ${flowRecommendations[0].reasoning}
${flowRecommendations[0].suggestedContent ? `Suggested Content: ${flowRecommendations[0].suggestedContent}` : ''}
`
    : 'Continue natural conversation flow'
}

PREVIOUSLY ASKED QUESTIONS (NEVER REPEAT):
${previouslyAskedQuestions.length > 0 ? previouslyAskedQuestions.map(q => `- ${q}`).join('\n') : 'None'}

`
      : `CONTEXT:
${context?.projectType ? `Project Type: ${context.projectType}` : ''}
${context?.location ? `Location: ${context.location}` : 'UK-based project'}
${history ? `Previous Conversation: ${JSON.stringify(history.slice(-3))}` : ''}

`;

    // Add refinement section if present
    const refinementSection =
      'refinements' in request && request.refinements
        ? `QUOTE REFINEMENT REQUEST:
The user is refining a previous quote with the following feedback:

ORIGINAL QUOTE ANALYSIS:
${request.originalAnalysis ? JSON.stringify(request.originalAnalysis, null, 2) : 'Not provided'}

USER FEEDBACK:
- Quote Accuracy: ${request.refinements.feedback.accuracy}
- Comments: "${request.refinements.feedback.comments}"

USER PREFERENCES:
- Quality Level: ${request.refinements.preferences.qualityLevel} (budget/standard/premium)
- Timeline Preference: ${request.refinements.preferences.timelinePreference} (fastest/standard/flexible)
- Supplier Preference: ${request.refinements.preferences.supplierPreference} (cheapest/local/premium)

ADJUSTMENT INSTRUCTIONS:
- If accuracy is "too_high": Reduce costs by 10-20% while maintaining quality
- If accuracy is "too_low": Increase costs by 10-20% and justify with better materials/labour
- If accuracy is "about_right": Make fine adjustments based on preferences only
- Apply quality level adjustments: budget (-15%), standard (baseline), premium (+25%)
- Apply timeline adjustments: fastest (+20%), standard (baseline), flexible (-10%)
- Apply supplier adjustments: cheapest (-10%), local (baseline), premium (+15%)

IMPORTANT: Generate a completely NEW quote that incorporates this feedback, don't just modify the original.

`
        : '';

    return `You are a highly experienced construction contractor and estimator with 20+ years in the industry. You provide professional consultation by first assessing if you have enough information to give accurate quotes.

${contextSection}${refinementSection}ENHANCED INTELLIGENCE INSTRUCTIONS:
${previouslyAskedQuestions.length > 0 ? '- NEVER ask questions that have been previously asked\n- Build upon information already gathered\n- Reference previous answers when relevant\n' : ''}
${
  conversationInsights
    ? `- Current conversation quality is ${conversationInsights.conversationQuality}% - aim to improve this
- Focus primarily on: ${conversationInsights.currentFocus}
- Use intelligent question selection based on conversation flow
`
    : ''
}
${
  flowRecommendations.length > 0
    ? `- PRIMARY RECOMMENDATION: ${flowRecommendations[0].action.toUpperCase()} - ${flowRecommendations[0].reasoning}
${flowRecommendations[0].suggestedContent ? `- SUGGESTED APPROACH: ${flowRecommendations[0].suggestedContent}` : ''}
`
    : ''
}

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

TOTAL SCORE: Add all points (0-8)${currentCompleteness > 0 ? ` - Consider existing completeness of ${currentCompleteness}%` : ''}

PHASE 2: RESPONSE MODE SELECTION
Based on total score:

• 0-2 POINTS: CONVERSATION MODE
- Ask 2-3 specific clarifying questions about the project
- Focus on gathering missing critical information
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

${request.message ? `User message: "${request.message}"` : ''}

IMPORTANT: Return ONLY a valid JSON object. No markdown, no explanation text, just pure JSON that matches one of these response modes.`;
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

  /**
   * Update conversation context after successful analysis
   */
  private async updateConversationContext(
    request: ContextualAnalysisRequest,
    analysis: ProjectAnalysis
  ): Promise<void> {
    if (!this.contextManager) return;

    try {
      await this.contextManager.updateContext(request.sessionId, request.userId, {
        analysis,
        userMessage: request.message || '',
        timestamp: new Date().toISOString(),
      });
      console.log('📝 Conversation context updated via OpenAI');
    } catch (error) {
      console.error('Failed to update conversation context:', error);
      // Don't throw - context update failure shouldn't break the main flow
    }
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
