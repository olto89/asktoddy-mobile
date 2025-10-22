import { AIProvider, AnalysisRequest, ProjectAnalysis } from '../types';

export class MockProvider implements AIProvider {
  name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true; // Mock provider is always available
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'down'; latency?: number }> {
    // Simulate network delay
    const latency = Math.random() * 500 + 100;
    await new Promise(resolve => setTimeout(resolve, latency));

    return { status: 'healthy', latency };
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate realistic mock data based on context
    const mockAnalysis = this.generateMockAnalysis(request);

    return mockAnalysis;
  }

  private generateMockAnalysis(request: AnalysisRequest): ProjectAnalysis {
    const projectTypes = [
      'Kitchen Renovation',
      'Bathroom Remodel',
      'Living Room Extension',
      'Loft Conversion',
      'Garden Landscaping',
      'Bedroom Makeover',
    ];

    const randomProjectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
    const isComplexProject =
      randomProjectType.includes('Extension') || randomProjectType.includes('Conversion');

    // Generate realistic costs based on project type
    const baseCost = this.getBaseCostForProject(randomProjectType);
    const materialsCost = {
      min: Math.round(baseCost.materials * 0.8),
      max: Math.round(baseCost.materials * 1.2),
    };
    const laborCost = {
      min: Math.round(baseCost.labor * 0.8),
      max: Math.round(baseCost.labor * 1.2),
    };

    return {
      projectType: randomProjectType,
      description: `Professional ${randomProjectType.toLowerCase()} based on image analysis. ${isComplexProject ? 'Complex structural work detected.' : 'Standard renovation work required.'}`,
      difficultyLevel: isComplexProject ? 'Professional Required' : 'Moderate',

      costBreakdown: {
        materials: {
          min: materialsCost.min,
          max: materialsCost.max,
          items: this.generateMaterialItems(randomProjectType),
        },
        labor: {
          min: laborCost.min,
          max: laborCost.max,
          hourlyRate: 45,
          estimatedHours: Math.round(laborCost.min / 45),
        },
        total: {
          min: materialsCost.min + laborCost.min,
          max: materialsCost.max + laborCost.max,
        },
      },

      timeline: {
        diy: isComplexProject ? '4-8 weeks' : '1-3 weeks',
        professional: isComplexProject ? '2-4 weeks' : '1-2 weeks',
        phases: this.generateProjectPhases(randomProjectType),
      },

      toolsRequired: this.generateToolRequirements(randomProjectType),

      safetyConsiderations: [
        'Wear appropriate safety equipment (goggles, gloves, dust masks)',
        'Ensure proper ventilation when using adhesives or paints',
        'Check for asbestos in properties built before 1980',
        'Turn off electricity/water before working on utilities',
      ],

      permitsRequired: isComplexProject
        ? ['Building control approval', 'Planning permission may be required']
        : ['No permits typically required'],

      requiresProfessional: isComplexProject,
      professionalReasons: isComplexProject
        ? [
            'Structural modifications require professional expertise',
            'Building regulations compliance needed',
            'Electrical/plumbing work requires certified tradesperson',
          ]
        : undefined,

      confidence: Math.floor(Math.random() * 20) + 75, // 75-95%

      recommendations: [
        'Get multiple quotes from local contractors',
        'Consider seasonal pricing variations',
        'Factor in additional 10-15% for unexpected issues',
        'Ensure all work meets current building regulations',
      ],

      warnings: request.additionalContext?.budgetRange
        ? [
            `Budget range provided: £${request.additionalContext.budgetRange.min} - £${request.additionalContext.budgetRange.max}`,
          ]
        : [],

      // Metadata (will be overridden by middleware)
      analysisId: '',
      timestamp: '',
      aiProvider: this.name,
      processingTimeMs: 0,
    };
  }

  private getBaseCostForProject(projectType: string): { materials: number; labor: number } {
    const costTable: Record<string, { materials: number; labor: number }> = {
      'Kitchen Renovation': { materials: 8000, labor: 6000 },
      'Bathroom Remodel': { materials: 4500, labor: 3500 },
      'Living Room Extension': { materials: 15000, labor: 12000 },
      'Loft Conversion': { materials: 12000, labor: 8000 },
      'Garden Landscaping': { materials: 3000, labor: 2000 },
      'Bedroom Makeover': { materials: 2500, labor: 1500 },
    };

    return costTable[projectType] || { materials: 5000, labor: 3000 };
  }

  private generateMaterialItems(projectType: string): any[] {
    const materialSets: Record<string, any[]> = {
      'Kitchen Renovation': [
        {
          name: 'Kitchen Units',
          quantity: '3 linear meters',
          unitPrice: 800,
          totalPrice: 2400,
          category: 'finishing',
        },
        {
          name: 'Worktop',
          quantity: '4 sq meters',
          unitPrice: 150,
          totalPrice: 600,
          category: 'finishing',
        },
        {
          name: 'Appliances',
          quantity: '1 set',
          unitPrice: 2500,
          totalPrice: 2500,
          category: 'other',
        },
        {
          name: 'Tiles',
          quantity: '8 sq meters',
          unitPrice: 25,
          totalPrice: 200,
          category: 'finishing',
        },
      ],
      'Bathroom Remodel': [
        {
          name: 'Bathroom Suite',
          quantity: '1 set',
          unitPrice: 800,
          totalPrice: 800,
          category: 'finishing',
        },
        {
          name: 'Tiles',
          quantity: '15 sq meters',
          unitPrice: 30,
          totalPrice: 450,
          category: 'finishing',
        },
        {
          name: 'Waterproofing',
          quantity: '1 room',
          unitPrice: 200,
          totalPrice: 200,
          category: 'structural',
        },
        {
          name: 'Plumbing Fittings',
          quantity: 'Various',
          unitPrice: 300,
          totalPrice: 300,
          category: 'plumbing',
        },
      ],
      'Living Room Extension': [
        {
          name: 'Bricks',
          quantity: '2000 units',
          unitPrice: 0.5,
          totalPrice: 1000,
          category: 'structural',
        },
        {
          name: 'Roof Materials',
          quantity: '25 sq meters',
          unitPrice: 80,
          totalPrice: 2000,
          category: 'structural',
        },
        {
          name: 'Windows',
          quantity: '2 units',
          unitPrice: 600,
          totalPrice: 1200,
          category: 'finishing',
        },
        {
          name: 'Insulation',
          quantity: '30 sq meters',
          unitPrice: 15,
          totalPrice: 450,
          category: 'structural',
        },
      ],
    };

    return (
      materialSets[projectType] || [
        {
          name: 'Standard Materials',
          quantity: 'As required',
          unitPrice: 100,
          totalPrice: 1000,
          category: 'other',
        },
      ]
    );
  }

  private generateProjectPhases(projectType: string): any[] {
    const phasesSets: Record<string, any[]> = {
      'Kitchen Renovation': [
        {
          name: 'Design & Planning',
          duration: '3-5 days',
          description: 'Kitchen design and material selection',
        },
        {
          name: 'Demolition',
          duration: '1-2 days',
          description: 'Remove existing kitchen units and appliances',
        },
        {
          name: 'First Fix',
          duration: '3-4 days',
          description: 'Electrical and plumbing rough work',
        },
        {
          name: 'Installation',
          duration: '5-7 days',
          description: 'Install units, worktops, and appliances',
        },
        {
          name: 'Finishing',
          duration: '2-3 days',
          description: 'Tiling, painting, and final touches',
        },
      ],
      'Bathroom Remodel': [
        { name: 'Planning', duration: '2-3 days', description: 'Design and material selection' },
        { name: 'Strip Out', duration: '1 day', description: 'Remove existing bathroom suite' },
        { name: 'Waterproofing', duration: '2 days', description: 'Install waterproof membrane' },
        { name: 'Installation', duration: '4-5 days', description: 'Install new suite and tiles' },
        { name: 'Finishing', duration: '1-2 days', description: 'Final connections and sealant' },
      ],
    };

    return (
      phasesSets[projectType] || [
        { name: 'Planning', duration: '1-2 days', description: 'Project planning and preparation' },
        { name: 'Execution', duration: '5-10 days', description: 'Main construction work' },
        { name: 'Finishing', duration: '2-3 days', description: 'Final touches and cleanup' },
      ]
    );
  }

  private generateToolRequirements(projectType: string): any[] {
    const toolSets: Record<string, any[]> = {
      'Kitchen Renovation': [
        {
          name: 'Cordless Drill',
          category: 'power_tools',
          dailyRentalPrice: 15,
          estimatedDays: 5,
          required: true,
        },
        {
          name: 'Circular Saw',
          category: 'power_tools',
          dailyRentalPrice: 25,
          estimatedDays: 3,
          required: true,
        },
        {
          name: 'Tile Cutter',
          category: 'power_tools',
          dailyRentalPrice: 30,
          estimatedDays: 2,
          required: false,
        },
        {
          name: 'Spirit Level',
          category: 'hand_tools',
          dailyRentalPrice: 5,
          estimatedDays: 5,
          required: true,
        },
      ],
      'Bathroom Remodel': [
        {
          name: 'Angle Grinder',
          category: 'power_tools',
          dailyRentalPrice: 20,
          estimatedDays: 2,
          required: true,
        },
        {
          name: 'Tile Cutter',
          category: 'power_tools',
          dailyRentalPrice: 30,
          estimatedDays: 3,
          required: true,
        },
        {
          name: 'Plumbing Tools',
          category: 'hand_tools',
          dailyRentalPrice: 15,
          estimatedDays: 4,
          required: true,
        },
      ],
    };

    return (
      toolSets[projectType] || [
        {
          name: 'Basic Tool Kit',
          category: 'hand_tools',
          dailyRentalPrice: 20,
          estimatedDays: 5,
          required: true,
        },
        {
          name: 'Power Drill',
          category: 'power_tools',
          dailyRentalPrice: 15,
          estimatedDays: 3,
          required: true,
        },
      ]
    );
  }
}
