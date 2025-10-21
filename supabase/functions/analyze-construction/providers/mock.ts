/**
 * Mock AI Provider for fallback and testing
 * Adapted for Deno environment
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis } from '../types.ts';

export class MockProvider implements AIProvider {
  name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true; // Mock provider is always available
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number }> {
    // Simulate variable latency
    const latency = Math.floor(Math.random() * 500) + 100; // 100-600ms
    await new Promise(resolve => setTimeout(resolve, latency));
    
    return { 
      status: 'healthy', 
      latency 
    };
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    // Simulate processing time
    const processingTime = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));

    const context = request.context;
    const projectType = this.determineProjectType(request);
    const complexity = this.determineComplexity(projectType);

    return {
      projectType,
      description: `Mock analysis of ${projectType.toLowerCase()}. This is a simulated response for testing purposes.`,
      difficultyLevel: complexity,
      
      costBreakdown: this.generateCostBreakdown(complexity, context?.budgetRange),
      
      timeline: {
        diy: complexity === 'Easy' ? '1-2 days' : complexity === 'Moderate' ? '3-5 days' : '1-2 weeks',
        professional: complexity === 'Easy' ? '4-6 hours' : complexity === 'Moderate' ? '1-2 days' : '3-5 days',
        phases: this.generatePhases(complexity)
      },
      
      toolsRequired: this.generateToolRequirements(complexity),
      
      safetyConsiderations: this.generateSafetyConsiderations(complexity),
      permitsRequired: complexity === 'Professional Required' ? ['Building permit', 'Planning permission'] : [],
      requiresProfessional: complexity === 'Professional Required',
      professionalReasons: complexity === 'Professional Required' ? 
        ['Structural modifications required', 'Complex electrical/plumbing work'] : [],
      
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90% confidence
      
      recommendations: [
        'Consider getting multiple quotes from local contractors',
        'Check current market prices for materials',
        'Plan for potential unexpected costs (10-15% contingency)',
        'Ensure all work complies with local building regulations'
      ],
      
      warnings: [
        'This is a mock analysis for testing purposes only',
        'Real professional assessment recommended for actual projects'
      ],
      
      // Metadata (will be set by middleware)
      analysisId: '',
      timestamp: '',
      aiProvider: this.name,
      processingTimeMs: 0
    };
  }

  private determineProjectType(request: AnalysisRequest): string {
    if (request.context?.projectType) {
      return request.context.projectType;
    }

    if (request.message) {
      const message = request.message.toLowerCase();
      if (message.includes('kitchen')) return 'Kitchen Renovation';
      if (message.includes('bathroom')) return 'Bathroom Renovation';
      if (message.includes('roof')) return 'Roof Repair';
      if (message.includes('garden') || message.includes('landscaping')) return 'Garden Landscaping';
      if (message.includes('paint')) return 'Interior Painting';
      if (message.includes('floor')) return 'Flooring Installation';
      if (message.includes('wall')) return 'Wall Construction/Repair';
      if (message.includes('extension')) return 'Home Extension';
    }

    // Default based on budget range
    const budget = request.context?.budgetRange;
    if (budget) {
      const avgBudget = (budget.min + budget.max) / 2;
      if (avgBudget < 2000) return 'Small Home Repair';
      if (avgBudget < 10000) return 'Medium Home Improvement';
      return 'Major Home Renovation';
    }

    return 'General Construction Project';
  }

  private determineComplexity(projectType: string): 'Easy' | 'Moderate' | 'Difficult' | 'Professional Required' {
    const type = projectType.toLowerCase();
    
    if (type.includes('paint') || type.includes('garden') || type.includes('small')) {
      return 'Easy';
    }
    
    if (type.includes('kitchen') || type.includes('bathroom') || type.includes('floor')) {
      return 'Moderate';
    }
    
    if (type.includes('roof') || type.includes('extension') || type.includes('structural')) {
      return 'Professional Required';
    }
    
    return 'Moderate'; // Default
  }

  private generateCostBreakdown(complexity: string, budgetRange?: { min: number; max: number }) {
    let baseMin = 500;
    let baseMax = 2000;
    
    if (budgetRange) {
      baseMin = budgetRange.min;
      baseMax = budgetRange.max;
    } else {
      switch (complexity) {
        case 'Easy':
          baseMin = 200;
          baseMax = 1000;
          break;
        case 'Moderate':
          baseMin = 1000;
          baseMax = 5000;
          break;
        case 'Difficult':
          baseMin = 3000;
          baseMax = 15000;
          break;
        case 'Professional Required':
          baseMin = 5000;
          baseMax = 25000;
          break;
      }
    }

    const materialsMin = Math.round(baseMin * 0.4);
    const materialsMax = Math.round(baseMax * 0.6);
    const laborMin = Math.round(baseMin * 0.6);
    const laborMax = Math.round(baseMax * 0.4);

    return {
      materials: {
        min: materialsMin,
        max: materialsMax,
        items: [
          {
            name: 'Basic Materials',
            quantity: '1 set',
            unitPrice: materialsMin,
            totalPrice: materialsMin,
            category: 'other' as const
          }
        ]
      },
      labor: {
        min: laborMin,
        max: laborMax,
        hourlyRate: 35,
        estimatedHours: Math.round(laborMin / 35)
      },
      total: {
        min: materialsMin + laborMin,
        max: materialsMax + laborMax
      }
    };
  }

  private generatePhases(complexity: string) {
    const basePhases = [
      { name: 'Planning', duration: '1 day', description: 'Project planning and preparation' },
      { name: 'Execution', duration: '2-3 days', description: 'Main construction work' },
      { name: 'Finishing', duration: '1 day', description: 'Final touches and cleanup' }
    ];

    if (complexity === 'Professional Required') {
      return [
        { name: 'Assessment', duration: '1 day', description: 'Professional site assessment' },
        { name: 'Permits', duration: '1-2 weeks', description: 'Obtain necessary permits' },
        ...basePhases
      ];
    }

    return basePhases;
  }

  private generateToolRequirements(complexity: string) {
    const basicTools = [
      {
        name: 'Basic Hand Tools',
        category: 'hand_tools' as const,
        dailyRentalPrice: 15,
        estimatedDays: 2,
        required: true,
        alternatives: ['Purchase basic tool set']
      }
    ];

    if (complexity === 'Easy') {
      return basicTools;
    }

    const powerTools = [
      {
        name: 'Power Drill',
        category: 'power_tools' as const,
        dailyRentalPrice: 25,
        estimatedDays: 3,
        required: true,
        alternatives: ['Cordless drill', 'Hammer drill']
      },
      {
        name: 'Angle Grinder',
        category: 'power_tools' as const,
        dailyRentalPrice: 20,
        estimatedDays: 2,
        required: false,
        alternatives: ['Manual cutting tools']
      }
    ];

    if (complexity === 'Professional Required') {
      return [
        ...basicTools,
        ...powerTools,
        {
          name: 'Specialized Equipment',
          category: 'heavy_machinery' as const,
          dailyRentalPrice: 100,
          estimatedDays: 3,
          required: true,
          alternatives: ['Professional contractor with equipment']
        }
      ];
    }

    return [...basicTools, ...powerTools];
  }

  private generateSafetyConsiderations(complexity: string) {
    const basic = [
      'Wear appropriate personal protective equipment (PPE)',
      'Ensure adequate lighting in work area',
      'Keep first aid kit accessible'
    ];

    if (complexity === 'Professional Required') {
      return [
        ...basic,
        'Professional safety assessment required',
        'Structural safety considerations',
        'Electrical and gas safety protocols',
        'Building regulations compliance'
      ];
    }

    if (complexity === 'Difficult' || complexity === 'Moderate') {
      return [
        ...basic,
        'Check for asbestos and lead paint',
        'Ensure proper ventilation',
        'Turn off utilities when required'
      ];
    }

    return basic;
  }
}