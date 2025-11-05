/**
 * Quote Refinement Service
 * Manages iterative quote improvement through structured dialogue
 */

import {
  PROJECT_TEMPLATES,
  ProjectTemplate,
  QuoteRefinementContext,
  REFINEMENT_STRATEGIES,
  identifyProjectType,
  generateRefinementPrompt,
} from './project-templates';

export interface QuoteBreakdown {
  projectType: string;
  totalCost: number;
  categories: Array<{
    id: string;
    name: string;
    cost: number;
    percentage: number;
    confidence: 'high' | 'medium' | 'low';
    notes?: string;
  }>;
  assumptions: string[];
  refinementSuggestions: string[];
}

export interface RefinementResponse {
  updatedQuote: QuoteBreakdown;
  conversationPrompt: string;
  isComplete: boolean;
  context: QuoteRefinementContext;
}

export class QuoteRefinementService {
  /**
   * Initialize quote refinement process
   */
  static initializeQuote(
    userMessage: string,
    projectSize: number,
    baselineTotal: number
  ): { quote: QuoteBreakdown; context: QuoteRefinementContext } {
    const projectTemplate = identifyProjectType(userMessage);
    if (!projectTemplate) {
      throw new Error('Project type not identified');
    }

    // Generate initial quote breakdown
    const quote = this.generateQuoteBreakdown(projectTemplate, projectSize, baselineTotal);

    // Initialize refinement context
    const context: QuoteRefinementContext = {
      projectType: projectTemplate.id,
      currentIteration: 0,
      maxIterations: 3,
      userConcerns: [],
      adjustmentsMade: [],
      validatedCategories: [],
      finalQuote: false,
    };

    return { quote, context };
  }

  /**
   * Process user refinement request
   */
  static processRefinement(
    userFeedback: string,
    currentQuote: QuoteBreakdown,
    context: QuoteRefinementContext
  ): RefinementResponse {
    const template = PROJECT_TEMPLATES[context.projectType];
    if (!template) {
      throw new Error('Invalid project type in context');
    }

    // Increment iteration
    context.currentIteration++;

    // Parse user feedback to identify concerns
    const concerns = this.parseUserConcerns(userFeedback);
    context.userConcerns.push(...concerns);

    // Generate refinements based on feedback
    const updatedQuote = this.refineQuote(currentQuote, concerns, template, context);

    // Generate next conversation prompt
    const conversationPrompt = this.generateConversationPrompt(template, context, concerns);

    // Check if refinement is complete
    const isComplete =
      context.currentIteration >= context.maxIterations ||
      this.isRefinementComplete(userFeedback, context);

    if (isComplete) {
      context.finalQuote = true;
    }

    return {
      updatedQuote,
      conversationPrompt,
      isComplete,
      context,
    };
  }

  /**
   * Generate initial quote breakdown from template
   */
  private static generateQuoteBreakdown(
    template: ProjectTemplate,
    projectSize: number,
    baselineTotal: number
  ): QuoteBreakdown {
    const categories = template.costCategories.map(category => {
      const cost = Math.round(baselineTotal * (category.typicalPercentage / 100));

      return {
        id: category.id,
        name: category.name,
        cost,
        percentage: category.typicalPercentage,
        confidence: this.getCategoryConfidence(category.id, template.id),
        notes: category.description,
      };
    });

    // Generate assumptions based on template
    const assumptions = this.generateAssumptions(template, projectSize);

    // Generate refinement suggestions
    const refinementSuggestions = this.generateRefinementSuggestions(template);

    return {
      projectType: template.name,
      totalCost: baselineTotal,
      categories,
      assumptions,
      refinementSuggestions,
    };
  }

  /**
   * Parse user concerns from feedback
   */
  private static parseUserConcerns(feedback: string): string[] {
    const concerns: string[] = [];
    const lowerFeedback = feedback.toLowerCase();

    // Common concern patterns
    const concernPatterns = {
      too_high: ['too high', 'expensive', 'too much', 'over budget', 'costly'],
      too_low: ['too low', 'seems low', 'underestimated', 'missing'],
      missing_items: ['missing', 'forgot', 'what about', 'need to add'],
      specification: ['quality', 'specification', 'standard', 'level'],
      timing: ['timeline', 'duration', 'time', 'schedule'],
      labour: ['labour', 'workers', 'tradesman', 'contractor'],
      materials: ['materials', 'products', 'supplies'],
      waste: ['waste', 'skip', 'disposal', 'removal'],
      services: ['plumbing', 'electrical', 'heating', 'utilities'],
    };

    for (const [concern, keywords] of Object.entries(concernPatterns)) {
      if (keywords.some(keyword => lowerFeedback.includes(keyword))) {
        concerns.push(concern);
      }
    }

    return concerns;
  }

  /**
   * Refine quote based on user feedback
   */
  private static refineQuote(
    currentQuote: QuoteBreakdown,
    concerns: string[],
    template: ProjectTemplate,
    context: QuoteRefinementContext
  ): QuoteBreakdown {
    const updatedCategories = [...currentQuote.categories];
    let totalAdjustment = 0;

    // Apply refinements based on concerns
    for (const concern of concerns) {
      const adjustment = this.applyRefinement(concern, updatedCategories, template, context);
      totalAdjustment += adjustment;
    }

    // Recalculate percentages
    const newTotal = currentQuote.totalCost + totalAdjustment;
    updatedCategories.forEach(category => {
      category.percentage = Math.round((category.cost / newTotal) * 100);
    });

    return {
      ...currentQuote,
      totalCost: newTotal,
      categories: updatedCategories,
    };
  }

  /**
   * Apply specific refinement to quote
   */
  private static applyRefinement(
    concern: string,
    categories: Array<any>,
    template: ProjectTemplate,
    context: QuoteRefinementContext
  ): number {
    let adjustment = 0;

    switch (concern) {
      case 'too_high':
        // Reduce most flexible categories by 10-15%
        const flexibleCats = ['finishes', 'services', 'appliances'];
        categories.forEach(cat => {
          if (flexibleCats.includes(cat.id)) {
            const reduction = Math.round(cat.cost * 0.12);
            cat.cost -= reduction;
            adjustment -= reduction;
            context.adjustmentsMade.push({
              category: cat.name,
              change: `Reduced by £${reduction}`,
              reasoning: 'Adjusted for budget constraints',
            });
          }
        });
        break;

      case 'too_low':
        // Increase structure and materials by 10-20%
        const coreCats = ['structure', 'materials', 'labour'];
        categories.forEach(cat => {
          if (coreCats.includes(cat.id)) {
            const increase = Math.round(cat.cost * 0.15);
            cat.cost += increase;
            adjustment += increase;
            context.adjustmentsMade.push({
              category: cat.name,
              change: `Increased by £${increase}`,
              reasoning: 'Adjusted for realistic market pricing',
            });
          }
        });
        break;

      case 'missing_items':
        // Add contingency or new category
        const contingency = Math.round(categories.reduce((sum, cat) => sum + cat.cost, 0) * 0.1);
        adjustment += contingency;
        break;

      case 'specification':
        // Adjust materials and finishes quality
        categories.forEach(cat => {
          if (['materials', 'units', 'finishes', 'sanitaryware'].includes(cat.id)) {
            const increase = Math.round(cat.cost * 0.2);
            cat.cost += increase;
            adjustment += increase;
            context.adjustmentsMade.push({
              category: cat.name,
              change: `Upgraded specification (+£${increase})`,
              reasoning: 'Higher quality specification',
            });
          }
        });
        break;
    }

    return adjustment;
  }

  /**
   * Generate conversation prompt for next iteration
   */
  private static generateConversationPrompt(
    template: ProjectTemplate,
    context: QuoteRefinementContext,
    concerns: string[]
  ): string {
    if (context.currentIteration >= context.maxIterations) {
      return "Here's your final refined quote. This should be much more accurate for your specific project. Does this look realistic for what you're planning?";
    }

    // Use template-based refinement prompts
    const basePrompt = generateRefinementPrompt(template.id, context.currentIteration);

    // Add context based on previous adjustments
    if (context.adjustmentsMade.length > 0) {
      const lastAdjustment = context.adjustmentsMade[context.adjustmentsMade.length - 1];
      return `I've ${lastAdjustment.change.toLowerCase()} the ${lastAdjustment.category.toLowerCase()}. ${basePrompt}`;
    }

    return basePrompt;
  }

  /**
   * Check if refinement process is complete
   */
  private static isRefinementComplete(
    userFeedback: string,
    context: QuoteRefinementContext
  ): boolean {
    const completionSignals = [
      'looks good',
      "that's better",
      'sounds right',
      'seems accurate',
      "i'm happy",
      'perfect',
      'great',
      'thanks',
      'good estimate',
    ];

    const feedback = userFeedback.toLowerCase();
    return completionSignals.some(signal => feedback.includes(signal));
  }

  /**
   * Get category confidence level
   */
  private static getCategoryConfidence(
    categoryId: string,
    projectType: string
  ): 'high' | 'medium' | 'low' {
    // High confidence categories (well-established pricing)
    const highConfidence = ['waste', 'labour', 'materials'];

    // Low confidence categories (highly variable)
    const lowConfidence = ['appliances', 'finishes', 'services'];

    if (highConfidence.includes(categoryId)) return 'high';
    if (lowConfidence.includes(categoryId)) return 'low';
    return 'medium';
  }

  /**
   * Generate project assumptions
   */
  private static generateAssumptions(template: ProjectTemplate, projectSize: number): string[] {
    const baseAssumptions = [
      `Based on ${projectSize}m² project size`,
      'Standard UK building regulations compliance',
      'No unusual ground conditions or constraints',
      'Normal access for materials and waste removal',
    ];

    // Add template-specific assumptions
    const templateAssumptions = template.complexityFactors
      .slice(0, 2)
      .map(factor => `Assumes ${factor.toLowerCase()} are straightforward`);

    return [...baseAssumptions, ...templateAssumptions];
  }

  /**
   * Generate refinement suggestions
   */
  private static generateRefinementSuggestions(template: ProjectTemplate): string[] {
    return [
      `Ask about any ${template.costCategories[0].name.toLowerCase()} specifics`,
      'Clarify quality level preferences',
      'Confirm timeline and access requirements',
    ];
  }
}

/**
 * Integration with AI Service
 */
export const QUOTE_REFINEMENT_PROMPTS = {
  systemPrompt: `You are AskToddy, a construction cost expert. You provide structured quotes and refine them through conversation.

QUOTE STRUCTURE RULES:
- Always use the project template cost categories
- Present quotes as clear breakdowns with percentages
- Be conversational but structured
- Focus on 2-3 refinement iterations maximum
- Ask specific, actionable questions

REFINEMENT APPROACH:
- Iteration 1: Clarify major concerns or missing elements
- Iteration 2: Fine-tune specific categories based on feedback  
- Iteration 3: Final validation and small adjustments

Keep responses concise and focused on the user's specific concerns.`,

  initialQuotePrompt: (template: ProjectTemplate, size: number) => `
Based on a ${size}m² ${template.name.toLowerCase()}, here's your quote breakdown:

{QUOTE_BREAKDOWN}

This covers the main cost categories for your project. Which area would you like me to explain more or adjust based on your specific requirements?`,

  refinementPrompt: (iteration: number, concerns: string[]) => `
I've updated the quote based on your feedback about: ${concerns.join(', ')}.

{UPDATED_QUOTE}

${iteration < 3 ? "Is there anything else you'd like me to adjust?" : 'Does this final quote look realistic for your project?'}`,
};
