import { DEFAULT_QUOTE_VALIDITY_DAYS, DEFAULT_LEGAL_NOTICE } from '../quoteDefaults';

describe('quoteDefaults', () => {
  it('has a numeric validity period of 30 days', () => {
    expect(DEFAULT_QUOTE_VALIDITY_DAYS).toBe(30);
    expect(typeof DEFAULT_QUOTE_VALIDITY_DAYS).toBe('number');
  });

  it('has a non-empty legal notice string', () => {
    expect(typeof DEFAULT_LEGAL_NOTICE).toBe('string');
    expect(DEFAULT_LEGAL_NOTICE.length).toBeGreaterThan(0);
  });

  it('legal notice covers key clauses', () => {
    expect(DEFAULT_LEGAL_NOTICE).toContain('valid for the period stated');
    expect(DEFAULT_LEGAL_NOTICE).toContain('50% deposit');
    expect(DEFAULT_LEGAL_NOTICE).toContain('Variations');
    expect(DEFAULT_LEGAL_NOTICE).toContain('Liability');
  });
});
