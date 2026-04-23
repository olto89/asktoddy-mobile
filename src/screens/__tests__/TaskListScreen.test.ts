/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  parseAIResponseToTasks,
  getTaskTemplates,
  generateTemplateTasksFromType,
  isFallbackResponse,
} from '../taskListHelpers';

describe('parseAIResponseToTasks', () => {
  it('converts valid tasks array into correct Task objects', () => {
    const aiResponse = {
      tasks: [
        {
          description: 'Install bathroom suite',
          category: 'Fixtures',
          min_cost: 1500,
          max_cost: 3000,
          materials: ['Toilet', 'Basin'],
          labor_days: 2,
        },
        {
          description: 'Tiling',
          category: 'Finishing',
          min_cost: 800,
          max_cost: 1500,
          materials: ['Tiles'],
          labor_days: 3,
        },
      ],
    };

    const tasks = parseAIResponseToTasks(aiResponse);

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toEqual({
      id: 'task-0',
      description: 'Install bathroom suite',
      category: 'Fixtures',
      estimatedCost: { min: 1500, max: 3000 },
      finalPrice: 3000,
      materials: ['Toilet', 'Basin'],
      laborDays: 2,
      selected: true,
    });
    expect(tasks[1].id).toBe('task-1');
    expect(tasks[1].description).toBe('Tiling');
  });

  it('falls back to material items when no tasks array is present', () => {
    const aiResponse = {
      costBreakdown: {
        materials: {
          min: 1000,
          max: 2000,
          items: [
            { name: 'Concrete', totalPrice: 500, category: 'structural' },
            { name: 'Tiles', totalPrice: 300, category: 'finishing' },
          ],
        },
        labor: {
          min: 800,
          max: 1200,
          hourlyRate: 25,
          estimatedHours: 40,
        },
        total: { min: 1800, max: 3200 },
      },
    };

    const tasks = parseAIResponseToTasks(aiResponse);

    // Should have 2 material tasks + 1 labor task
    expect(tasks).toHaveLength(3);
    expect(tasks[0].description).toBe('Concrete');
    expect(tasks[0].category).toBe('Structural');
    expect(tasks[1].description).toBe('Tiles');
    expect(tasks[2].id).toBe('labor-task');
    expect(tasks[2].description).toBe('Professional labor and installation');
    expect(tasks[2].laborDays).toBe(5); // 40 hours / 8
  });

  it('returns empty array when no structured data is present', () => {
    const aiResponse = { description: 'Some text response without tasks or costBreakdown' };

    const tasks = parseAIResponseToTasks(aiResponse);

    expect(tasks).toEqual([]);
  });
});

describe('getTaskTemplates', () => {
  const jobTypes = [
    'extension',
    'bathroom',
    'kitchen',
    'patio',
    'driveway',
    'conservatory',
    'roofing',
    'renovation',
    'other',
  ];

  it.each(jobTypes)('returns non-empty templates for %s', jobType => {
    const templates = getTaskTemplates(jobType);

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);

    // Each template should have required fields
    templates.forEach((t: any) => {
      expect(t).toHaveProperty('description');
      expect(t).toHaveProperty('category');
      expect(t).toHaveProperty('estimatedCost');
      expect(t.estimatedCost).toHaveProperty('min');
      expect(t.estimatedCost).toHaveProperty('max');
      expect(t.estimatedCost.min).toBeLessThanOrEqual(t.estimatedCost.max);
    });
  });

  it('falls back to "other" templates for unknown job types', () => {
    const templates = getTaskTemplates('spaceship');
    const otherTemplates = getTaskTemplates('other');

    expect(templates).toEqual(otherTemplates);
  });
});

describe('generateTemplateTasksFromType', () => {
  it('returns tasks with correct shape (id, finalPrice, selected)', () => {
    const tasks = generateTemplateTasksFromType('bathroom');

    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach((task, index) => {
      expect(task.id).toBe(`task-${index}`);
      expect(task.finalPrice).toBe(task.estimatedCost.max);
      expect(task.selected).toBe(true);
      expect(task.description).toBeDefined();
      expect(task.category).toBeDefined();
    });
  });
});

describe('isFallbackResponse', () => {
  it('detects fallback when provider is fallback-template', () => {
    const response = {
      provider: 'fallback-template',
      confidence: 60,
      costBreakdown: { total: { min: 1800, max: 4200 } },
    };

    expect(isFallbackResponse(response)).toBe(true);
  });

  it('detects fallback when _isFallback flag is set', () => {
    const response = {
      _isFallback: true,
      provider: 'fallback-template',
      confidence: 60,
    };

    expect(isFallbackResponse(response)).toBe(true);
  });

  it('detects fallback when confidence is 60 or below', () => {
    expect(isFallbackResponse({ confidence: 60 })).toBe(true);
    expect(isFallbackResponse({ confidence: 50 })).toBe(true);
    expect(isFallbackResponse({ confidence: 0 })).toBe(true);
  });

  it('returns false for successful gemini-json response', () => {
    const response = {
      provider: 'gemini-json',
      confidence: 85,
      tasks: [{ description: 'Real task', min_cost: 500, max_cost: 1000 }],
    };

    expect(isFallbackResponse(response)).toBe(false);
  });

  it('returns false when confidence is above 60', () => {
    expect(isFallbackResponse({ confidence: 61 })).toBe(false);
    expect(isFallbackResponse({ confidence: 85 })).toBe(false);
    expect(isFallbackResponse({ confidence: 100 })).toBe(false);
  });

  it('returns false for null/undefined input', () => {
    expect(isFallbackResponse(null)).toBe(false);
    expect(isFallbackResponse(undefined)).toBe(false);
  });
});
