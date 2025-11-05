/**
 * Project Type Templates & Cost Structure System
 * Ensures consistent quote structure while maintaining conversational UX
 */

export interface CostCategory {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  typicalPercentage: number; // Of total project cost
  estimationMethod: 'per_m2' | 'per_unit' | 'fixed' | 'percentage' | 'daily_rate';
  refinementQuestions: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  aliases: string[]; // Alternative names for this project type
  costCategories: CostCategory[];
  estimationApproach: 'detailed' | 'simplified';
  typicalDuration: { min: number; max: number }; // In days
  complexityFactors: string[];
  refinementFlow: {
    initialQuestions: string[];
    iterativeQuestions: string[];
    finalValidation: string[];
  };
}

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  // ====================================
  // EXTENSIONS & STRUCTURAL WORK
  // ====================================

  extension: {
    id: 'extension',
    name: 'House Extension',
    aliases: [
      'extension',
      'house extension',
      'rear extension',
      'side extension',
      'wrap around',
      'single storey',
      'double storey',
    ],
    costCategories: [
      {
        id: 'groundwork',
        name: 'Foundations & Groundwork',
        description: 'Excavation, foundations, drainage, utilities',
        isRequired: true,
        typicalPercentage: 15,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'What type of foundations are needed? (strip, pad, piled)',
          'Are there any utility diversions required?',
          "What's the ground condition like? (clay, sand, rock)",
        ],
      },
      {
        id: 'structure',
        name: 'Structure & Build',
        description: 'Walls, roof, windows, doors',
        isRequired: true,
        typicalPercentage: 35,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'What wall construction? (cavity, timber frame, ICF)',
          'Roof type? (pitched, flat, green roof)',
          'Window specification? (double/triple glazed, material)',
        ],
      },
      {
        id: 'materials',
        name: 'Building Materials',
        description: 'Bricks, blocks, timber, insulation, roofing',
        isRequired: true,
        typicalPercentage: 25,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'Brick type preference? (facing, reclaimed, engineered)',
          'Insulation level required? (building regs, Passivhaus)',
          'Any specific material requirements?',
        ],
      },
      {
        id: 'labour',
        name: 'Labour & Trades',
        description: 'Skilled trades for construction work',
        isRequired: true,
        typicalPercentage: 20,
        estimationMethod: 'daily_rate',
        refinementQuestions: [
          'Are you managing trades or using a main contractor?',
          'Any specialist skills needed? (steelwork, timber frame)',
          'Timeline constraints affecting labour costs?',
        ],
      },
      {
        id: 'waste',
        name: 'Waste Management',
        description: 'Skip hire, muck-away, disposal',
        isRequired: true,
        typicalPercentage: 3,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'How much demolition is involved?',
          'Access for skip placement?',
          'Any hazardous materials? (asbestos, contaminated soil)',
        ],
      },
      {
        id: 'services',
        name: 'Services & Utilities',
        description: 'Electrical, plumbing, heating, drainage',
        isRequired: false,
        typicalPercentage: 12,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'New heating system or extension to existing?',
          'Electrical requirements? (new consumer unit, circuits)',
          'Bathroom/kitchen plumbing included?',
        ],
      },
    ],
    estimationApproach: 'detailed',
    typicalDuration: { min: 12, max: 26 },
    complexityFactors: [
      'Planning permission requirements',
      'Building regulations complexity',
      'Structural calculations needed',
      'Party wall agreements',
      'Access constraints',
      'Utility diversions',
    ],
    refinementFlow: {
      initialQuestions: [
        "What's the rough size of the extension? (length x width)",
        'Single or double storey?',
        "What's the main purpose? (kitchen, living space, bedroom)",
      ],
      iterativeQuestions: [
        'Which category feels most uncertain in the quote?',
        "Are there any specific requirements I haven't covered?",
        'Does the breakdown match your expectations?',
      ],
      finalValidation: [
        'Does this total feel realistic for your project?',
        'Should we adjust any categories based on your priorities?',
      ],
    },
  },

  // ====================================
  // KITCHEN RENOVATION
  // ====================================

  kitchen: {
    id: 'kitchen',
    name: 'Kitchen Renovation',
    aliases: ['kitchen', 'kitchen renovation', 'new kitchen', 'kitchen refit', 'kitchen makeover'],
    costCategories: [
      {
        id: 'units',
        name: 'Kitchen Units & Carcasses',
        description: 'Base units, wall units, tall units, islands',
        isRequired: true,
        typicalPercentage: 25,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'How many linear metres of units needed?',
          'Any island or peninsula units?',
          'Unit style preference? (shaker, handleless, traditional)',
        ],
      },
      {
        id: 'worktops',
        name: 'Worktops & Surfaces',
        description: 'Countertops, splashbacks, breakfast bars',
        isRequired: true,
        typicalPercentage: 15,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'Worktop material preference? (quartz, granite, wood)',
          'Edge treatments? (square, bullnose, waterfall)',
          'Splashback requirements? (tiles, glass, stone)',
        ],
      },
      {
        id: 'appliances',
        name: 'Kitchen Appliances',
        description: 'Oven, hob, extractor, fridge, dishwasher',
        isRequired: true,
        typicalPercentage: 20,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'Which appliances need replacing?',
          'Built-in or freestanding preference?',
          'Any specific brands or features required?',
        ],
      },
      {
        id: 'labour',
        name: 'Installation & Trades',
        description: 'Kitchen fitters, electricians, plumbers',
        isRequired: true,
        typicalPercentage: 25,
        estimationMethod: 'daily_rate',
        refinementQuestions: [
          'Full removal and installation?',
          'Any structural changes needed? (walls, windows)',
          'Timeline constraints?',
        ],
      },
      {
        id: 'services',
        name: 'Plumbing & Electrical',
        description: 'New circuits, water supply, waste, gas',
        isRequired: true,
        typicalPercentage: 10,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'Moving any services? (sink, hob, water supply)',
          'Gas supply changes needed?',
          'Additional electrical circuits required?',
        ],
      },
      {
        id: 'waste',
        name: 'Waste Removal',
        description: 'Old kitchen disposal, packaging removal',
        isRequired: true,
        typicalPercentage: 3,
        estimationMethod: 'fixed',
        refinementQuestions: [
          'How much of the old kitchen is being removed?',
          'Any appliance disposal needed?',
          'Access for waste removal?',
        ],
      },
      {
        id: 'finishes',
        name: 'Decoration & Finishes',
        description: 'Painting, flooring, finishing touches',
        isRequired: false,
        typicalPercentage: 7,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'New flooring required?',
          'Painting and decorating included?',
          'Any tiling work needed?',
        ],
      },
    ],
    estimationApproach: 'simplified',
    typicalDuration: { min: 5, max: 15 },
    complexityFactors: [
      'Structural changes required',
      'Service relocations',
      'Planning permission needed',
      'Listed building considerations',
      'Access difficulties',
    ],
    refinementFlow: {
      initialQuestions: [
        'Roughly what size kitchen? (small galley, large family, etc.)',
        'Are you keeping the same layout or changing it?',
        "What's your quality level preference? (budget, mid-range, premium)",
      ],
      iterativeQuestions: [
        'Which category do you want to spend more/less on?',
        'Any must-haves I might have missed?',
        'Does the appliance allowance seem right?',
      ],
      finalValidation: [
        'How does this compare to your budget expectations?',
        'Should we adjust the specification level?',
      ],
    },
  },

  // ====================================
  // BATHROOM RENOVATION
  // ====================================

  bathroom: {
    id: 'bathroom',
    name: 'Bathroom Renovation',
    aliases: [
      'bathroom',
      'bathroom renovation',
      'new bathroom',
      'bathroom refit',
      'ensuite',
      'shower room',
    ],
    costCategories: [
      {
        id: 'sanitaryware',
        name: 'Bathroom Suite',
        description: 'Bath, toilet, basin, shower enclosure',
        isRequired: true,
        typicalPercentage: 30,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'Bath, shower, or both?',
          'What type of shower? (electric, mixer, power)',
          'Quality level preference? (standard, designer, luxury)',
        ],
      },
      {
        id: 'tiling',
        name: 'Wall & Floor Tiling',
        description: 'Ceramic, porcelain, natural stone tiles',
        isRequired: true,
        typicalPercentage: 20,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'How much tiling? (wet areas only, full room)',
          'Tile preference? (ceramic, porcelain, natural stone)',
          'Any feature walls or decorative elements?',
        ],
      },
      {
        id: 'labour',
        name: 'Installation & Trades',
        description: 'Bathroom fitters, tilers, plumbers',
        isRequired: true,
        typicalPercentage: 25,
        estimationMethod: 'daily_rate',
        refinementQuestions: [
          'Complete strip out and refit?',
          'Any structural work needed?',
          'Timeline requirements?',
        ],
      },
      {
        id: 'plumbing',
        name: 'Plumbing & Heating',
        description: 'New pipework, radiator, water pressure',
        isRequired: true,
        typicalPercentage: 15,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'Moving any fixtures? (toilet, basin position)',
          'Water pressure adequate for shower?',
          'New heating? (towel rail, underfloor)',
        ],
      },
      {
        id: 'electrical',
        name: 'Electrical Work',
        description: 'Lighting, extractor, shaver points',
        isRequired: true,
        typicalPercentage: 8,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'New lighting scheme?',
          'Extractor fan requirements?',
          'Any special electrical needs? (heated mirror, etc.)',
        ],
      },
      {
        id: 'waste',
        name: 'Waste Removal',
        description: 'Old bathroom disposal',
        isRequired: true,
        typicalPercentage: 2,
        estimationMethod: 'fixed',
        refinementQuestions: [
          'How much demolition involved?',
          'Any heavy items to remove? (cast iron bath)',
          'Access for waste removal?',
        ],
      },
    ],
    estimationApproach: 'simplified',
    typicalDuration: { min: 7, max: 14 },
    complexityFactors: [
      'Water pressure issues',
      'Structural modifications',
      'Accessibility requirements',
      'Listed building constraints',
      'Asbestos presence',
    ],
    refinementFlow: {
      initialQuestions: [
        'What size bathroom? (small ensuite, family bathroom, etc.)',
        'Are you changing the layout or keeping it similar?',
        "What's driving the renovation? (aesthetics, functionality, problems)",
      ],
      iterativeQuestions: [
        'Which area do you want to prioritize budget-wise?',
        'Any specific features that are must-haves?',
        'Does the timeline estimate work for you?',
      ],
      finalValidation: [
        'How does this total compare to your expectations?',
        'Should we adjust the specification levels?',
      ],
    },
  },

  // ====================================
  // LOFT CONVERSION
  // ====================================

  loft: {
    id: 'loft',
    name: 'Loft Conversion',
    aliases: ['loft conversion', 'loft', 'attic conversion', 'roof conversion', 'dormer'],
    costCategories: [
      {
        id: 'structure',
        name: 'Structural Work',
        description: 'Steel beams, floor joists, roof modifications',
        isRequired: true,
        typicalPercentage: 25,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'What type of conversion? (velux, dormer, mansard)',
          'Structural survey completed?',
          'Party wall agreements needed?',
        ],
      },
      {
        id: 'roofing',
        name: 'Roofing & Dormers',
        description: 'New roof sections, dormers, windows',
        isRequired: true,
        typicalPercentage: 20,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'Dormer windows needed?',
          'Roof light preferences? (velux, conservation)',
          'Matching existing roof materials?',
        ],
      },
      {
        id: 'insulation',
        name: 'Insulation & Boarding',
        description: 'Roof insulation, plasterboard, vapor barriers',
        isRequired: true,
        typicalPercentage: 15,
        estimationMethod: 'per_m2',
        refinementQuestions: [
          'Insulation level required? (building regs, enhanced)',
          'Ceiling height preferences?',
          'Soundproofing requirements?',
        ],
      },
      {
        id: 'staircase',
        name: 'Staircase & Access',
        description: 'New stairs, balustrades, landings',
        isRequired: true,
        typicalPercentage: 12,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'Where will the stairs go?',
          'Straight or turn staircase?',
          'Material preference? (timber, steel, glass)',
        ],
      },
      {
        id: 'services',
        name: 'Electrical & Plumbing',
        description: 'Power, lighting, heating, water supply',
        isRequired: true,
        typicalPercentage: 15,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'Ensuite bathroom planned?',
          'Heating solution? (radiators, underfloor)',
          'Electrical requirements? (sockets, lighting, data)',
        ],
      },
      {
        id: 'labour',
        name: 'Trade Labour',
        description: 'Carpenters, roofers, electricians, plumbers',
        isRequired: true,
        typicalPercentage: 20,
        estimationMethod: 'daily_rate',
        refinementQuestions: [
          'Managing trades yourself or main contractor?',
          'Any access challenges?',
          'Timeline constraints?',
        ],
      },
      {
        id: 'waste',
        name: 'Waste & Disposal',
        description: 'Roof materials, debris removal',
        isRequired: true,
        typicalPercentage: 3,
        estimationMethod: 'per_unit',
        refinementQuestions: [
          'How much roof structure is changing?',
          'Access for waste removal?',
          'Any hazardous materials expected?',
        ],
      },
    ],
    estimationApproach: 'detailed',
    typicalDuration: { min: 8, max: 16 },
    complexityFactors: [
      'Planning permission requirements',
      'Building regulations complexity',
      'Structural calculations',
      'Party wall procedures',
      'Access constraints',
      'Existing roof condition',
    ],
    refinementFlow: {
      initialQuestions: [
        "What's the loft space size roughly?",
        'What type of conversion are you considering?',
        'What will the space be used for?',
      ],
      iterativeQuestions: [
        'Which cost area concerns you most?',
        'Any features that are essential vs nice-to-have?',
        'Does the structural allowance seem appropriate?',
      ],
      finalValidation: [
        'How does this compare to your research?',
        'Should we adjust for your specific requirements?',
      ],
    },
  },
};

/**
 * AI Context for Quote Refinement
 */
export interface QuoteRefinementContext {
  projectType: string;
  currentIteration: number;
  maxIterations: number;
  userConcerns: string[];
  adjustmentsMade: Array<{
    category: string;
    change: string;
    reasoning: string;
  }>;
  validatedCategories: string[];
  finalQuote: boolean;
}

/**
 * Quote Refinement Templates
 */
export const REFINEMENT_STRATEGIES = {
  iteration1: {
    approach: 'clarify_uncertainties',
    prompt:
      "I notice you might want to refine the quote. Which area feels most off to you - {category_list}? Or is there something I haven't captured properly?",
    maxAdjustments: 2,
  },
  iteration2: {
    approach: 'validate_priorities',
    prompt:
      "Let me adjust that. Looking at the updated breakdown, does this better match your expectations? Any other categories you'd like to fine-tune?",
    maxAdjustments: 1,
  },
  iteration3: {
    approach: 'final_validation',
    prompt:
      "Here's the refined quote. This should be much closer to your actual project. Does this feel realistic for what you're planning?",
    maxAdjustments: 0,
  },
};

/**
 * Helper function to get project template by user input
 */
export function identifyProjectType(userInput: string): ProjectTemplate | null {
  const input = userInput.toLowerCase();

  for (const template of Object.values(PROJECT_TEMPLATES)) {
    if (template.aliases.some(alias => input.includes(alias))) {
      return template;
    }
  }

  return null;
}

/**
 * Generate contextual refinement questions based on project type and iteration
 */
export function generateRefinementPrompt(
  projectType: string,
  iteration: number,
  userConcern?: string
): string {
  const template = PROJECT_TEMPLATES[projectType];
  if (!template) return '';

  const strategy =
    iteration === 1
      ? REFINEMENT_STRATEGIES.iteration1
      : iteration === 2
        ? REFINEMENT_STRATEGIES.iteration2
        : REFINEMENT_STRATEGIES.iteration3;

  const categoryList = template.costCategories
    .filter(cat => cat.isRequired)
    .map(cat => cat.name.toLowerCase())
    .join(', ');

  return strategy.prompt.replace('{category_list}', categoryList);
}
