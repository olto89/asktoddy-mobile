/**
 * Gemini AI Provider for Supabase Edge Functions
 * Adapted from src/services/ai/providers/GeminiProvider.ts for Deno environment
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis, QuoteBreakdown } from '../types.ts';
import type { ContextualAnalysisRequest, ContextualProjectAnalysis } from '../context/types.ts';
import { ContextManager } from '../context/ContextManager.ts';
import { ConversationIntelligence } from '../intelligence/ConversationIntelligence.ts';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private model = 'models/gemini-2.5-flash-preview-05-20'; // Updated to working model
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
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

  async analyzeImage(
    request: AnalysisRequest | ContextualAnalysisRequest
  ): Promise<ProjectAnalysis> {
    try {
      // Create comprehensive analysis prompt with context
      const prompt = await this.createAnalysisPrompt(request);

      let response: string;

      if (request.imageUri) {
        // Multi-modal analysis (images, PDFs, videos)
        const mediaData = await this.prepareMediaData(request.imageUri);
        response = await this.generateContentWithMedia(prompt, mediaData);
      } else if (request.message) {
        // Text-only analysis
        const contextualPrompt = `${prompt}\n\nUser message: "${request.message}"\n\nProvide analysis based on the user's description.`;
        response = await this.generateContent(contextualPrompt);
      } else {
        throw new Error('Either imageUri or message is required');
      }

      // Parse and validate the response
      const analysis = this.parseGeminiResponse(response);

      // Update conversation context if ContextManager is available
      if (this.contextManager && 'sessionId' in request) {
        await this.updateConversationContext(request as ContextualAnalysisRequest, analysis);
      }

      return analysis;
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

  private async generateContentWithMedia(prompt: string, mediaData: any): Promise<string> {
    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;

    // Enhanced prompt for multi-modal analysis
    const enhancedPrompt = this.enhancePromptForMediaType(prompt, mediaData.inlineData.mimeType);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: enhancedPrompt }, mediaData],
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

  private enhancePromptForMediaType(prompt: string, mimeType: string): string {
    const mediaSpecificInstructions = this.getMediaSpecificInstructions(mimeType);

    return `${prompt}

${mediaSpecificInstructions}

IMPORTANT: Provide detailed analysis of the provided ${this.getMediaTypeName(mimeType)} and integrate findings with any existing conversation context.`;
  }

  private getMediaSpecificInstructions(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return `IMAGE ANALYSIS INSTRUCTIONS:
- Examine the construction/renovation project shown in the image
- Identify materials, finishes, dimensions, and existing conditions  
- Note any structural elements, utilities, or access constraints
- Assess the scope of work required and potential challenges
- Look for quality indicators and existing damage or wear`;
    }

    if (mimeType === 'application/pdf') {
      return `PDF DOCUMENT ANALYSIS INSTRUCTIONS:
- Analyze architectural plans, specifications, or construction documents
- Extract key measurements, materials specifications, and design details
- Identify structural requirements, MEP systems, and finishing schedules
- Note any planning conditions, building regulations, or compliance requirements
- Extract cost information, timelines, or contractor requirements if present`;
    }

    if (mimeType.startsWith('video/')) {
      return `VIDEO ANALYSIS INSTRUCTIONS:
- Examine the construction site or project walkthrough
- Note spatial relationships, access routes, and site conditions
- Identify existing structures, utilities, and potential obstacles
- Assess the scope of work and complexity from multiple angles
- Look for details that static images might miss`;
    }

    return 'MEDIA ANALYSIS INSTRUCTIONS:\n- Analyze the provided content for construction/renovation planning purposes';
  }

  private getMediaTypeName(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'PDF document';
    if (mimeType.startsWith('video/')) return 'video';
    return 'media file';
  }

  private async prepareMediaData(mediaUri: string): Promise<any> {
    try {
      let mediaData: string;
      let mimeType: string;

      if (mediaUri.startsWith('data:')) {
        // Handle data URLs (from camera, files, or converted media)
        const [mimeTypePart, base64Data] = mediaUri.split(',');
        mimeType = mimeTypePart.split(':')[1].split(';')[0];
        mediaData = base64Data;
      } else if (mediaUri.startsWith('http')) {
        // Handle HTTP URLs by fetching the media
        const response = await fetch(mediaUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        mediaData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        mimeType = response.headers.get('content-type') || this.detectMimeTypeFromUrl(mediaUri);
      } else {
        throw new Error('Unsupported media URI format');
      }

      // Validate supported MIME types for Gemini
      const supportedTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // PDFs
        'application/pdf',
        // Videos (if needed later)
        'video/mp4',
        'video/mpeg',
        'video/mov',
        'video/avi',
        'video/webm',
      ];

      if (!supportedTypes.includes(mimeType)) {
        throw new Error(
          `Unsupported media type: ${mimeType}. Supported types: ${supportedTypes.join(', ')}`
        );
      }

      console.log(`📎 Processing ${mimeType} media for Gemini analysis`);

      return {
        inlineData: {
          data: mediaData,
          mimeType: mimeType,
        },
      };
    } catch (error) {
      throw new Error(`Failed to prepare media data: ${error}`);
    }
  }

  private detectMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeMap: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
      mov: 'video/mov',
      avi: 'video/avi',
    };
    return mimeMap[extension || ''] || 'image/jpeg';
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

  /**
   * Update conversation context after analysis
   */
  private async updateConversationContext(
    request: ContextualAnalysisRequest,
    analysis: ProjectAnalysis
  ): Promise<void> {
    if (!this.contextManager) return;

    try {
      // Get current conversation context for enhanced categorization
      const conversationContext = await this.contextManager.getContext(
        request.sessionId,
        request.userId
      );
      // Prepare media information if present
      let mediaInfo: any = undefined;
      if (request.imageUri) {
        mediaInfo = await this.extractMediaInfo(request.imageUri, analysis);
      }

      // Add user message to conversation history
      if (request.message) {
        await this.contextManager.addMessage(
          request.sessionId,
          'user',
          request.message,
          undefined,
          undefined,
          mediaInfo
        );
      } else if (request.imageUri) {
        // Image-only request
        await this.contextManager.addMessage(
          request.sessionId,
          'user',
          `[Shared ${mediaInfo?.type || 'media'} for analysis]`,
          undefined,
          undefined,
          mediaInfo
        );
      }

      // Add assistant response to conversation history
      await this.contextManager.addMessage(
        request.sessionId,
        'assistant',
        analysis.description,
        undefined,
        analysis.responseType
      );

      // Extract and record any questions asked in the response using enhanced categorization
      if (analysis.questionsAsked) {
        for (const question of analysis.questionsAsked) {
          const category = ConversationIntelligence.categorizeQuestion(
            question,
            conversationContext
          );
          await this.contextManager.addQuestion(
            request.sessionId,
            question,
            category.name,
            category.priority
          );
        }
      }

      // Update project profile with any new information from the analysis
      const profileUpdates: any = {};

      if (analysis.projectType && analysis.projectType !== 'Construction Project') {
        profileUpdates.projectType = analysis.projectType;
      }

      // Extract information from the user's message
      if (request.message) {
        const messageInfo = this.extractProjectInfo(request.message);
        Object.assign(profileUpdates, messageInfo);
      }

      if (Object.keys(profileUpdates).length > 0) {
        await this.contextManager.updateProjectProfile(request.sessionId, profileUpdates);
      }

      // Update conversation phase based on response type
      const phaseMap: Record<string, any> = {
        conversation: 'discovery',
        estimation: 'estimation',
        quote: 'quoting',
      };

      if (analysis.responseType && phaseMap[analysis.responseType]) {
        await this.contextManager.updatePhase(request.sessionId, phaseMap[analysis.responseType]);
      }
    } catch (error) {
      console.error('Failed to update conversation context:', error);
      // Don't throw error as this shouldn't break the analysis flow
    }
  }

  /**
   * Extract media information for context storage
   */
  private async extractMediaInfo(mediaUri: string, analysis: ProjectAnalysis): Promise<any> {
    try {
      // Detect media type from URI
      let mimeType = 'image/jpeg';
      let mediaType: 'image' | 'pdf' | 'video' | 'document' = 'image';

      if (mediaUri.startsWith('data:')) {
        const [mimeTypePart] = mediaUri.split(',');
        mimeType = mimeTypePart.split(':')[1].split(';')[0];
      } else {
        mimeType = this.detectMimeTypeFromUrl(mediaUri);
      }

      // Determine media type category
      if (mimeType.startsWith('image/')) {
        mediaType = 'image';
      } else if (mimeType === 'application/pdf') {
        mediaType = 'pdf';
      } else if (mimeType.startsWith('video/')) {
        mediaType = 'video';
      } else {
        mediaType = 'document';
      }

      // Generate description from analysis
      const description = this.generateMediaDescription(analysis, mediaType);

      // Extract key information from analysis
      const extractedInfo = this.extractKeyInfoFromAnalysis(analysis);

      return {
        type: mediaType,
        mimeType: mimeType,
        description: description,
        extractedInfo: extractedInfo,
        confidence: analysis.confidence || 70,
      };
    } catch (error) {
      console.warn('Failed to extract media info:', error);
      return {
        type: 'image',
        mimeType: 'image/jpeg',
        description: 'Construction-related media',
        extractedInfo: [],
        confidence: 50,
      };
    }
  }

  private generateMediaDescription(analysis: ProjectAnalysis, mediaType: string): string {
    const project = analysis.projectType || 'construction project';
    switch (mediaType) {
      case 'image':
        return `Image of ${project.toLowerCase()} showing construction details and scope`;
      case 'pdf':
        return `PDF document containing ${project.toLowerCase()} plans, specifications, or requirements`;
      case 'video':
        return `Video walkthrough of ${project.toLowerCase()} site and conditions`;
      default:
        return `Document related to ${project.toLowerCase()}`;
    }
  }

  private extractKeyInfoFromAnalysis(analysis: ProjectAnalysis): string[] {
    const keyInfo: string[] = [];

    if (analysis.projectType) {
      keyInfo.push(`Project type: ${analysis.projectType}`);
    }

    if (analysis.costBreakdown?.total) {
      keyInfo.push(
        `Estimated cost: £${analysis.costBreakdown.total.min}-£${analysis.costBreakdown.total.max}`
      );
    }

    if (analysis.difficultyLevel) {
      keyInfo.push(`Difficulty: ${analysis.difficultyLevel}`);
    }

    if (analysis.timeline?.professional) {
      keyInfo.push(`Timeline: ${analysis.timeline.professional}`);
    }

    if (analysis.requiresProfessional) {
      keyInfo.push('Professional required');
    }

    return keyInfo.slice(0, 5); // Limit to 5 key points
  }

  /**
   * Categorize a question for tracking purposes
   */
  private categorizeQuestion(question: string): string {
    const questionLower = question.toLowerCase();

    if (
      questionLower.includes('type') ||
      questionLower.includes('kind') ||
      questionLower.includes('what')
    ) {
      return 'project_type';
    }
    if (
      questionLower.includes('size') ||
      questionLower.includes('area') ||
      questionLower.includes('dimension')
    ) {
      return 'size_scope';
    }
    if (
      questionLower.includes('budget') ||
      questionLower.includes('cost') ||
      questionLower.includes('price')
    ) {
      return 'budget_constraints';
    }
    if (
      questionLower.includes('quality') ||
      questionLower.includes('finish') ||
      questionLower.includes('level')
    ) {
      return 'quality_finish';
    }
    if (
      questionLower.includes('time') ||
      questionLower.includes('when') ||
      questionLower.includes('deadline')
    ) {
      return 'timeline';
    }
    if (
      questionLower.includes('access') ||
      questionLower.includes('constraint') ||
      questionLower.includes('limitation')
    ) {
      return 'access_limitations';
    }

    return 'preferences';
  }

  /**
   * Extract project information from user message
   */
  private extractProjectInfo(message: string): any {
    const messageLower = message.toLowerCase();
    const info: any = {};

    // Extract dimensions/size
    const dimensionPattern = /(\d+)\s*(x|by|×)\s*(\d+)\s*(m|meter|metre|sqm|square)/i;
    const sizeMatch = message.match(dimensionPattern);
    if (sizeMatch) {
      const area = parseInt(sizeMatch[1]) * parseInt(sizeMatch[3]);
      info.scope = {
        size: {
          area,
          dimensions: `${sizeMatch[1]}m x ${sizeMatch[3]}m`,
        },
      };
    }

    // Extract budget information
    const budgetPattern = /£(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    const budgetMatches = Array.from(message.matchAll(budgetPattern));
    if (budgetMatches.length > 0) {
      const amounts = budgetMatches.map(match => parseInt(match[1].replace(',', '')));
      if (amounts.length === 1) {
        info.scope = { ...info.scope, budget: { max: amounts[0] } };
      } else if (amounts.length >= 2) {
        info.scope = {
          ...info.scope,
          budget: {
            range: `£${Math.min(...amounts)}-£${Math.max(...amounts)}`,
            max: Math.max(...amounts),
          },
        };
      }
    }

    // Extract project type specifics
    if (messageLower.includes('kitchen')) {
      info.projectType = 'Kitchen renovation';
    } else if (messageLower.includes('bathroom')) {
      info.projectType = 'Bathroom renovation';
    } else if (messageLower.includes('extension')) {
      info.projectType = 'Extension';
    } else if (messageLower.includes('loft')) {
      info.projectType = 'Loft conversion';
    }

    // Extract quality level
    if (
      messageLower.includes('luxury') ||
      messageLower.includes('high-end') ||
      messageLower.includes('premium')
    ) {
      info.requirements = { finishLevel: 'luxury' };
    } else if (messageLower.includes('mid-range') || messageLower.includes('standard')) {
      info.requirements = { finishLevel: 'mid-range' };
    } else if (
      messageLower.includes('budget') ||
      messageLower.includes('basic') ||
      messageLower.includes('cheap')
    ) {
      info.requirements = { finishLevel: 'budget' };
    }

    return info;
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
