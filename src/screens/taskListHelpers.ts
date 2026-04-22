/**
 * Pure helper functions extracted from TaskListScreen for testability.
 * No React Native or Expo dependencies.
 */

export interface Task {
  id: string;
  description: string;
  category: string;
  estimatedCost: {
    min: number;
    max: number;
  };
  finalPrice?: number;
  materials?: string[];
  laborDays?: number;
  selected: boolean;
}

/** Detect whether an AI response is a fallback rather than real Gemini data */
export function isFallbackResponse(response: any): boolean {
  return (
    response?._isFallback === true ||
    response?.provider === 'fallback-template' ||
    (response?.confidence != null && response.confidence <= 60)
  );
}

/** Parse AI response tasks array into Task objects (pure function, no side effects) */
export function parseAIResponseToTasks(aiResponse: any): Task[] {
  const tasks: Task[] = [];

  // Check if we have JSON-parsed tasks from Gemini
  if (aiResponse?.tasks && Array.isArray(aiResponse.tasks)) {
    aiResponse.tasks.forEach((task: any, index: number) => {
      const maxCost = task.max_cost || 500;
      tasks.push({
        id: `task-${index}`,
        description: task.description,
        category: task.category || 'General',
        estimatedCost: {
          min: task.min_cost || 100,
          max: maxCost,
        },
        finalPrice: maxCost,
        materials: task.materials || [],
        laborDays: task.labor_days || 1,
        selected: true,
      });
    });
  }
  // Fallback to materials if no tasks
  else if (aiResponse?.costBreakdown?.materials?.items) {
    aiResponse.costBreakdown.materials.items.forEach((item: any, index: number) => {
      const maxCost = Math.round(item.totalPrice * 1.1);
      tasks.push({
        id: `material-${index}`,
        description: item.name,
        category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        estimatedCost: {
          min: Math.round(item.totalPrice * 0.9),
          max: maxCost,
        },
        finalPrice: maxCost,
        materials: [item.name],
        laborDays: 0,
        selected: true,
      });
    });

    if (aiResponse.costBreakdown.labor) {
      const laborMax = aiResponse.costBreakdown.labor.max;
      tasks.push({
        id: 'labor-task',
        description: 'Professional labor and installation',
        category: 'Labor',
        estimatedCost: {
          min: aiResponse.costBreakdown.labor.min,
          max: laborMax,
        },
        finalPrice: laborMax,
        materials: ['Professional installation'],
        laborDays: Math.round(aiResponse.costBreakdown.labor.estimatedHours / 8),
        selected: true,
      });
    }
  }

  return tasks;
}

export function getTaskTemplates(jobType: string) {
  const templates: any = {
    extension: [
      {
        description: 'Planning permission and building regulations',
        category: 'Planning',
        estimatedCost: { min: 1500, max: 3000 },
        materials: ['Planning documents', 'Architectural drawings'],
        laborDays: 0,
      },
      {
        description: 'Foundations and groundwork',
        category: 'Structural',
        estimatedCost: { min: 8000, max: 12000 },
        materials: ['Concrete', 'Steel reinforcement', 'DPM'],
        laborDays: 10,
      },
      {
        description: 'Structural walls and roof',
        category: 'Structural',
        estimatedCost: { min: 15000, max: 20000 },
        materials: ['Blocks', 'Mortar', 'Roof timbers', 'Tiles'],
        laborDays: 20,
      },
      {
        description: 'Windows and doors',
        category: 'Fixtures',
        estimatedCost: { min: 4000, max: 7000 },
        materials: ['UPVC windows', 'Composite doors'],
        laborDays: 3,
      },
      {
        description: 'Electrical and plumbing first fix',
        category: 'Services',
        estimatedCost: { min: 3000, max: 5000 },
        materials: ['Cables', 'Pipes', 'Consumer unit'],
        laborDays: 5,
      },
      {
        description: 'Insulation and plastering',
        category: 'Finishing',
        estimatedCost: { min: 3000, max: 4500 },
        materials: ['Insulation boards', 'Plasterboard', 'Plaster'],
        laborDays: 7,
      },
    ],
    bathroom: [
      {
        description: 'Strip out existing bathroom',
        category: 'Demolition',
        estimatedCost: { min: 300, max: 500 },
        materials: ['Skip hire'],
        laborDays: 1,
      },
      {
        description: 'Plumbing first fix',
        category: 'Services',
        estimatedCost: { min: 800, max: 1200 },
        materials: ['Pipes', 'Fittings'],
        laborDays: 2,
      },
      {
        description: 'Tiling walls and floor',
        category: 'Finishing',
        estimatedCost: { min: 1500, max: 2500 },
        materials: ['Tiles', 'Adhesive', 'Grout'],
        laborDays: 3,
      },
      {
        description: 'Install bathroom suite',
        category: 'Fixtures',
        estimatedCost: { min: 1500, max: 3000 },
        materials: ['Toilet', 'Basin', 'Bath/Shower'],
        laborDays: 2,
      },
      {
        description: 'Electrical work and lighting',
        category: 'Services',
        estimatedCost: { min: 500, max: 800 },
        materials: ['Lights', 'Switches', 'Extractor fan'],
        laborDays: 1,
      },
    ],
    kitchen: [
      {
        description: 'Remove old kitchen',
        category: 'Demolition',
        estimatedCost: { min: 400, max: 600 },
        materials: ['Skip hire'],
        laborDays: 1,
      },
      {
        description: 'Electrical rewiring',
        category: 'Services',
        estimatedCost: { min: 1200, max: 2000 },
        materials: ['Cables', 'Sockets', 'Consumer unit update'],
        laborDays: 2,
      },
      {
        description: 'Plumbing for appliances',
        category: 'Services',
        estimatedCost: { min: 600, max: 1000 },
        materials: ['Pipes', 'Valves'],
        laborDays: 1,
      },
      {
        description: 'Install kitchen units',
        category: 'Fixtures',
        estimatedCost: { min: 3000, max: 8000 },
        materials: ['Base units', 'Wall units', 'Doors'],
        laborDays: 3,
      },
      {
        description: 'Worktops and splashback',
        category: 'Finishing',
        estimatedCost: { min: 1500, max: 3000 },
        materials: ['Worktop', 'Splashback tiles'],
        laborDays: 2,
      },
      {
        description: 'Appliances installation',
        category: 'Fixtures',
        estimatedCost: { min: 2000, max: 5000 },
        materials: ['Oven', 'Hob', 'Dishwasher', 'Fridge'],
        laborDays: 1,
      },
    ],
    patio: [
      {
        description: 'Site clearance and preparation',
        category: 'Groundwork',
        estimatedCost: { min: 300, max: 600 },
        materials: ['Skip hire', 'Weed killer'],
        laborDays: 1,
      },
      {
        description: 'Excavation and sub-base',
        category: 'Groundwork',
        estimatedCost: { min: 800, max: 1500 },
        materials: ['Hardcore', 'MOT Type 1', 'Sand'],
        laborDays: 2,
      },
      {
        description: 'Edging and borders',
        category: 'Structure',
        estimatedCost: { min: 400, max: 800 },
        materials: ['Edging blocks', 'Cement', 'Sand'],
        laborDays: 1,
      },
      {
        description: 'Paving slabs installation',
        category: 'Surface',
        estimatedCost: { min: 2000, max: 4500 },
        materials: ['Paving slabs', 'Mortar', 'Jointing compound'],
        laborDays: 3,
      },
      {
        description: 'Pointing and finishing',
        category: 'Finishing',
        estimatedCost: { min: 300, max: 500 },
        materials: ['Pointing compound', 'Sealant'],
        laborDays: 1,
      },
    ],
    driveway: [
      {
        description: 'Site clearance and excavation',
        category: 'Groundwork',
        estimatedCost: { min: 1000, max: 2000 },
        materials: ['Skip hire', 'Machinery hire'],
        laborDays: 2,
      },
      {
        description: 'Sub-base installation',
        category: 'Groundwork',
        estimatedCost: { min: 1500, max: 3000 },
        materials: ['MOT Type 1', 'Hardcore', 'Compactor hire'],
        laborDays: 2,
      },
      {
        description: 'Edging and kerbs',
        category: 'Structure',
        estimatedCost: { min: 600, max: 1200 },
        materials: ['Kerb stones', 'Edging', 'Cement'],
        laborDays: 1,
      },
      {
        description: 'Block paving / surface',
        category: 'Surface',
        estimatedCost: { min: 3000, max: 6000 },
        materials: ['Block pavers', 'Kiln dried sand', 'Edge restraints'],
        laborDays: 4,
      },
      {
        description: 'Drainage installation',
        category: 'Services',
        estimatedCost: { min: 500, max: 1000 },
        materials: ['Channel drain', 'Soakaway crate', 'Pipes'],
        laborDays: 1,
      },
      {
        description: 'Drop kerb (council application)',
        category: 'Planning',
        estimatedCost: { min: 800, max: 1500 },
        materials: ['Council fees', 'Dropped kerb stones'],
        laborDays: 1,
      },
    ],
    conservatory: [
      {
        description: 'Planning and building regulations',
        category: 'Planning',
        estimatedCost: { min: 500, max: 1500 },
        materials: ['Planning documents', 'Building regs fees'],
        laborDays: 0,
      },
      {
        description: 'Foundations and base',
        category: 'Structural',
        estimatedCost: { min: 3000, max: 5000 },
        materials: ['Concrete', 'DPM', 'Steel reinforcement'],
        laborDays: 5,
      },
      {
        description: 'Dwarf walls construction',
        category: 'Structural',
        estimatedCost: { min: 1500, max: 3000 },
        materials: ['Bricks', 'Blocks', 'Mortar', 'DPC'],
        laborDays: 3,
      },
      {
        description: 'Frame and glazing installation',
        category: 'Structure',
        estimatedCost: { min: 6000, max: 12000 },
        materials: ['UPVC/Aluminium frame', 'Double glazing units'],
        laborDays: 4,
      },
      {
        description: 'Roof system',
        category: 'Structure',
        estimatedCost: { min: 3000, max: 6000 },
        materials: ['Polycarbonate/Glass roof', 'Roof bars', 'Guttering'],
        laborDays: 2,
      },
      {
        description: 'Electrical installation',
        category: 'Services',
        estimatedCost: { min: 800, max: 1500 },
        materials: ['Cables', 'Sockets', 'Lighting'],
        laborDays: 1,
      },
      {
        description: 'Flooring and finishing',
        category: 'Finishing',
        estimatedCost: { min: 1500, max: 3000 },
        materials: ['Floor tiles', 'Underfloor heating', 'Skirting'],
        laborDays: 2,
      },
    ],
    roofing: [
      {
        description: 'Scaffolding',
        category: 'Access',
        estimatedCost: { min: 800, max: 1200 },
        materials: ['Scaffold hire'],
        laborDays: 1,
      },
      {
        description: 'Strip existing roof covering',
        category: 'Demolition',
        estimatedCost: { min: 1000, max: 1500 },
        materials: ['Skip hire'],
        laborDays: 2,
      },
      {
        description: 'Replace battens and felt',
        category: 'Structural',
        estimatedCost: { min: 2000, max: 3000 },
        materials: ['Battens', 'Breathable membrane'],
        laborDays: 3,
      },
      {
        description: 'Install new tiles/slates',
        category: 'Covering',
        estimatedCost: { min: 4000, max: 7000 },
        materials: ['Tiles/Slates', 'Ridge tiles', 'Hip tiles'],
        laborDays: 5,
      },
      {
        description: 'Guttering and fascias',
        category: 'Finishing',
        estimatedCost: { min: 1200, max: 2000 },
        materials: ['UPVC guttering', 'Fascia boards'],
        laborDays: 2,
      },
    ],
    renovation: [
      {
        description: 'Structural assessment',
        category: 'Planning',
        estimatedCost: { min: 500, max: 1000 },
        materials: ['Survey report'],
        laborDays: 0,
      },
      {
        description: 'Demolition and strip out',
        category: 'Demolition',
        estimatedCost: { min: 2000, max: 4000 },
        materials: ['Skip hire', 'Waste removal'],
        laborDays: 5,
      },
      {
        description: 'Structural repairs',
        category: 'Structural',
        estimatedCost: { min: 5000, max: 15000 },
        materials: ['Timber', 'Steel beams', 'Concrete'],
        laborDays: 10,
      },
      {
        description: 'Complete rewiring',
        category: 'Services',
        estimatedCost: { min: 3000, max: 5000 },
        materials: ['Cables', 'Consumer unit', 'Sockets'],
        laborDays: 5,
      },
      {
        description: 'Plumbing and heating',
        category: 'Services',
        estimatedCost: { min: 4000, max: 7000 },
        materials: ['Boiler', 'Radiators', 'Pipes'],
        laborDays: 7,
      },
      {
        description: 'Plastering all walls',
        category: 'Finishing',
        estimatedCost: { min: 3000, max: 5000 },
        materials: ['Plasterboard', 'Plaster', 'Beading'],
        laborDays: 7,
      },
      {
        description: 'Flooring throughout',
        category: 'Finishing',
        estimatedCost: { min: 3000, max: 6000 },
        materials: ['Flooring', 'Underlay', 'Skirting'],
        laborDays: 5,
      },
    ],
    other: [
      {
        description: 'Initial survey and planning',
        category: 'Planning',
        estimatedCost: { min: 300, max: 500 },
        materials: [],
        laborDays: 0,
      },
      {
        description: 'General building work',
        category: 'General',
        estimatedCost: { min: 2000, max: 5000 },
        materials: ['Various materials'],
        laborDays: 5,
      },
      {
        description: 'Finishing and decoration',
        category: 'Finishing',
        estimatedCost: { min: 1000, max: 2000 },
        materials: ['Paint', 'Decorating materials'],
        laborDays: 3,
      },
    ],
  };

  return templates[jobType] || templates.other;
}

export function generateTemplateTasksFromType(jobType: string): Task[] {
  const templates = getTaskTemplates(jobType);
  return templates.map((t: any, i: number) => ({
    ...t,
    id: `task-${i}`,
    finalPrice: t.estimatedCost.max,
    selected: true,
  }));
}
