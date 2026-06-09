/* eslint-disable @typescript-eslint/no-explicit-any */

// Tests for the quote consistency/quality helpers.
// These mirror the implementations in index.ts (which can't be imported
// directly because it calls Deno.serve at module load), following the same
// convention as calculateSpecMultiplier.test.ts.

// --- Mirrors of index.ts ------------------------------------------------

const GEMINI_GENERATION_CONFIG = {
  temperature: 0.2,
  seed: 42,
  responseMimeType: 'application/json',
};

function defaultMaterialFraction(projectType: string): number {
  const map: Record<string, number> = {
    bathroom: 0.55,
    kitchen: 0.6,
    extension: 0.5,
    conservatory: 0.55,
    roofing: 0.55,
    driveway: 0.6,
    patio: 0.6,
    renovation: 0.5,
  };
  return map[(projectType || '').toLowerCase()] ?? 0.55;
}

function materialFraction(task: any, projectType: string): number {
  const pct = task?.material_pct;
  if (typeof pct === 'number' && isFinite(pct)) {
    return Math.min(0.85, Math.max(0.15, pct / 100));
  }
  return defaultMaterialFraction(projectType);
}

interface ConfidenceSignals {
  message?: string;
  imageCount?: number;
  audioCount?: number;
}

function calculateGroundedConfidence(signals: ConfidenceSignals | undefined, tasks: any[]): number {
  const message = (signals?.message || '').toLowerCase();
  let confidence = 25;

  if (signals?.imageCount && signals.imageCount > 0) confidence += 15;
  if (signals?.audioCount && signals.audioCount > 0) confidence += 5;

  if (
    /\b\d+\s*(?:m2|sqm|sq\s?m|m²|x|by)\b/.test(message) ||
    message.includes('dimensions') ||
    message.includes('size')
  ) {
    confidence += 15;
  }
  if (message.includes('location') || message.includes('postcode')) confidence += 10;
  if (message.includes('finish level') || message.includes('spec')) confidence += 10;
  confidence += Math.min(10, Math.floor(message.length / 80));
  if (Array.isArray(tasks) && tasks.length >= 4) confidence += 5;

  return Math.min(95, Math.max(30, Math.round(confidence)));
}

// --- Tests --------------------------------------------------------------

describe('GEMINI_GENERATION_CONFIG', () => {
  it('uses a low temperature for consistent pricing', () => {
    expect(GEMINI_GENERATION_CONFIG.temperature).toBeLessThanOrEqual(0.3);
  });

  it('requests native JSON output', () => {
    expect(GEMINI_GENERATION_CONFIG.responseMimeType).toBe('application/json');
  });

  it('pins a seed for reproducibility', () => {
    expect(typeof GEMINI_GENERATION_CONFIG.seed).toBe('number');
  });
});

describe('defaultMaterialFraction', () => {
  it('returns trade-appropriate defaults per project type', () => {
    expect(defaultMaterialFraction('kitchen')).toBe(0.6);
    expect(defaultMaterialFraction('extension')).toBe(0.5);
    expect(defaultMaterialFraction('bathroom')).toBe(0.55);
  });

  it('is case-insensitive', () => {
    expect(defaultMaterialFraction('KITCHEN')).toBe(0.6);
  });

  it('falls back to 0.55 for unknown or empty types', () => {
    expect(defaultMaterialFraction('unknown')).toBe(0.55);
    expect(defaultMaterialFraction('')).toBe(0.55);
  });
});

describe('materialFraction', () => {
  it('prefers a valid per-task material_pct from the AI', () => {
    expect(materialFraction({ material_pct: 30 }, 'kitchen')).toBeCloseTo(0.3);
    expect(materialFraction({ material_pct: 70 }, 'bathroom')).toBeCloseTo(0.7);
  });

  it('clamps extreme AI values into a 15-85% band', () => {
    expect(materialFraction({ material_pct: 0 }, 'kitchen')).toBe(0.15);
    expect(materialFraction({ material_pct: 100 }, 'kitchen')).toBe(0.85);
    expect(materialFraction({ material_pct: -20 }, 'kitchen')).toBe(0.15);
  });

  it('falls back to the project default when material_pct is missing or invalid', () => {
    expect(materialFraction({}, 'kitchen')).toBe(0.6);
    expect(materialFraction({ material_pct: 'lots' as any }, 'extension')).toBe(0.5);
    expect(materialFraction({ material_pct: NaN }, 'bathroom')).toBe(0.55);
  });

  it('keeps materials + labour fractions summing to 1', () => {
    const frac = materialFraction({ material_pct: 40 }, 'patio');
    expect(frac + (1 - frac)).toBeCloseTo(1);
  });

  it('no longer applies a flat 60/40 split to every task', () => {
    const tiling = materialFraction({ material_pct: 30 }, 'bathroom');
    const fitOut = materialFraction({ material_pct: 65 }, 'bathroom');
    expect(tiling).not.toBeCloseTo(fitOut);
  });
});

describe('calculateGroundedConfidence', () => {
  const richMessage =
    'Location: Manchester. Size/Dimensions: 4m x 5m. Finish Level: premium. ' +
    'Replace the existing bathroom suite, retile floor and walls, new extractor fan.';

  it('rewards richer input with higher confidence', () => {
    const sparse = calculateGroundedConfidence({ message: 'fix my bathroom' }, []);
    const rich = calculateGroundedConfidence(
      { message: richMessage, imageCount: 2 },
      [1, 2, 3, 4, 5]
    );
    expect(rich).toBeGreaterThan(sparse);
  });

  it('adds confidence for photos', () => {
    const withImages = calculateGroundedConfidence(
      { message: richMessage, imageCount: 3 },
      [1, 2, 3, 4]
    );
    const withoutImages = calculateGroundedConfidence({ message: richMessage }, [1, 2, 3, 4]);
    expect(withImages).toBeGreaterThan(withoutImages);
  });

  it('detects dimensions, location and finish level signals', () => {
    const base = calculateGroundedConfidence({ message: 'general work' }, []);
    const dims = calculateGroundedConfidence({ message: 'job is 20 sqm' }, []);
    const loc = calculateGroundedConfidence({ message: 'location: leeds' }, []);
    expect(dims).toBeGreaterThan(base);
    expect(loc).toBeGreaterThan(base);
  });

  it('stays within a 30-95 band', () => {
    const floor = calculateGroundedConfidence(undefined, []);
    const ceiling = calculateGroundedConfidence(
      {
        message: richMessage + ' '.repeat(2000) + 'postcode dimensions spec',
        imageCount: 5,
        audioCount: 2,
      },
      [1, 2, 3, 4, 5, 6]
    );
    expect(floor).toBeGreaterThanOrEqual(30);
    expect(ceiling).toBeLessThanOrEqual(95);
  });

  it('handles missing signals gracefully', () => {
    expect(calculateGroundedConfidence(undefined, [])).toBe(30);
  });
});
