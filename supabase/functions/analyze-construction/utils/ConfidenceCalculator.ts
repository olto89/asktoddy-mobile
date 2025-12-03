/**
 * Dynamic Confidence Calculator for Construction Quotes
 * Calculates confidence based on actual information provided
 */

import type { ProjectAnalysis, AnalysisRequest } from '../types.ts';
import type { ConversationContext } from '../context/types.ts';

interface ConfidenceFactors {
  hasImages: boolean;
  hasLocation: boolean;
  hasDimensions: boolean;
  hasProjectType: boolean;
  hasSpecificMaterials: boolean;
  hasQualityLevel: boolean;
  hasTimeline: boolean;
  hasBudget: boolean;
  messageDetail: number; // 0-100 score based on message length and detail
  conversationDepth: number; // Number of messages in conversation
  questionsAnswered: number; // Number of clarifying questions answered
}

export class ConfidenceCalculator {
  /**
   * Calculate dynamic confidence based on information completeness
   */
  static calculateConfidence(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    context?: ConversationContext
  ): number {
    const factors = this.extractFactors(analysis, request, context);

    // Base confidence starts at 20%
    let confidence = 20;

    // Core factors (each adds up to 10%)
    if (factors.hasProjectType) confidence += 10;
    if (factors.hasLocation) confidence += 5;
    if (factors.hasImages) confidence += 15; // Images provide significant detail

    // Dimensional information is critical for accuracy
    if (factors.hasDimensions) confidence += 15;

    // Material and quality specifications
    if (factors.hasSpecificMaterials) confidence += 10;
    if (factors.hasQualityLevel) confidence += 10;

    // Timeline and budget info
    if (factors.hasTimeline) confidence += 5;
    if (factors.hasBudget) confidence += 5;

    // Message detail (up to 10%)
    confidence += Math.min(10, factors.messageDetail / 10);

    // Conversation depth bonus (up to 5%)
    if (factors.conversationDepth > 1) {
      confidence += Math.min(5, factors.conversationDepth * 2);
    }

    // Questions answered bonus (each answered question adds 3%, max 15%)
    confidence += Math.min(15, factors.questionsAnswered * 3);

    // Cap at 95% (never claim 100% confidence)
    return Math.min(95, Math.round(confidence));
  }

  /**
   * Extract confidence factors from analysis and request
   */
  private static extractFactors(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    context?: ConversationContext
  ): ConfidenceFactors {
    const message = (request.message || '').toLowerCase();

    return {
      hasImages: !!request.imageUri || !!request.images?.length,
      hasLocation: !!(
        request.context?.location ||
        request.context?.city ||
        request.context?.postcode
      ),
      hasDimensions: this.hasDimensions(message, analysis),
      hasProjectType: !!analysis.projectType && analysis.projectType !== 'general construction',
      hasSpecificMaterials: this.hasSpecificMaterials(message, analysis),
      hasQualityLevel: this.hasQualityLevel(message, analysis),
      hasTimeline: this.hasTimeline(message, analysis),
      hasBudget: this.hasBudget(message),
      messageDetail: this.calculateMessageDetail(message),
      conversationDepth: context?.messageHistory?.length || 0,
      questionsAnswered: this.countAnsweredQuestions(context),
    };
  }

  /**
   * Check if dimensions are provided
   */
  private static hasDimensions(message: string, analysis: ProjectAnalysis): boolean {
    // Check for explicit dimensions in message
    const dimensionPattern = /\d+\s*[mx]\s*\d+|\d+\s*sq\s*[mf]|\d+\s*square\s*[mf]|\d+m²|\d+ft²/i;
    if (dimensionPattern.test(message)) return true;

    // Check for room size descriptors
    const sizeDescriptors = ['small', 'medium', 'large', 'ensuite', 'master'];
    if (sizeDescriptors.some(size => message.includes(size))) return true;

    // Check if analysis extracted dimensions
    if (analysis.description?.match(/\d+\s*[mx]\s*\d+/)) return true;

    return false;
  }

  /**
   * Check if specific materials are mentioned
   */
  private static hasSpecificMaterials(message: string, analysis: ProjectAnalysis): boolean {
    const materials = [
      'composite',
      'laminate',
      'hardwood',
      'granite',
      'marble',
      'quartz',
      'porcelain',
      'ceramic',
      'vinyl',
      'engineered',
      'oak',
      'pine',
      'chrome',
      'brass',
      'stainless steel',
      'copper',
      'pvc',
    ];

    const hasMaterialsInMessage = materials.some(mat => message.includes(mat));
    const hasMaterialsInAnalysis = analysis.costBreakdown?.materials?.items?.length > 0;

    return hasMaterialsInMessage || hasMaterialsInAnalysis;
  }

  /**
   * Check if quality level is specified
   */
  private static hasQualityLevel(message: string, analysis: ProjectAnalysis): boolean {
    const qualityTerms = [
      'budget',
      'standard',
      'premium',
      'luxury',
      'high-end',
      'basic',
      'economy',
      'mid-range',
      'high quality',
      'cheap',
      'expensive',
      'quality',
      'professional',
      'diy',
    ];

    return qualityTerms.some(term => message.includes(term));
  }

  /**
   * Check if timeline is mentioned
   */
  private static hasTimeline(message: string, analysis: ProjectAnalysis): boolean {
    const timelineTerms = [
      'urgent',
      'asap',
      'quickly',
      'fast',
      'slow',
      'rush',
      'week',
      'month',
      'day',
      'deadline',
      'by',
      'before',
      'timeline',
    ];

    const hasTimelineInMessage = timelineTerms.some(term => message.includes(term));
    const hasTimelineInAnalysis = !!analysis.timeline?.professional || !!analysis.timeline?.diy;

    return hasTimelineInMessage || hasTimelineInAnalysis;
  }

  /**
   * Check if budget is mentioned
   */
  private static hasBudget(message: string): boolean {
    // Look for currency symbols or budget keywords
    const budgetPattern = /[£$€]\d+|\d+k|budget|cost|price|spend|afford/i;
    return budgetPattern.test(message);
  }

  /**
   * Calculate message detail score (0-100)
   */
  private static calculateMessageDetail(message: string): number {
    if (!message) return 0;

    const words = message.split(/\s+/).filter(w => w.length > 2);
    const detailScore = Math.min(100, words.length * 3);

    // Bonus for specific descriptive terms
    const descriptiveTerms = [
      'existing',
      'current',
      'replace',
      'install',
      'remove',
      'new',
      'modern',
      'traditional',
      'contemporary',
      'style',
      'finish',
    ];

    const descriptiveCount = descriptiveTerms.filter(term => message.includes(term)).length;

    return Math.min(100, detailScore + descriptiveCount * 10);
  }

  /**
   * Count how many clarifying questions have been answered
   */
  private static countAnsweredQuestions(context?: ConversationContext): number {
    if (!context?.questionHistory) return 0;

    return context.questionHistory.filter(q => q.answered).length;
  }

  /**
   * Get improvement suggestions based on missing factors
   */
  static getImprovementSuggestions(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    context?: ConversationContext
  ): string[] {
    const factors = this.extractFactors(analysis, request, context);
    const suggestions: string[] = [];

    if (!factors.hasImages) {
      suggestions.push('Add photos of the space for more accurate assessment');
    }

    if (!factors.hasDimensions) {
      suggestions.push('Provide room dimensions or square footage');
    }

    if (!factors.hasSpecificMaterials) {
      suggestions.push('Specify preferred materials or finishes');
    }

    if (!factors.hasQualityLevel) {
      suggestions.push('Indicate quality level preference (budget/standard/premium)');
    }

    if (!factors.hasTimeline) {
      suggestions.push('Share your timeline or urgency');
    }

    if (!factors.hasBudget) {
      suggestions.push('Mention your budget range if you have one');
    }

    return suggestions;
  }
}
