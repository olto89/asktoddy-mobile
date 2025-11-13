/**
 * PricingEnhancer - Additive enhancement for AI analysis with real market data
 * Connects to existing pricing database and enhances base analysis with actual costs
 */

import { ProjectAnalysis, AnalysisRequest, PricingContext } from '../types.ts';
import { UKPricingService } from '../../get-pricing/pricing-service.ts';
import {
  PricingRequest,
  PricingResponse,
  ToolHireRate,
  MaterialPrice,
  LabourRate,
} from '../../get-pricing/types.ts';

export interface EnhancementOptions {
  materials?: boolean;
  labour?: boolean;
  toolHire?: boolean;
  waste?: boolean;
  aggregates?: boolean;
  regional?: boolean;
  enableDebugLogging?: boolean;
}

export interface PricingEnhancement {
  originalCosts: any;
  enhancedCosts: any;
  marketData: PricingResponse;
  confidenceScore: number;
  enhancementApplied: boolean;
  dataSource: string;
  processingTimeMs: number;
}

export class PricingEnhancer {
  private pricingService: UKPricingService;
  private enableDebugLogging: boolean;

  constructor(enableDebugLogging = false) {
    this.pricingService = new UKPricingService();
    this.enableDebugLogging = enableDebugLogging;
  }

  /**
   * Main enhancement method - adds real market pricing to base analysis
   * Uses additive pattern: never breaks base analysis, only enhances it
   */
  async enhance(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    options: EnhancementOptions = {}
  ): Promise<ProjectAnalysis & { pricingEnhancement?: PricingEnhancement }> {
    const startTime = Date.now();

    try {
      this.log('🔧 Starting pricing enhancement', {
        projectType: analysis.projectType,
        location: this.extractLocation(request),
        options,
      });

      // Extract pricing requirements from analysis
      const pricingRequest = this.buildPricingRequest(analysis, request, options);

      if (!pricingRequest) {
        this.log('⚠️ Could not build pricing request - skipping enhancement');
        return analysis;
      }

      // Get real market data
      const marketData = await this.pricingService.getPricingData(pricingRequest);

      // Apply market pricing to analysis
      const enhancedAnalysis = this.applyMarketPricing(analysis, marketData, options);

      // Calculate confidence based on data quality
      const confidenceScore = this.calculateConfidence(analysis, marketData);

      const pricingEnhancement: PricingEnhancement = {
        originalCosts: analysis.costBreakdown,
        enhancedCosts: enhancedAnalysis.costBreakdown,
        marketData,
        confidenceScore,
        enhancementApplied: true,
        dataSource: 'uk_market_data_2024',
        processingTimeMs: Date.now() - startTime,
      };

      this.log('✅ Pricing enhancement completed', {
        confidenceScore,
        processingTime: pricingEnhancement.processingTimeMs,
        enhancementApplied: true,
      });

      return {
        ...enhancedAnalysis,
        pricingEnhancement,
      };
    } catch (error) {
      this.log('❌ Pricing enhancement failed', { error: error.message });

      // Graceful degradation - return original analysis with error info
      return {
        ...analysis,
        pricingEnhancement: {
          originalCosts: analysis.costBreakdown,
          enhancedCosts: analysis.costBreakdown,
          marketData: null,
          confidenceScore: 0,
          enhancementApplied: false,
          dataSource: 'enhancement_failed',
          processingTimeMs: Date.now() - startTime,
          error: error.message,
        } as any,
      };
    }
  }

  /**
   * Build pricing request from AI analysis
   */
  private buildPricingRequest(
    analysis: ProjectAnalysis,
    request: AnalysisRequest,
    options: EnhancementOptions
  ): PricingRequest | null {
    try {
      const location = this.extractLocation(request) || 'East Midlands'; // Default to average UK pricing
      const projectType = analysis.projectType || 'general construction';

      // Extract tools from analysis
      let tools: string[] = [];
      if (options.toolHire && analysis.toolsRequired) {
        tools = analysis.toolsRequired;
      }

      // Extract materials from description
      let materials: string[] = [];
      if (options.materials) {
        materials = this.extractMaterials(analysis.description || '');
      }

      const pricingRequest: PricingRequest = {
        location,
        projectType,
        tools: tools.length > 0 ? tools : undefined,
        materials: materials.length > 0 ? materials : undefined,
        projectScale: this.estimateProjectScale(analysis),
        urgency: 'standard',
      };

      this.log('📋 Built pricing request', pricingRequest);
      return pricingRequest;
    } catch (error) {
      this.log('❌ Failed to build pricing request', { error: error.message });
      return null;
    }
  }

  /**
   * Apply market pricing to analysis cost breakdown
   */
  private applyMarketPricing(
    analysis: ProjectAnalysis,
    marketData: PricingResponse,
    options: EnhancementOptions
  ): ProjectAnalysis {
    const enhanced = { ...analysis };

    if (!enhanced.costBreakdown) {
      enhanced.costBreakdown = {
        materials: { min: 0, max: 0 },
        labor: { min: 0, max: 0 },
        total: { min: 0, max: 0 },
      };
    }

    // Enhance materials pricing
    if (options.materials && marketData.materials.length > 0) {
      const materialsCost = this.calculateMaterialsCost(marketData.materials);
      enhanced.costBreakdown.materials = {
        min: materialsCost.min,
        max: materialsCost.max,
        items: this.formatMaterialsItems(marketData.materials),
      };
    }

    // Enhance labour pricing
    if (options.labour && marketData.labour.length > 0) {
      const labourCost = this.calculateLabourCost(marketData.labour, enhanced);
      enhanced.costBreakdown.labor = {
        min: labourCost.min,
        max: labourCost.max,
        hourlyRate: labourCost.averageHourlyRate,
        estimatedHours: labourCost.estimatedHours,
      };
    }

    // Enhance tool hire pricing
    if (options.toolHire && marketData.toolHire.length > 0) {
      const toolHireCost = this.calculateToolHireCost(marketData.toolHire, enhanced);
      enhanced.costBreakdown.toolHire = {
        min: toolHireCost.min,
        max: toolHireCost.max,
        items: this.formatToolHireItems(marketData.toolHire),
      };
    }

    // Recalculate total with regional adjustments
    if (options.regional) {
      this.applyRegionalAdjustments(enhanced, marketData.contextFactors);
    }

    // Update total cost
    const materials = enhanced.costBreakdown.materials || { min: 0, max: 0 };
    const labor = enhanced.costBreakdown.labor || { min: 0, max: 0 };
    const toolHire = enhanced.costBreakdown.toolHire || { min: 0, max: 0 };

    enhanced.costBreakdown.total = {
      min: materials.min + labor.min + toolHire.min,
      max: materials.max + labor.max + toolHire.max,
    };

    // Add pricing recommendations
    enhanced.recommendations = [
      ...(enhanced.recommendations || []),
      ...this.generatePricingRecommendations(marketData),
    ];

    this.log('💰 Applied market pricing', {
      originalTotal: analysis.costBreakdown?.total,
      enhancedTotal: enhanced.costBreakdown.total,
      recommendations: enhanced.recommendations.length,
    });

    return enhanced;
  }

  /**
   * Calculate materials cost from market data
   */
  private calculateMaterialsCost(materials: any[]) {
    let totalMin = 0;
    let totalMax = 0;

    materials.forEach(material => {
      if (material.priceRange) {
        totalMin += material.priceRange.min;
        totalMax += material.priceRange.max;
      }
    });

    return { min: totalMin, max: totalMax };
  }

  /**
   * Calculate labour cost from market data
   */
  private calculateLabourCost(labour: any[], analysis: ProjectAnalysis) {
    let totalMin = 0;
    let totalMax = 0;
    let totalHourlyRate = 0;
    let tradeCount = 0;

    labour.forEach(trade => {
      if (trade.hourlyRate) {
        totalMin += trade.hourlyRate.min * 8; // Daily rate
        totalMax += trade.hourlyRate.max * 8;
        totalHourlyRate += trade.hourlyRate.average;
        tradeCount++;
      }
    });

    const averageHourlyRate = tradeCount > 0 ? totalHourlyRate / tradeCount : 35;
    const estimatedHours = this.estimateProjectHours(analysis);

    return {
      min: (totalMin * estimatedHours) / 8,
      max: (totalMax * estimatedHours) / 8,
      averageHourlyRate,
      estimatedHours,
    };
  }

  /**
   * Calculate tool hire cost from market data
   */
  private calculateToolHireCost(toolHire: any[], analysis: ProjectAnalysis) {
    let totalMin = 0;
    let totalMax = 0;

    const estimatedDays = this.estimateProjectDays(analysis);

    toolHire.forEach(tool => {
      if (tool.dailyRate) {
        totalMin += tool.dailyRate * estimatedDays;
        totalMax += tool.dailyRate * estimatedDays * 1.2; // Factor for variations
      }
    });

    return { min: totalMin, max: totalMax };
  }

  /**
   * Apply regional pricing adjustments
   */
  private applyRegionalAdjustments(analysis: ProjectAnalysis, contextFactors: any) {
    if (contextFactors?.regionMultiplier) {
      const multiplier = contextFactors.regionMultiplier;

      if (analysis.costBreakdown) {
        Object.keys(analysis.costBreakdown).forEach(key => {
          if (key !== 'total' && analysis.costBreakdown[key]?.min !== undefined) {
            analysis.costBreakdown[key].min *= multiplier;
            analysis.costBreakdown[key].max *= multiplier;
          }
        });
      }
    }
  }

  /**
   * Generate pricing recommendations
   */
  private generatePricingRecommendations(marketData: PricingResponse): string[] {
    const recommendations: string[] = [];

    if (marketData.recommendations) {
      marketData.recommendations.forEach(rec => {
        recommendations.push(rec.message);
      });
    }

    // Add generic pricing advice
    recommendations.push(
      'Prices include current market rates and regional variations',
      'Consider getting multiple quotes for comparison',
      'Bulk purchasing may reduce material costs by 10-15%'
    );

    return recommendations;
  }

  /**
   * Helper methods
   */

  private extractLocation(request: AnalysisRequest): string | null {
    // Look for location in message
    if (request.message) {
      const locationMatch = request.message.match(/(?:in|at|near)\s+([A-Za-z\s]+?)(?:[,.!?]|$)/i);
      if (locationMatch) {
        return locationMatch[1].trim();
      }
    }

    // Look for location in any existing context
    if (request.location) {
      return request.location;
    }

    return null;
  }

  private extractMaterials(description: string): string[] {
    const materials: string[] = [];

    // Common building materials keywords
    const materialPatterns = [
      /\b(brick|bricks)\b/gi,
      /\b(cement|concrete)\b/gi,
      /\b(timber|wood)\b/gi,
      /\b(steel|metal)\b/gi,
      /\b(tiles?|tiling)\b/gi,
      /\b(paint|painting)\b/gi,
      /\b(plaster|plastering)\b/gi,
      /\b(insulation)\b/gi,
      /\b(roofing|roof)\b/gi,
      /\b(flooring|floor)\b/gi,
      /\b(electrical|wiring)\b/gi,
      /\b(plumbing|pipes)\b/gi,
    ];

    materialPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        materials.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(materials)]; // Remove duplicates
  }

  private estimateProjectScale(analysis: ProjectAnalysis): 'small' | 'medium' | 'large' {
    if (!analysis.costBreakdown?.total) return 'small';

    const totalMax = analysis.costBreakdown.total.max || 0;

    if (totalMax > 10000) return 'large';
    if (totalMax > 3000) return 'medium';
    return 'small';
  }

  private estimateProjectDays(analysis: ProjectAnalysis): number {
    if (analysis.timeline?.professional) {
      const match = analysis.timeline.professional.match(/(\d+)/);
      return match ? parseInt(match[1]) : 5;
    }
    return 5; // Default
  }

  private estimateProjectHours(analysis: ProjectAnalysis): number {
    return this.estimateProjectDays(analysis) * 8; // 8 hours per day
  }

  private formatMaterialsItems(materials: any[]) {
    return materials.map(material => ({
      name: material.name,
      quantity: 1,
      unitPrice: material.priceRange?.average || 0,
      unit: material.unit || 'item',
    }));
  }

  private formatToolHireItems(tools: any[]) {
    return tools.map(tool => ({
      name: tool.name,
      dailyRate: tool.dailyRate,
      availability: tool.availability || 'medium',
    }));
  }

  private calculateConfidence(analysis: ProjectAnalysis, marketData: PricingResponse): number {
    let confidence = 0.6; // Base confidence

    // Add confidence based on data completeness
    if (marketData.materials.length > 0) confidence += 0.1;
    if (marketData.labour.length > 0) confidence += 0.1;
    if (marketData.toolHire.length > 0) confidence += 0.1;

    // Add confidence based on analysis completeness
    if (analysis.projectType) confidence += 0.05;
    if (analysis.description && analysis.description.length > 50) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  private log(message: string, data?: any) {
    if (this.enableDebugLogging) {
      console.log(`[PricingEnhancer] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}
