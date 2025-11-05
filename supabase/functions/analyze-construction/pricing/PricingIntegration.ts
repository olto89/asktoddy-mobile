/**
 * PricingIntegration - Bridges pricing data with conversation context
 * Provides intelligent pricing suggestions based on project requirements
 */

import { PricingContextEngine, PriceItem, PricingContext } from './PricingContextEngine.ts';
import { ContextManager } from '../context/ContextManager.ts';
import type { ConversationContext, ProjectProfile } from '../context/types.ts';

export interface PricingInsight {
  recommendedSuppliers: {
    primary: SupplierRecommendation;
    alternatives: SupplierRecommendation[];
  };
  estimatedCosts: {
    equipment: CostBreakdown;
    materials: CostBreakdown;
    total: {
      min: number;
      max: number;
      likely: number;
    };
  };
  savingsOpportunities: SavingsOpportunity[];
  confidenceLevel: number;
}

export interface SupplierRecommendation {
  supplier: string;
  reason: string;
  estimatedCost: number;
  availability: 'immediate' | 'within-24h' | 'within-week';
  pros: string[];
  cons: string[];
}

export interface CostBreakdown {
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    duration: string;
    subtotal: number;
  }>;
  total: number;
}

export interface SavingsOpportunity {
  description: string;
  potentialSaving: number;
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class PricingIntegration {
  private pricingEngine: PricingContextEngine;
  private contextManager: ContextManager;

  constructor(pricingEngine: PricingContextEngine, contextManager: ContextManager) {
    this.pricingEngine = pricingEngine;
    this.contextManager = contextManager;
  }

  /**
   * Analyze conversation and extract pricing requirements
   */
  async extractPricingRequirements(sessionId: string): Promise<string[]> {
    const context = await this.contextManager.getContext(sessionId);
    if (!context) return [];

    const requirements: string[] = [];
    const projectProfile = context.projectProfile;

    // Extract equipment from project type
    if (projectProfile.projectType) {
      const equipment = this.getEquipmentForProjectType(
        projectProfile.projectType,
        projectProfile.specificType
      );
      requirements.push(...equipment);
    }

    // Extract from specific requirements
    if (projectProfile.requirements?.specificRequirements) {
      const items = this.extractItemsFromText(projectProfile.requirements.specificRequirements);
      requirements.push(...items);
    }

    // Extract from message history
    const recentMessages = context.messageHistory.slice(-10);
    for (const msg of recentMessages) {
      if (msg.keyInfo) {
        const items = msg.keyInfo
          .filter(info => this.looksLikePricingItem(info))
          .map(info => this.cleanItemDescription(info));
        requirements.push(...items);
      }
    }

    // Remove duplicates
    return [...new Set(requirements)];
  }

  /**
   * Generate comprehensive pricing insights
   */
  async generatePricingInsights(sessionId: string): Promise<PricingInsight> {
    const context = await this.contextManager.getContext(sessionId);
    if (!context) {
      throw new Error('No conversation context found');
    }

    // Extract pricing requirements
    const requirements = await this.extractPricingRequirements(sessionId);

    // Get pricing context
    const pricingContext = await this.pricingEngine.enrichConversationWithPricing(
      sessionId,
      requirements
    );

    // Analyze suppliers
    const supplierAnalysis = this.analyzeSuppliers(pricingContext, context.projectProfile);

    // Calculate cost estimates
    const costEstimates = this.calculateCostEstimates(pricingContext, context.projectProfile);

    // Identify savings opportunities
    const savings = this.identifySavingsOpportunities(pricingContext, context.projectProfile);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(
      requirements.length,
      pricingContext.priceComparisons.length,
      context.completenessScore
    );

    return {
      recommendedSuppliers: supplierAnalysis,
      estimatedCosts: costEstimates,
      savingsOpportunities: savings,
      confidenceLevel: confidence,
    };
  }

  /**
   * Enhance AI response with pricing context
   */
  async enhanceResponseWithPricing(
    sessionId: string,
    baseResponse: string,
    requestedItems?: string[]
  ): Promise<string> {
    try {
      // Get or extract pricing requirements
      const items = requestedItems || (await this.extractPricingRequirements(sessionId));

      if (items.length === 0) {
        return baseResponse;
      }

      // Get pricing comparisons
      const comparisons = await Promise.all(
        items.slice(0, 5).map(item => this.pricingEngine.comparePrices(item).catch(() => null))
      );

      const validComparisons = comparisons.filter(c => c !== null);

      if (validComparisons.length === 0) {
        return baseResponse;
      }

      // Build pricing enhancement
      const pricingInfo = this.formatPricingInformation(validComparisons);

      // Integrate with base response
      return `${baseResponse}\n\n${pricingInfo}`;
    } catch (error) {
      console.error('Error enhancing response with pricing:', error);
      return baseResponse;
    }
  }

  /**
   * Update pricing context based on conversation
   */
  async updatePricingFromConversation(
    sessionId: string,
    message: string,
    role: 'user' | 'assistant'
  ): Promise<void> {
    // Extract any pricing-related information from the message
    const pricingItems = this.extractItemsFromText(message);

    if (pricingItems.length > 0) {
      // Update the context manager with pricing-related key info
      await this.contextManager.addMessage(
        sessionId,
        role,
        message,
        pricingItems.map(item => `Equipment/Material: ${item}`)
      );

      // Trigger background pricing data fetch if needed
      if (role === 'user') {
        this.pricingEngine
          .enrichConversationWithPricing(sessionId, pricingItems)
          .catch(error => console.error('Background pricing fetch failed:', error));
      }
    }
  }

  /**
   * Private helper methods
   */

  private getEquipmentForProjectType(projectType: string, specificType?: string): string[] {
    const equipmentMap: Record<string, string[]> = {
      extension: ['mini digger', 'concrete mixer', 'skip hire', 'scaffolding', 'cement mixer'],
      renovation: [
        'skip hire',
        'dust extractor',
        'tile cutter',
        'plastering machine',
        'floor sander',
      ],
      landscaping: ['mini digger', 'dumper', 'compactor plate', 'turf cutter', 'rotavator'],
      'loft-conversion': [
        'scaffolding',
        'hoist',
        'nail gun',
        'insulation blower',
        'plasterboard lifter',
      ],
      bathroom: ['tile cutter', 'pipe bender', 'drain snake', 'dust extractor'],
      kitchen: ['tile cutter', 'jigsaw', 'router', 'dust extractor', 'wall chaser'],
    };

    const baseEquipment = equipmentMap[projectType] || [];

    // Add specific equipment based on detailed type
    if (specificType?.includes('foundation')) {
      baseEquipment.push('excavator', 'concrete pump');
    }
    if (specificType?.includes('roof')) {
      baseEquipment.push('roof ladder', 'slate ripper');
    }

    return baseEquipment;
  }

  private extractItemsFromText(text: string): string[] {
    const items: string[] = [];

    // Common equipment patterns
    const equipmentPatterns = [
      /(\d+\s*)?(ton|tonne)?\s*(mini\s*)?(digger|excavator)/gi,
      /skip\s*hire/gi,
      /scaffold(ing)?/gi,
      /concrete\s*mixer/gi,
      /cement\s*mixer/gi,
      /(plate\s*)?compactor/gi,
      /dumper(\s*truck)?/gi,
      /generator/gi,
      /pressure\s*washer/gi,
      /tile\s*cutter/gi,
      /floor\s*sander/gi,
      /plasterboard\s*lifter/gi,
    ];

    // Material patterns
    const materialPatterns = [
      /\d+\s*(bags?\s*of\s*)?(cement|concrete)/gi,
      /\d+\s*(ton(ne)?s?\s*of\s*)?(sand|gravel|aggregate)/gi,
      /\d+\s*(sheets?\s*of\s*)?plywood/gi,
      /\d+\s*(lengths?\s*of\s*)?timber/gi,
      /\d+\s*bricks?/gi,
      /\d+\s*blocks?/gi,
      /insulation/gi,
    ];

    const allPatterns = [...equipmentPatterns, ...materialPatterns];

    for (const pattern of allPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        items.push(...matches.map(m => this.cleanItemDescription(m)));
      }
    }

    return [...new Set(items)];
  }

  private looksLikePricingItem(text: string): boolean {
    const keywords = [
      'hire',
      'rent',
      'equipment',
      'tool',
      'scaffold',
      'digger',
      'excavator',
      'mixer',
      'generator',
      'cement',
      'sand',
      'gravel',
      'brick',
      'block',
      'timber',
      'insulation',
      'plasterboard',
    ];

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  private cleanItemDescription(text: string): string {
    return text
      .replace(/^\d+\s*(ton(ne)?s?\s*)?/, '')
      .replace(/^\d+\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private analyzeSuppliers(
    pricingContext: PricingContext,
    projectProfile: ProjectProfile
  ): { primary: SupplierRecommendation; alternatives: SupplierRecommendation[] } {
    const suppliers: SupplierRecommendation[] = [];

    // Analyze each supplier's offerings
    for (const [supplierName, items] of pricingContext.supplierPrices) {
      const totalCost = items.reduce((sum, item) => {
        const price = item.price.daily || item.price.weekly || 0;
        return sum + price;
      }, 0);

      const isNational = items[0]?.supplier.coverage === 'national';
      const isLocal = items[0]?.supplier.coverage === 'local';

      suppliers.push({
        supplier: supplierName,
        reason: this.generateSupplierReason(isNational, isLocal, items.length),
        estimatedCost: totalCost,
        availability: isNational ? 'immediate' : 'within-24h',
        pros: this.getSupplierPros(isNational, isLocal, totalCost),
        cons: this.getSupplierCons(isNational, isLocal, totalCost),
      });
    }

    // Sort by cost and select primary
    suppliers.sort((a, b) => a.estimatedCost - b.estimatedCost);

    return {
      primary: suppliers[0] || this.getDefaultSupplier(),
      alternatives: suppliers.slice(1, 4),
    };
  }

  private calculateCostEstimates(
    pricingContext: PricingContext,
    projectProfile: ProjectProfile
  ): { equipment: CostBreakdown; materials: CostBreakdown; total: any } {
    const equipment: CostBreakdown = { items: [], total: 0 };
    const materials: CostBreakdown = { items: [], total: 0 };

    // Process each price comparison
    for (const comparison of pricingContext.priceComparisons) {
      const item = {
        description: comparison.item,
        quantity: 1, // Would be enhanced with actual quantities
        unitPrice: comparison.averagePrice,
        duration: this.estimateDuration(projectProfile),
        subtotal: comparison.averagePrice * this.getDurationMultiplier(projectProfile),
      };

      if (this.isEquipmentItem(comparison.item)) {
        equipment.items.push(item);
        equipment.total += item.subtotal;
      } else {
        materials.items.push(item);
        materials.total += item.subtotal;
      }
    }

    const total = equipment.total + materials.total;

    return {
      equipment,
      materials,
      total: {
        min: total * 0.8,
        max: total * 1.3,
        likely: total,
      },
    };
  }

  private identifySavingsOpportunities(
    pricingContext: PricingContext,
    projectProfile: ProjectProfile
  ): SavingsOpportunity[] {
    const opportunities: SavingsOpportunity[] = [];

    // Check for bulk hire discounts
    if (pricingContext.priceComparisons.length > 3) {
      opportunities.push({
        description: 'Bundle multiple items from same supplier',
        potentialSaving: pricingContext.priceComparisons.length * 50,
        effort: 'low',
        recommendation: 'Request package deal for multiple equipment items',
      });
    }

    // Check for longer hire periods
    const hasWeeklyRates = pricingContext.priceComparisons.some(c =>
      c.suppliers.some(s => s.price.weekly)
    );

    if (hasWeeklyRates) {
      opportunities.push({
        description: 'Switch from daily to weekly hire',
        potentialSaving: 200,
        effort: 'low',
        recommendation: 'Weekly rates often provide 20-30% savings over daily rates',
      });
    }

    // Local vs national suppliers
    const hasLocalSuppliers = Array.from(pricingContext.supplierPrices.values()).some(
      items => items[0]?.supplier.coverage === 'local'
    );

    if (hasLocalSuppliers) {
      opportunities.push({
        description: 'Use local independent suppliers',
        potentialSaving: 150,
        effort: 'medium',
        recommendation: 'Local suppliers often have competitive rates and flexible terms',
      });
    }

    return opportunities;
  }

  private formatPricingInformation(comparisons: any[]): string {
    const lines = ['**📊 Pricing Information:**'];

    for (const comparison of comparisons) {
      lines.push(`\n**${comparison.item}:**`);
      lines.push(
        `• Best price: £${comparison.lowestPrice.price.daily}/day from ${comparison.lowestPrice.supplier.name}`
      );
      lines.push(`• Average: £${comparison.averagePrice.toFixed(2)}/day`);
      lines.push(`• ${comparison.recommendation}`);
    }

    return lines.join('\n');
  }

  private calculateConfidence(
    requirementsCount: number,
    comparisonsCount: number,
    completenessScore: number
  ): number {
    const dataCompleteness = comparisonsCount / Math.max(requirementsCount, 1);
    const contextCompleteness = completenessScore / 100;

    return Math.min(0.95, dataCompleteness * 0.6 + contextCompleteness * 0.4);
  }

  private generateSupplierReason(isNational: boolean, isLocal: boolean, itemCount: number): string {
    if (isNational) {
      return `National coverage with ${itemCount} items available`;
    } else if (isLocal) {
      return `Local supplier with competitive pricing`;
    } else {
      return `Regional supplier with good availability`;
    }
  }

  private getSupplierPros(isNational: boolean, isLocal: boolean, cost: number): string[] {
    const pros = [];

    if (isNational) {
      pros.push('Nationwide coverage', 'Reliable availability', 'Standard terms');
    } else if (isLocal) {
      pros.push('Competitive local rates', 'Flexible terms', 'Quick delivery');
    }

    if (cost < 500) {
      pros.push('Cost-effective option');
    }

    return pros;
  }

  private getSupplierCons(isNational: boolean, isLocal: boolean, cost: number): string[] {
    const cons = [];

    if (isNational) {
      cons.push('Higher rates than local');
    } else if (isLocal) {
      cons.push('Limited equipment range');
    }

    if (cost > 1000) {
      cons.push('Higher cost option');
    }

    return cons;
  }

  private getDefaultSupplier(): SupplierRecommendation {
    return {
      supplier: 'HSS Hire',
      reason: 'National supplier with wide availability',
      estimatedCost: 0,
      availability: 'immediate',
      pros: ['Nationwide coverage', 'Wide equipment range'],
      cons: ['Premium pricing'],
    };
  }

  private isEquipmentItem(description: string): boolean {
    const equipmentKeywords = [
      'digger',
      'excavator',
      'scaffold',
      'mixer',
      'generator',
      'compactor',
      'dumper',
      'hoist',
      'sander',
      'cutter',
      'drill',
      'saw',
    ];

    return equipmentKeywords.some(keyword => description.toLowerCase().includes(keyword));
  }

  private estimateDuration(projectProfile: ProjectProfile): string {
    const timeline = projectProfile.scope?.timeline;

    if (timeline?.duration) {
      const weeks = parseInt(timeline.duration);
      if (weeks <= 1) return '1 week';
      if (weeks <= 4) return `${weeks} weeks`;
      return `${Math.ceil(weeks / 4)} months`;
    }

    // Default based on project type
    const projectDurations: Record<string, string> = {
      extension: '8 weeks',
      renovation: '6 weeks',
      bathroom: '2 weeks',
      kitchen: '3 weeks',
      landscaping: '4 weeks',
    };

    return projectDurations[projectProfile.projectType || ''] || '4 weeks';
  }

  private getDurationMultiplier(projectProfile: ProjectProfile): number {
    const duration = this.estimateDuration(projectProfile);

    if (duration.includes('week')) {
      const weeks = parseInt(duration) || 1;
      return weeks * 5; // 5 working days per week
    } else if (duration.includes('month')) {
      const months = parseInt(duration) || 1;
      return months * 20; // 20 working days per month
    }

    return 5; // Default to 1 week
  }
}
