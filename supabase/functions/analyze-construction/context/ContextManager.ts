/**
 * ContextManager - Handles conversation context storage and retrieval
 */

const IS_DEBUG = Deno.env.get('DEBUG') === 'true' || Deno.env.get('APP_ENV') === 'development';
const debug = (...args: unknown[]) => {
  if (IS_DEBUG) console.log(...args);
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  ConversationContext,
  ConversationSessionRow,
  ProjectProfile,
  QuestionHistory,
  MessageSummary,
  ConversationPhase,
} from './types.ts';

export class ContextManager {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Retrieve conversation context by session ID
   */
  async getContext(sessionId: string, userId?: string): Promise<ConversationContext | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - this is a new conversation
          return null;
        }
        throw error;
      }

      return this.mapRowToContext(data);
    } catch (error) {
      console.error('Error retrieving conversation context:', error);
      return null;
    }
  }

  /**
   * Save or update conversation context
   */
  async saveContext(context: ConversationContext): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('upsert_conversation_session', {
        p_session_id: context.sessionId,
        p_user_id: context.userId || null,
        p_project_profile: context.projectProfile,
        p_question_history: context.questionHistory,
        p_message_history: context.messageHistory,
        p_current_phase: context.currentPhase,
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving conversation context:', error);
      return false;
    }
  }

  /**
   * Add a question to the history
   */
  async addQuestion(
    sessionId: string,
    question: string,
    category: string,
    importance: 'critical' | 'important' | 'optional' = 'important'
  ): Promise<boolean> {
    const context = await this.getContext(sessionId);
    if (!context) {
      debug('Cannot add question - no context found for session:', sessionId);
      return false;
    }

    const questionEntry: QuestionHistory = {
      question,
      askedAt: new Date().toISOString(),
      category: category as any,
      importance,
    };

    context.questionHistory.push(questionEntry);
    context.lastUpdated = new Date().toISOString();

    return await this.saveContext(context);
  }

  /**
   * Record an answer to a previously asked question
   */
  async recordAnswer(sessionId: string, questionText: string, answer: string): Promise<boolean> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return false;
    }

    // Find the most recent matching question
    const questionIndex = context.questionHistory
      .map((q, index) => ({ ...q, index }))
      .reverse()
      .find(q => q.question.toLowerCase().includes(questionText.toLowerCase()) && !q.answer)?.index;

    if (questionIndex !== undefined) {
      context.questionHistory[questionIndex].answer = answer;
      context.questionHistory[questionIndex].answeredAt = new Date().toISOString();
      context.lastUpdated = new Date().toISOString();

      return await this.saveContext(context);
    }

    return false;
  }

  /**
   * Add a message to the conversation history
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    keyInfo?: string[],
    responseType?: 'conversation' | 'estimation' | 'quote',
    mediaInfo?: {
      type: 'image' | 'pdf' | 'video' | 'document';
      mimeType: string;
      description?: string;
      extractedInfo?: string[];
      confidence?: number;
    }
  ): Promise<boolean> {
    const context = await this.getContext(sessionId);
    if (!context) {
      debug('Cannot add message - no context found for session:', sessionId);
      return false;
    }

    const message: MessageSummary = {
      role,
      content: this.summarizeContent(content),
      timestamp: new Date().toISOString(),
      keyInfo,
      responseType,
      hasMedia: !!mediaInfo,
      attachments: mediaInfo ? [mediaInfo] : undefined,
    };

    context.messageHistory.push(message);

    // Keep only last 20 messages to prevent context from growing too large
    if (context.messageHistory.length > 20) {
      context.messageHistory = context.messageHistory.slice(-20);
    }

    context.lastUpdated = new Date().toISOString();

    debug(
      `💾 Added ${role} message with${mediaInfo ? ` ${mediaInfo.type}` : 'out'} media to session ${sessionId}`
    );

    return await this.saveContext(context);
  }

  /**
   * Update project profile with new information
   */
  async updateProjectProfile(
    sessionId: string,
    updates: Partial<ProjectProfile>
  ): Promise<boolean> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return false;
    }

    // Merge updates into existing profile
    context.projectProfile = {
      ...context.projectProfile,
      ...updates,
    };

    // Update completeness score based on new information
    context.completenessScore = this.calculateCompleteness(context.projectProfile);
    context.lastUpdated = new Date().toISOString();

    return await this.saveContext(context);
  }

  /**
   * Check if a question has been asked before
   */
  async hasQuestionBeenAsked(sessionId: string, questionPattern: string): Promise<boolean> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return false;
    }

    const pattern = questionPattern.toLowerCase();
    return context.questionHistory.some(
      q =>
        q.question.toLowerCase().includes(pattern) ||
        this.extractKeywords(q.question).some(keyword => pattern.includes(keyword))
    );
  }

  /**
   * Get unanswered questions for a session
   */
  async getUnansweredQuestions(sessionId: string): Promise<QuestionHistory[]> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return [];
    }

    return context.questionHistory.filter(q => !q.answer);
  }

  /**
   * Create a new conversation context
   */
  createNewContext(sessionId: string, userId?: string): ConversationContext {
    const now = new Date().toISOString();

    return {
      sessionId,
      userId,
      createdAt: now,
      lastUpdated: now,
      projectProfile: {},
      questionHistory: [],
      messageHistory: [],
      currentPhase: 'discovery',
      completenessScore: 0,
    };
  }

  /**
   * Update conversation phase
   */
  async updatePhase(sessionId: string, phase: ConversationPhase): Promise<boolean> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return false;
    }

    context.currentPhase = phase;
    context.lastUpdated = new Date().toISOString();

    return await this.saveContext(context);
  }

  /**
   * Generate conversation summary for AI context
   * Note: This method is kept for backwards compatibility, but enhanced summary
   * is now available via ConversationIntelligence.generateEnhancedSummary()
   */
  async generateConversationSummary(sessionId: string): Promise<string> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return '';
    }

    const summary: string[] = [];

    // Add project profile summary
    if (Object.keys(context.projectProfile).length > 0) {
      summary.push('**Project Information:**');
      if (context.projectProfile.projectType) {
        summary.push(`- Type: ${context.projectProfile.projectType}`);
      }
      if (context.projectProfile.scope?.size?.area) {
        summary.push(`- Size: ${context.projectProfile.scope.size.area}sqm`);
      }
      if (context.projectProfile.scope?.budget?.range) {
        summary.push(`- Budget: ${context.projectProfile.scope.budget.range}`);
      }
      if (context.projectProfile.requirements?.finishLevel) {
        summary.push(`- Quality: ${context.projectProfile.requirements.finishLevel}`);
      }
    }

    // Add answered questions
    const answeredQuestions = context.questionHistory.filter(q => q.answer);
    if (answeredQuestions.length > 0) {
      summary.push('\n**Previous Answers:**');
      answeredQuestions.slice(-5).forEach(q => {
        summary.push(`- ${q.question}: ${q.answer}`);
      });
    }

    // Add conversation phase
    summary.push(`\n**Current Phase:** ${context.currentPhase}`);
    summary.push(`**Completeness:** ${context.completenessScore}%`);

    return summary.join('\n');
  }

  /**
   * Get conversation insights using enhanced intelligence
   */
  async getConversationInsights(sessionId: string): Promise<any> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return null;
    }

    // Import ConversationIntelligence dynamically to avoid circular imports
    const { ConversationIntelligence } = await import(
      '../intelligence/ConversationIntelligence.ts'
    );
    return ConversationIntelligence.analyzeConversation(context);
  }

  /**
   * Get flow recommendations for the conversation
   */
  async getFlowRecommendations(sessionId: string): Promise<any[]> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return [];
    }

    // Import ConversationIntelligence dynamically to avoid circular imports
    const { ConversationIntelligence } = await import(
      '../intelligence/ConversationIntelligence.ts'
    );
    return ConversationIntelligence.generateFlowRecommendations(context);
  }

  /**
   * Private helper methods
   */
  private mapRowToContext(row: ConversationSessionRow): ConversationContext {
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      createdAt: row.created_at,
      lastUpdated: row.updated_at,
      projectProfile: row.project_profile as ProjectProfile,
      questionHistory: row.question_history as QuestionHistory[],
      messageHistory: row.message_history as MessageSummary[],
      currentPhase: row.current_phase,
      completenessScore: row.completeness_score,
    };
  }

  private summarizeContent(content: string): string {
    // Keep content under 200 characters for storage efficiency
    if (content.length <= 200) {
      return content;
    }

    // Extract key information and summarize
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    let summary = sentences[0];

    for (let i = 1; i < sentences.length; i++) {
      if ((summary + ' ' + sentences[i]).length <= 200) {
        summary += '. ' + sentences[i];
      } else {
        break;
      }
    }

    return summary + (content.length > summary.length ? '...' : '');
  }

  private calculateCompleteness(profile: ProjectProfile): number {
    let score = 0;
    const maxScore = 8;

    // Project type clarity (0-2 points)
    if (profile.projectType) {
      score += profile.specificType ? 2 : 1;
    }

    // Size and scope (0-2 points)
    if (profile.scope?.size) {
      score += profile.scope.size.area || profile.scope.size.dimensions ? 2 : 1;
    }

    // Quality requirements (0-2 points)
    if (profile.requirements?.finishLevel) {
      score += profile.requirements.specificRequirements ? 2 : 1;
    }

    // Project constraints (0-2 points)
    if (profile.scope?.budget || profile.scope?.timeline || profile.constraints) {
      score += (profile.scope?.budget && profile.scope?.timeline) || profile.constraints ? 2 : 1;
    }

    return Math.round((score / maxScore) * 100);
  }

  private extractKeywords(text: string): string[] {
    // Extract important keywords from question text
    const keywords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(
        word =>
          ![
            'what',
            'where',
            'when',
            'how',
            'why',
            'would',
            'could',
            'should',
            'will',
            'with',
            'your',
            'the',
            'and',
            'for',
            'are',
            'you',
            'this',
            'that',
          ].includes(word)
      );

    return keywords;
  }
}
