/* eslint-disable @typescript-eslint/no-explicit-any */

// Extract and test calculateSpecMultiplier logic independently
// (mirrors the implementation in index.ts)

function calculateSpecMultiplier(
  notes: string,
  explicitSpecLevel?: string
): { multiplier: number; level: string } {
  if (explicitSpecLevel) {
    const specMap: Record<string, { multiplier: number; level: string }> = {
      budget: { multiplier: 0.75, level: 'budget' },
      standard: { multiplier: 1.0, level: 'standard' },
      premium: { multiplier: 1.35, level: 'premium' },
      luxury: { multiplier: 1.6, level: 'luxury' },
    };
    const match = specMap[explicitSpecLevel.toLowerCase()];
    if (match) return match;
  }

  if (!notes || typeof notes !== 'string') {
    return { multiplier: 1.0, level: 'standard' };
  }

  const text = notes.toLowerCase();

  if (
    text.includes('high spec') ||
    text.includes('luxury') ||
    text.includes('premium') ||
    text.includes('bespoke')
  ) {
    return { multiplier: 1.5, level: 'high-spec' };
  }

  if (text.includes('good quality') || text.includes('quality finish') || text.includes('modern')) {
    return { multiplier: 1.25, level: 'mid-high' };
  }

  if (
    text.includes('budget') ||
    text.includes('basic') ||
    text.includes('cheap') ||
    text.includes('economy')
  ) {
    return { multiplier: 0.75, level: 'budget' };
  }

  return { multiplier: 1.0, level: 'standard' };
}

describe('calculateSpecMultiplier', () => {
  it('uses explicit spec level when provided', () => {
    expect(calculateSpecMultiplier('some notes', 'budget')).toEqual({
      multiplier: 0.75,
      level: 'budget',
    });
    expect(calculateSpecMultiplier('some notes', 'premium')).toEqual({
      multiplier: 1.35,
      level: 'premium',
    });
    expect(calculateSpecMultiplier('some notes', 'luxury')).toEqual({
      multiplier: 1.6,
      level: 'luxury',
    });
    expect(calculateSpecMultiplier('some notes', 'standard')).toEqual({
      multiplier: 1.0,
      level: 'standard',
    });
  });

  it('explicit spec level overrides keyword detection in notes', () => {
    // Notes say "budget" but explicit level is "luxury"
    expect(calculateSpecMultiplier('I want a budget finish', 'luxury')).toEqual({
      multiplier: 1.6,
      level: 'luxury',
    });
  });

  it('falls back to keyword detection when no explicit level', () => {
    expect(calculateSpecMultiplier('I want luxury marble tiles')).toEqual({
      multiplier: 1.5,
      level: 'high-spec',
    });
    expect(calculateSpecMultiplier('budget basic tiles')).toEqual({
      multiplier: 0.75,
      level: 'budget',
    });
    expect(calculateSpecMultiplier('good quality modern finish')).toEqual({
      multiplier: 1.25,
      level: 'mid-high',
    });
  });

  it('defaults to standard when no keywords and no explicit level', () => {
    expect(calculateSpecMultiplier('just a normal bathroom')).toEqual({
      multiplier: 1.0,
      level: 'standard',
    });
  });

  it('handles null/empty notes gracefully', () => {
    expect(calculateSpecMultiplier('')).toEqual({ multiplier: 1.0, level: 'standard' });
    expect(calculateSpecMultiplier(null as any)).toEqual({ multiplier: 1.0, level: 'standard' });
  });
});
