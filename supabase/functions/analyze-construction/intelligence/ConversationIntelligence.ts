/**
 * Enhanced Conversation Intelligence System
 * Provides smarter question categorization, flow management, and context awareness
 */

import type {
  ConversationContext,
  ProjectProfile,
  QuestionHistory,
  MessageSummary,
  ConversationPhase,
} from '../context/types.ts';

export interface QuestionCategory {
  name: string;
  priority: 'critical' | 'important' | 'optional';
  phase: ConversationPhase;
  dependencies?: string[];
  maxRepeats?: number;
}

export interface ConversationInsights {
  currentFocus: string;
  suggestedQuestions: string[];
  informationGaps: string[];
  conversationQuality: number;
  nextBestActions: string[];
  phaseReadiness: {
    estimation: boolean;
    quote: boolean;
    completion: boolean;
  };
}

export interface FlowRecommendation {
  action:
    | 'ask_question'
    | 'provide_estimate'
    | 'generate_quote'
    | 'clarify_previous'
    | 'summarize_progress';
  reasoning: string;
  suggestedContent?: string;
  priority: number;
}

export class ConversationIntelligence {
  private static questionCategories: Record<string, QuestionCategory> = {
    // Project Type & Scope
    project_type: {
      name: 'project_type',
      priority: 'critical',
      phase: 'discovery',
    },
    specific_type: {
      name: 'specific_type',
      priority: 'critical',
      phase: 'discovery',
      dependencies: ['project_type'],
    },
    project_scope: {
      name: 'project_scope',
      priority: 'critical',
      phase: 'discovery',
      dependencies: ['project_type'],
    },

    // Size & Dimensions
    dimensions: {
      name: 'dimensions',
      priority: 'critical',
      phase: 'discovery',
    },
    room_count: {
      name: 'room_count',
      priority: 'important',
      phase: 'discovery',
      dependencies: ['project_type'],
    },
    layout: {
      name: 'layout',
      priority: 'important',
      phase: 'discovery',
      dependencies: ['dimensions'],
    },

    // Quality & Requirements
    finish_level: {
      name: 'finish_level',
      priority: 'critical',
      phase: 'discovery',
    },
    specific_requirements: {
      name: 'specific_requirements',
      priority: 'important',
      phase: 'discovery',
      dependencies: ['finish_level'],
    },
    brand_preferences: {
      name: 'brand_preferences',
      priority: 'optional',
      phase: 'estimation',
      dependencies: ['finish_level'],
    },

    // Budget & Timeline
    budget_range: {
      name: 'budget_range',
      priority: 'critical',
      phase: 'discovery',
    },
    timeline: {
      name: 'timeline',
      priority: 'important',
      phase: 'discovery',
    },
    flexibility: {
      name: 'flexibility',
      priority: 'optional',
      phase: 'estimation',
      dependencies: ['budget_range', 'timeline'],
    },

    // Technical & Constraints
    existing_conditions: {
      name: 'existing_conditions',
      priority: 'important',
      phase: 'discovery',
    },
    access_constraints: {
      name: 'access_constraints',
      priority: 'important',
      phase: 'estimation',
    },
    planning_permission: {
      name: 'planning_permission',
      priority: 'important',
      phase: 'estimation',
      dependencies: ['project_type', 'dimensions'],
    },
    utilities: {
      name: 'utilities',
      priority: 'important',
      phase: 'estimation',
      dependencies: ['existing_conditions'],
    },

    // Advanced Details
    materials: {
      name: 'materials',
      priority: 'optional',
      phase: 'estimation',
      dependencies: ['finish_level'],
    },
    sustainability: {
      name: 'sustainability',
      priority: 'optional',
      phase: 'estimation',
    },
    special_features: {
      name: 'special_features',
      priority: 'optional',
      phase: 'estimation',
      dependencies: ['specific_requirements'],
    },
  };

  /**
   * Categorize a question based on its content and context
   */
  static categorizeQuestion(questionText: string, context?: ConversationContext): QuestionCategory {
    const text = questionText.toLowerCase();

    // Project type questions
    if (
      text.includes('type') ||
      text.includes('kind') ||
      (text.includes('what') && (text.includes('project') || text.includes('work')))
    ) {
      return this.questionCategories.project_type;
    }

    // Size and dimensions
    if (
      text.includes('size') ||
      text.includes('dimension') ||
      text.includes('area') ||
      text.includes('square') ||
      text.includes('meter')
    ) {
      return this.questionCategories.dimensions;
    }

    // Quality and finish
    if (
      text.includes('quality') ||
      text.includes('finish') ||
      text.includes('standard') ||
      text.includes('level')
    ) {
      return this.questionCategories.finish_level;
    }

    // Budget questions
    if (
      text.includes('budget') ||
      text.includes('cost') ||
      text.includes('price') ||
      text.includes('afford')
    ) {
      return this.questionCategories.budget_range;
    }

    // Timeline questions
    if (
      text.includes('when') ||
      text.includes('time') ||
      text.includes('deadline') ||
      text.includes('urgent')
    ) {
      return this.questionCategories.timeline;
    }

    // Room and layout
    if (text.includes('room') || text.includes('layout') || text.includes('how many')) {
      return this.questionCategories.room_count;
    }

    // Access and constraints
    if (
      text.includes('access') ||
      text.includes('constraint') ||
      text.includes('difficult') ||
      text.includes('challenge')
    ) {
      return this.questionCategories.access_constraints;
    }

    // Planning and permissions
    if (
      text.includes('planning') ||
      text.includes('permission') ||
      text.includes('permit') ||
      text.includes('approval')
    ) {
      return this.questionCategories.planning_permission;
    }

    // Materials and specifications
    if (
      text.includes('material') ||
      text.includes('brand') ||
      text.includes('specification') ||
      text.includes('prefer')
    ) {
      return this.questionCategories.materials;
    }

    // Default to general project scope
    return this.questionCategories.project_scope;
  }

  /**
   * Analyze conversation and provide intelligent insights
   */
  static analyzeConversation(context: ConversationContext): ConversationInsights {
    const profile = context.projectProfile;
    const questions = context.questionHistory;
    const messages = context.messageHistory;

    // Determine current focus based on recent questions and missing information
    const currentFocus = this.determineCurrentFocus(profile, questions);

    // Identify information gaps
    const informationGaps = this.identifyInformationGaps(profile, questions);

    // Calculate conversation quality score
    const conversationQuality = this.calculateConversationQuality(context);

    // Generate suggested questions
    const suggestedQuestions = this.generateSuggestedQuestions(
      profile,
      questions,
      context.currentPhase
    );

    // Determine next best actions
    const nextBestActions = this.determineNextActions(context);

    // Assess phase readiness
    const phaseReadiness = this.assessPhaseReadiness(context);

    return {
      currentFocus,
      suggestedQuestions,
      informationGaps,
      conversationQuality,
      nextBestActions,
      phaseReadiness,
    };
  }

  /**
   * Generate flow recommendations for next conversation step
   */
  static generateFlowRecommendations(context: ConversationContext): FlowRecommendation[] {
    const insights = this.analyzeConversation(context);
    const recommendations: FlowRecommendation[] = [];

    // Check for critical information gaps
    const criticalGaps = insights.informationGaps.filter(
      gap => this.questionCategories[gap]?.priority === 'critical'
    );

    if (criticalGaps.length > 0) {
      recommendations.push({
        action: 'ask_question',
        reasoning: `Missing critical information: ${criticalGaps.join(', ')}`,
        suggestedContent: this.generateQuestionPrompt(criticalGaps[0], context),
        priority: 10,
      });
    }

    // Check for phase transition opportunities
    if (insights.phaseReadiness.estimation && context.currentPhase === 'discovery') {
      recommendations.push({
        action: 'provide_estimate',
        reasoning: 'Sufficient information gathered for rough estimation',
        priority: 8,
      });
    }

    if (insights.phaseReadiness.quote && context.currentPhase !== 'quote') {
      recommendations.push({
        action: 'generate_quote',
        reasoning: 'Comprehensive information available for detailed quote',
        priority: 9,
      });
    }

    // Check for unclear previous responses
    const unansweredQuestions = context.questionHistory.filter(q => !q.answer);
    if (unansweredQuestions.length > 0) {
      recommendations.push({
        action: 'clarify_previous',
        reasoning: `${unansweredQuestions.length} previous questions remain unanswered`,
        suggestedContent: this.generateClarificationPrompt(unansweredQuestions),
        priority: 7,
      });
    }

    // Consider conversation quality improvements
    if (insights.conversationQuality < 60) {
      recommendations.push({
        action: 'summarize_progress',
        reasoning: 'Conversation quality below optimal - summarize progress to refocus',
        priority: 6,
      });
    }

    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Enhanced context summarization with relevance scoring
   */
  static generateEnhancedSummary(context: ConversationContext): string {
    const profile = context.projectProfile;
    const insights = this.analyzeConversation(context);

    const summary: string[] = [];

    // Add current focus and phase
    summary.push(`**Current Focus:** ${insights.currentFocus}`);
    summary.push(`**Conversation Phase:** ${context.currentPhase}`);
    summary.push(`**Information Quality:** ${insights.conversationQuality}%`);

    // Add critical project information with confidence levels
    if (Object.keys(profile).length > 0) {
      summary.push('\n**Confirmed Project Details:**');

      if (profile.projectType) {
        const confidence = profile.specificType ? 'High' : 'Medium';
        summary.push(`- Type: ${profile.projectType} (${confidence} confidence)`);
      }

      if (profile.scope?.size?.area) {
        summary.push(`- Size: ${profile.scope.size.area}sqm (Confirmed)`);
      } else if (profile.scope?.size?.dimensions) {
        summary.push(`- Dimensions: ${profile.scope.size.dimensions} (Confirmed)`);
      }

      if (profile.scope?.budget?.range) {
        summary.push(`- Budget: ${profile.scope.budget.range} (Stated)`);
      }

      if (profile.requirements?.finishLevel) {
        const confidence = profile.requirements.specificRequirements ? 'High' : 'Medium';
        summary.push(
          `- Quality Level: ${profile.requirements.finishLevel} (${confidence} confidence)`
        );
      }
    }

    // Add information gaps with priority
    if (insights.informationGaps.length > 0) {
      summary.push('\n**Critical Information Needed:**');
      const criticalGaps = insights.informationGaps
        .filter(gap => this.questionCategories[gap]?.priority === 'critical')
        .slice(0, 3);

      criticalGaps.forEach(gap => {
        const category = this.questionCategories[gap];
        summary.push(`- ${this.formatGapDescription(gap)} (${category.priority})`);
      });
    }

    // Add recent conversation context (last 3 meaningful exchanges)
    const recentMessages = context.messageHistory
      .filter(m => m.keyInfo || m.responseType)
      .slice(-3);

    if (recentMessages.length > 0) {
      summary.push('\n**Recent Key Points:**');
      recentMessages.forEach(msg => {
        if (msg.keyInfo && msg.keyInfo.length > 0) {
          summary.push(`- ${msg.keyInfo.join(', ')}`);
        }
      });
    }

    // Add next recommended actions
    summary.push(`\n**Next Best Actions:** ${insights.nextBestActions.join(', ')}`);

    return summary.join('\n');
  }

  /**
   * Private helper methods
   */
  private static determineCurrentFocus(
    profile: ProjectProfile,
    questions: QuestionHistory[]
  ): string {
    // Analyze recent questions and missing information to determine focus
    const recentQuestions = questions.slice(-3);

    if (recentQuestions.length === 0) {
      return 'Project Discovery';
    }

    const recentCategories = recentQuestions.map(q => this.categorizeQuestion(q.question).name);

    // Find most common category
    const categoryCount = recentCategories.reduce(
      (acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const dominantCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0];

    return this.formatCategoryFocus(dominantCategory || 'project_scope');
  }

  private static identifyInformationGaps(
    profile: ProjectProfile,
    questions: QuestionHistory[]
  ): string[] {
    const gaps: string[] = [];
    const askedCategories = new Set(questions.map(q => this.categorizeQuestion(q.question).name));

    // Check for missing critical information
    if (!profile.projectType) gaps.push('project_type');
    if (!profile.specificType && profile.projectType) gaps.push('specific_type');
    if (!profile.scope?.size) gaps.push('dimensions');
    if (!profile.scope?.budget) gaps.push('budget_range');
    if (!profile.requirements?.finishLevel) gaps.push('finish_level');

    // Check for missing important information based on project type
    if (profile.projectType && !askedCategories.has('timeline')) {
      gaps.push('timeline');
    }

    if (profile.scope?.size && !askedCategories.has('existing_conditions')) {
      gaps.push('existing_conditions');
    }

    return gaps;
  }

  private static calculateConversationQuality(context: ConversationContext): number {
    let score = 0;
    let maxScore = 0;

    // Information completeness (40 points)
    maxScore += 40;
    score += Math.min(context.completenessScore * 0.4, 40);

    // Question efficiency (30 points)
    maxScore += 30;
    const totalQuestions = context.questionHistory.length;
    const answeredQuestions = context.questionHistory.filter(q => q.answer).length;
    const efficiency = totalQuestions > 0 ? answeredQuestions / totalQuestions : 1;
    score += efficiency * 30;

    // Conversation flow (30 points)
    maxScore += 30;
    const messages = context.messageHistory;
    if (messages.length >= 2) {
      // Check for natural progression
      const hasProgression = messages.some(
        m => m.responseType === 'estimation' || m.responseType === 'quote'
      );
      if (hasProgression) score += 30;
      else score += 15; // Partial credit for ongoing conversation
    }

    return Math.round((score / maxScore) * 100);
  }

  private static generateSuggestedQuestions(
    profile: ProjectProfile,
    questions: QuestionHistory[],
    phase: ConversationPhase
  ): string[] {
    const suggested: string[] = [];
    const askedCategories = new Set(questions.map(q => this.categorizeQuestion(q.question).name));

    // Get categories appropriate for current phase
    const phaseCategories = Object.entries(this.questionCategories)
      .filter(([, category]) => category.phase === phase)
      .filter(([name]) => !askedCategories.has(name));

    // Prioritize by importance and dependencies
    const prioritized = phaseCategories
      .sort(([, a], [, b]) => {
        const priorityOrder = { critical: 3, important: 2, optional: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3);

    return prioritized.map(([name]) =>
      this.generateQuestionPrompt(name, {
        projectProfile: profile,
        questionHistory: questions,
      } as ConversationContext)
    );
  }

  private static determineNextActions(context: ConversationContext): string[] {
    const actions: string[] = [];
    const insights = this.analyzeConversation(context);

    if (insights.informationGaps.length > 0) {
      actions.push('Gather missing information');
    }

    if (insights.phaseReadiness.estimation && context.currentPhase === 'discovery') {
      actions.push('Provide rough estimate');
    }

    if (insights.phaseReadiness.quote) {
      actions.push('Generate detailed quote');
    }

    if (context.questionHistory.some(q => !q.answer)) {
      actions.push('Follow up on unanswered questions');
    }

    return actions.length > 0 ? actions : ['Continue conversation'];
  }

  private static assessPhaseReadiness(context: ConversationContext): {
    estimation: boolean;
    quote: boolean;
    completion: boolean;
  } {
    const profile = context.projectProfile;
    const completeness = context.completenessScore;

    return {
      estimation: completeness >= 30 && (!!profile.projectType || !!profile.scope?.size),
      quote:
        completeness >= 70 &&
        !!(profile.projectType && profile.scope?.size && profile.scope?.budget),
      completion: completeness >= 90,
    };
  }

  private static formatGapDescription(gap: string): string {
    const descriptions: Record<string, string> = {
      project_type: 'Type of construction work',
      specific_type: 'Specific project details',
      dimensions: 'Size and dimensions',
      budget_range: 'Budget expectations',
      finish_level: 'Quality and finish level',
      timeline: 'Project timeline',
      existing_conditions: 'Current site conditions',
      access_constraints: 'Access limitations',
    };

    return descriptions[gap] || gap.replace('_', ' ');
  }

  private static formatCategoryFocus(category: string): string {
    const focuses: Record<string, string> = {
      project_type: 'Project Type Clarification',
      dimensions: 'Size and Scope Definition',
      budget_range: 'Budget Planning',
      finish_level: 'Quality Requirements',
      timeline: 'Timeline Planning',
      existing_conditions: 'Site Assessment',
    };

    return focuses[category] || 'General Project Discussion';
  }

  private static generateQuestionPrompt(category: string, context: ConversationContext): string {
    const profile = context.projectProfile;

    const prompts: Record<string, string> = {
      project_type: 'What type of construction work are you planning?',
      specific_type: `You mentioned ${profile.projectType} - could you be more specific about the scope?`,
      dimensions: 'What are the approximate dimensions or square meters for this project?',
      budget_range: "What's your expected budget range for this work?",
      finish_level: 'What quality level are you looking for? (budget, mid-range, high-end)',
      timeline: 'When would you like this work to be completed?',
      existing_conditions: 'Can you describe the current condition of the space?',
      access_constraints: 'Are there any access challenges we should consider?',
    };

    return prompts[category] || 'Could you provide more details about your project?';
  }

  private static generateClarificationPrompt(unansweredQuestions: QuestionHistory[]): string {
    if (unansweredQuestions.length === 1) {
      return `I'd like to revisit: ${unansweredQuestions[0].question}`;
    }

    return `Let me follow up on a few previous questions: ${unansweredQuestions
      .slice(0, 2)
      .map(q => q.question)
      .join(' and ')}`;
  }
}
