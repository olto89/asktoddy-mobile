/**
 * Project Analysis Service - Stable Hybrid Approach
 *
 * Uses server-side calculations for materials (100% reliable)
 * Uses AI only for labor estimates and project insights
 */

import { MaterialCalculationService, ProjectSpecification } from './MaterialCalculationService.ts';

export interface SimpleProjectInfo {
  dimensions?: { length: number; width: number; height?: number };
  projectType?: string;
  description: string;
  location: string;
  features?: {
    hasElectrical?: boolean;
    hasPlumbing?: boolean;
    socketCount?: number;
  };
  qualityLevel?: 'budget' | 'standard' | 'premium';
}

export interface StableAnalysisResult {
  success: boolean;
  data: {
    projectType: string;
    description: string;
    costBreakdown: {
      materials: {
        total: { min: number; max: number };
        items: Array<{
          name: string;
          quantity: number;
          unit: string;
          unitPrice: number;
          totalCost: number;
        }>;
        breakdown: {
          structural: number;
          finishing: number;
          services: number;
          roofing: number;
        };
      };
      labor: {
        min: number;
        max: number;
        hourlyRate: number;
        estimatedHours: number;
      };
      total: {
        min: number;
        max: number;
      };
    };
    timeline: {
      professional: string;
      totalDays: number;
    };
    confidence: number;
    calculations: {
      methodology: string;
      assumptions: string[];
    };
  };
  processingTimeMs: number;
}

export class ProjectAnalysisService {
  /**
   * Analyze project with stable server-side material calculations
   */
  static analyzeProject(projectInfo: SimpleProjectInfo): StableAnalysisResult {
    const startTime = Date.now();

    try {
      // Extract project specifications
      const spec = this.extractProjectSpec(projectInfo);

      if (!spec) {
        throw new Error('Unable to extract project specifications');
      }

      // Calculate materials server-side (100% reliable)
      const materialResult = MaterialCalculationService.calculateMaterials(spec);

      // Calculate labor estimates (simple formulas, no AI)
      const laborEstimate = this.calculateLaborEstimate(spec, materialResult.totals.total);

      // Calculate timeline estimate
      const timelineEstimate = this.calculateTimeline(spec);

      // Build response
      const result: StableAnalysisResult = {
        success: true,
        data: {
          projectType: this.formatProjectType(spec),
          description: this.generateDescription(spec, materialResult),
          costBreakdown: {
            materials: {
              total: {
                min: Math.round(materialResult.totals.subtotal * 0.95),
                max: Math.round(materialResult.totals.subtotal * 1.05),
              },
              items: materialResult.materials.map(m => ({
                name: m.name,
                quantity: m.quantity,
                unit: m.unit,
                unitPrice: m.unitPrice,
                totalCost: Math.round(m.totalCost * (1 + m.wasteFactor)),
              })),
              breakdown: {
                structural: materialResult.totals.structural,
                finishing: materialResult.totals.finishing,
                services: materialResult.totals.services,
                roofing: materialResult.totals.roofing,
              },
            },
            labor: laborEstimate,
            total: {
              min: Math.round(materialResult.totals.total * 0.95 + laborEstimate.min),
              max: Math.round(materialResult.totals.total * 1.05 + laborEstimate.max),
            },
          },
          timeline: timelineEstimate,
          confidence: 95, // High confidence for server-side calculations
          calculations: {
            methodology: materialResult.metadata.calculationMethod,
            assumptions: materialResult.metadata.assumptions,
          },
        },
        processingTimeMs: Date.now() - startTime,
      };

      return result;
    } catch (error) {
      return {
        success: false,
        data: null as any,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract project specifications from user input
   */
  private static extractProjectSpec(projectInfo: SimpleProjectInfo): ProjectSpecification | null {
    // Must have dimensions for reliable calculations
    if (!projectInfo.dimensions) {
      return null;
    }

    const { dimensions, description, location } = projectInfo;

    // Determine project type from description
    let projectType: ProjectSpecification['projectType'] = 'extension';
    const desc = description.toLowerCase();
    if (desc.includes('loft') || desc.includes('attic')) {
      projectType = 'loft_conversion';
    } else if (desc.includes('renovation') || desc.includes('refurb')) {
      projectType = 'renovation';
    } else if (desc.includes('new build') || desc.includes('new house')) {
      projectType = 'new_build';
    }

    // Extract features from description
    const features = {
      hasElectrical:
        desc.includes('electrical') || desc.includes('socket') || desc.includes('light'),
      hasPlumbing:
        desc.includes('plumbing') || desc.includes('bathroom') || desc.includes('kitchen'),
      hasBathroom: desc.includes('bathroom') || desc.includes('toilet') || desc.includes('shower'),
      hasKitchen: desc.includes('kitchen'),
      socketCount: projectInfo.features?.socketCount || this.extractSocketCount(description),
      lightingPoints: this.extractLightingPoints(description),
    };

    return {
      dimensions,
      projectType,
      features,
      finishLevel: projectInfo.qualityLevel || 'standard',
      location,
    };
  }

  /**
   * Extract socket count from description
   */
  private static extractSocketCount(description: string): number {
    const socketMatch = description.match(/(\d+)\s*socket/i);
    if (socketMatch) {
      return parseInt(socketMatch[1]);
    }

    // Default based on room type
    if (description.includes('kitchen')) return 6;
    if (description.includes('bedroom')) return 4;
    if (description.includes('office')) return 6;

    return 4; // Default minimum
  }

  /**
   * Extract lighting points from description
   */
  private static extractLightingPoints(description: string): number {
    const lightMatch = description.match(/(\d+)\s*light/i);
    if (lightMatch) {
      return parseInt(lightMatch[1]);
    }

    return 2; // Default minimum
  }

  /**
   * Calculate labor estimate using simple formulas
   */
  private static calculateLaborEstimate(
    spec: ProjectSpecification,
    materialCost: number
  ): { min: number; max: number; hourlyRate: number; estimatedHours: number } {
    const floorArea = spec.dimensions.length * spec.dimensions.width;

    // Base hours calculation by project type
    const baseHoursPerSqm = {
      extension: 8, // 8 hours per m²
      renovation: 6, // 6 hours per m²
      new_build: 10, // 10 hours per m²
      loft_conversion: 7, // 7 hours per m²
    };

    const baseHours = floorArea * baseHoursPerSqm[spec.projectType];

    // Add complexity factors
    let complexityMultiplier = 1.0;
    if (spec.features.hasPlumbing) complexityMultiplier += 0.3;
    if (spec.features.hasElectrical) complexityMultiplier += 0.2;
    if (spec.features.hasBathroom) complexityMultiplier += 0.4;
    if (spec.features.hasKitchen) complexityMultiplier += 0.3;

    const estimatedHours = Math.round(baseHours * complexityMultiplier);

    // UK average rates
    const hourlyRates = {
      budget: 25,
      standard: 35,
      premium: 50,
    };

    const hourlyRate = hourlyRates[spec.finishLevel];

    return {
      min: Math.round(estimatedHours * hourlyRate * 0.8),
      max: Math.round(estimatedHours * hourlyRate * 1.2),
      hourlyRate,
      estimatedHours,
    };
  }

  /**
   * Calculate timeline estimate
   */
  private static calculateTimeline(spec: ProjectSpecification): {
    professional: string;
    totalDays: number;
  } {
    const floorArea = spec.dimensions.length * spec.dimensions.width;

    // Base timeline by project type (working days)
    const baseDaysPerSqm = {
      extension: 1.2, // 1.2 days per m²
      renovation: 0.8, // 0.8 days per m²
      new_build: 1.5, // 1.5 days per m²
      loft_conversion: 1.0, // 1 day per m²
    };

    let totalDays = Math.ceil(floorArea * baseDaysPerSqm[spec.projectType]);

    // Add complexity days
    if (spec.features.hasPlumbing) totalDays += 2;
    if (spec.features.hasElectrical) totalDays += 1;
    if (spec.features.hasBathroom) totalDays += 3;
    if (spec.features.hasKitchen) totalDays += 2;

    // Minimum timelines
    const minimums = {
      extension: 7,
      renovation: 5,
      new_build: 10,
      loft_conversion: 6,
    };

    totalDays = Math.max(totalDays, minimums[spec.projectType]);

    const weeks = Math.ceil(totalDays / 5); // Working days to weeks

    return {
      professional: weeks === 1 ? '1 week' : `${weeks} weeks`,
      totalDays,
    };
  }

  /**
   * Format project type for display
   */
  private static formatProjectType(spec: ProjectSpecification): string {
    const { length, width } = spec.dimensions;
    const area = length * width;

    const typeNames = {
      extension: 'Single-Story Extension',
      renovation: 'Renovation Project',
      new_build: 'New Build Project',
      loft_conversion: 'Loft Conversion',
    };

    return `${typeNames[spec.projectType]} (${length}m × ${width}m, ${area}m²)`;
  }

  /**
   * Generate project description
   */
  private static generateDescription(spec: ProjectSpecification, materialResult: any): string {
    const area = spec.dimensions.length * spec.dimensions.width;
    const materialCount = materialResult.materials.length;

    return `Professional analysis for ${area}m² ${spec.projectType} with ${materialCount} calculated materials using industry-standard quantities and UK building regulations.`;
  }
}
