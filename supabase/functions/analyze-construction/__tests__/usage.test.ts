/* eslint-disable @typescript-eslint/no-explicit-any */

// Tests for the usage-limiting helpers (T2). The DB-touching functions in
// usage.ts use Deno globals + an https import and can't be loaded under jest, so
// — following the quoteQuality.test.ts convention — we mirror the pure logic
// here: the period key and the allow/deny decision.

const FREE_MONTHLY_LIMIT = 5;

// Mirror of usage.ts currentPeriod()
function currentPeriod(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Mirror of the allow decision in checkQuoteAllowed()
function isAllowed(tier: 'free' | 'pro', used: number): boolean {
  if (tier === 'pro') return true;
  return used < FREE_MONTHLY_LIMIT;
}

describe('currentPeriod', () => {
  it('formats as YYYY-MM in UTC with zero-padded month', () => {
    expect(currentPeriod(new Date('2026-06-10T12:00:00Z'))).toBe('2026-06');
    expect(currentPeriod(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
    expect(currentPeriod(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12');
  });

  it('rolls to the correct month at UTC boundaries', () => {
    // 2026-06-30 23:30 UTC is still June
    expect(currentPeriod(new Date('2026-06-30T23:30:00Z'))).toBe('2026-06');
  });
});

describe('free-tier allow decision', () => {
  it('allows free users below the limit', () => {
    expect(isAllowed('free', 0)).toBe(true);
    expect(isAllowed('free', 4)).toBe(true);
  });

  it('blocks free users at or above the limit', () => {
    expect(isAllowed('free', 5)).toBe(false);
    expect(isAllowed('free', 9)).toBe(false);
  });

  it('always allows pro users', () => {
    expect(isAllowed('pro', 0)).toBe(true);
    expect(isAllowed('pro', 999)).toBe(true);
  });
});
