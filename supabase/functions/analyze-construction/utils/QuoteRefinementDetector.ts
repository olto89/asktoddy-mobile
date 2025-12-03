/**
 * Quote Refinement Detector
 * Detects when a user is providing additional information to refine a quote
 */

import type { ConversationContext } from '../context/types.ts';
import type { ProjectAnalysis } from '../types.ts';

export class QuoteRefinementDetector {
  /**
   * Check if the current message is a refinement of a previous quote
   */
  static isRefinementMessage(message: string, context?: ConversationContext): boolean {
    if (!context?.messageHistory || context.messageHistory.length < 2) {
      return false;
    }

    const messageLower = message.toLowerCase();

    // Check for explicit refinement indicators
    const refinementIndicators = [
      'actually',
      'also',
      'forgot to mention',
      'oh and',
      'by the way',
      'to clarify',
      'specifically',
      'exactly',
      'precisely',
      'definitely',
      'i meant',
      'i mean',
      'should be',
      'will be',
      'going with',
      'decided on',
      'choosing',
      'prefer',
      'want',
      'need',
      'size is',
      'dimensions are',
      'area is',
      "it's",
      'its',
      'brand is',
      'material is',
      'finish is',
      'quality',
      'budget is',
      'timeline is',
      'urgency is',
      'deadline',
    ];

    const hasRefinementIndicator = refinementIndicators.some(indicator =>
      messageLower.includes(indicator)
    );

    // Check if message contains specific details (dimensions, materials, etc.)
    const hasSpecificDetails = this.containsSpecificDetails(message);

    // Check if previous message was a quote analysis
    const lastAssistantMessage = context.messageHistory.filter(m => m.role === 'assistant').pop();

    const previousWasQuote =
      lastAssistantMessage?.content?.includes('estimate') ||
      lastAssistantMessage?.content?.includes('quote') ||
      lastAssistantMessage?.content?.includes('cost');

    return previousWasQuote && (hasRefinementIndicator || hasSpecificDetails);
  }

  /**
   * Check if message contains specific project details
   */
  private static containsSpecificDetails(message: string): boolean {
    const messageLower = message.toLowerCase();

    // Dimension patterns
    const hasDimensions = /\d+\s*[mx]\s*\d+|\d+\s*sq\s*[mf]|\d+\s*square|\d+m²|\d+ft²/i.test(
      message
    );

    // Material patterns
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
      'stainless',
      'copper',
      'pvc',
      'upvc',
    ];
    const hasMaterials = materials.some(mat => messageLower.includes(mat));

    // Brand patterns
    const hasBrands =
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(message) &&
      message.split(' ').some(word => word[0] === word[0].toUpperCase());

    // Price/budget patterns
    const hasBudget = /[£$€]\d+|\d+k|budget|cost|price|spend/i.test(message);

    // Quality indicators
    const qualityTerms = ['budget', 'standard', 'premium', 'luxury', 'high-end', 'basic'];
    const hasQuality = qualityTerms.some(term => messageLower.includes(term));

    return hasDimensions || hasMaterials || hasBrands || hasBudget || hasQuality;
  }

  /**
   * Extract refinement details from the message
   */
  static extractRefinementDetails(message: string, previousAnalysis?: ProjectAnalysis): any {
    const details: any = {
      dimensions: null,
      materials: [],
      quality: null,
      budget: null,
      timeline: null,
      additionalRequirements: [],
    };

    const messageLower = message.toLowerCase();

    // Extract dimensions
    const dimensionMatch = message.match(/(\d+(?:\.\d+)?)\s*[mx]\s*(\d+(?:\.\d+)?)/i);
    if (dimensionMatch) {
      details.dimensions = {
        length: parseFloat(dimensionMatch[1]),
        width: parseFloat(dimensionMatch[2]),
        unit: 'm',
      };
    }

    // Extract area
    const areaMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:sq\s*[mf]|square\s*[mf]|m²|ft²)/i);
    if (areaMatch) {
      details.area = {
        value: parseFloat(areaMatch[1]),
        unit: message.includes('ft') ? 'ft²' : 'm²',
      };
    }

    // Extract materials
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
    ];
    materials.forEach(mat => {
      if (messageLower.includes(mat)) {
        details.materials.push(mat);
      }
    });

    // Extract quality level
    if (
      messageLower.includes('budget') ||
      messageLower.includes('cheap') ||
      messageLower.includes('basic')
    ) {
      details.quality = 'budget';
    } else if (
      messageLower.includes('premium') ||
      messageLower.includes('luxury') ||
      messageLower.includes('high-end')
    ) {
      details.quality = 'premium';
    } else if (messageLower.includes('standard') || messageLower.includes('mid-range')) {
      details.quality = 'standard';
    }

    // Extract budget
    const budgetMatch = message.match(/[£$€](\d+(?:,\d{3})*(?:\.\d{2})?|\d+k)/i);
    if (budgetMatch) {
      let budgetValue = budgetMatch[1].replace(/,/g, '');
      if (budgetValue.endsWith('k')) {
        budgetValue = (parseFloat(budgetValue) * 1000).toString();
      }
      details.budget = parseFloat(budgetValue);
    }

    // Extract timeline
    const timelineMatch = message.match(/(\d+)\s*(day|week|month)/i);
    if (timelineMatch) {
      details.timeline = {
        value: parseInt(timelineMatch[1]),
        unit: timelineMatch[2].toLowerCase(),
      };
    }

    // Check for urgency
    if (
      messageLower.includes('urgent') ||
      messageLower.includes('asap') ||
      messageLower.includes('quickly')
    ) {
      details.timeline = { urgency: 'urgent' };
    }

    return details;
  }

  /**
   * Create a refinement prompt based on additional information
   */
  static createRefinementPrompt(
    newMessage: string,
    previousAnalysis: ProjectAnalysis,
    refinementDetails: any
  ): string {
    let prompt = `The user has provided additional information to refine their quote:\n\n`;
    prompt += `NEW INFORMATION: "${newMessage}"\n\n`;

    if (refinementDetails.dimensions) {
      prompt += `DIMENSIONS: ${refinementDetails.dimensions.length}m x ${refinementDetails.dimensions.width}m\n`;
    }

    if (refinementDetails.area) {
      prompt += `AREA: ${refinementDetails.area.value} ${refinementDetails.area.unit}\n`;
    }

    if (refinementDetails.materials.length > 0) {
      prompt += `SPECIFIED MATERIALS: ${refinementDetails.materials.join(', ')}\n`;
    }

    if (refinementDetails.quality) {
      prompt += `QUALITY LEVEL: ${refinementDetails.quality}\n`;
    }

    if (refinementDetails.budget) {
      prompt += `BUDGET: £${refinementDetails.budget}\n`;
    }

    if (refinementDetails.timeline) {
      if (refinementDetails.timeline.urgency) {
        prompt += `TIMELINE: URGENT\n`;
      } else {
        prompt += `TIMELINE: ${refinementDetails.timeline.value} ${refinementDetails.timeline.unit}s\n`;
      }
    }

    prompt += `\nIMPORTANT: 
    - Recalculate the quote based on this new information
    - Adjust material selections based on specified preferences
    - Update labor estimates if dimensions have changed
    - Ensure pricing reflects the quality level specified
    - The confidence score should increase as more specific information is provided
    - Generate a REFINED quote, not just acknowledge the information\n`;

    return prompt;
  }
}
