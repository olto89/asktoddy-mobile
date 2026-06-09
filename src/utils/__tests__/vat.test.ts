import { VAT_RATE, calculateVAT, calculateIncVAT, formatGBP } from '../vat';

describe('VAT utilities', () => {
  describe('VAT_RATE', () => {
    it('should be 20%', () => {
      expect(VAT_RATE).toBe(0.2);
    });
  });

  describe('calculateVAT', () => {
    it('calculates 20% VAT on a round number', () => {
      expect(calculateVAT(1000)).toBe(200);
    });

    it('rounds to the nearest penny', () => {
      // 999.99 * 0.20 = 199.998 → rounds to 200.00
      expect(calculateVAT(999.99)).toBe(200.0);
    });

    it('handles penny precision correctly', () => {
      // 33.33 * 0.20 = 6.666 → rounds to 6.67
      expect(calculateVAT(33.33)).toBe(6.67);
    });

    it('returns 0 for zero input', () => {
      expect(calculateVAT(0)).toBe(0);
    });

    it('handles small amounts', () => {
      // 1.00 * 0.20 = 0.20
      expect(calculateVAT(1)).toBe(0.2);
    });

    it('handles large amounts', () => {
      expect(calculateVAT(50000)).toBe(10000);
    });
  });

  describe('calculateIncVAT', () => {
    it('adds 20% VAT to a round number', () => {
      expect(calculateIncVAT(1000)).toBe(1200);
    });

    it('rounds the total to the nearest penny', () => {
      expect(calculateIncVAT(33.33)).toBe(40.0);
    });

    it('returns 0 for zero input', () => {
      expect(calculateIncVAT(0)).toBe(0);
    });

    it('handles typical quote amounts', () => {
      expect(calculateIncVAT(4500)).toBe(5400);
    });
  });

  describe('formatGBP', () => {
    it('formats a whole number with two decimal places', () => {
      expect(formatGBP(1000)).toBe('1,000.00');
    });

    it('formats a number with pence', () => {
      expect(formatGBP(1234.56)).toBe('1,234.56');
    });

    it('formats zero', () => {
      expect(formatGBP(0)).toBe('0.00');
    });

    it('formats large numbers with thousand separators', () => {
      expect(formatGBP(50000)).toBe('50,000.00');
    });

    it('formats a number with one decimal place to two', () => {
      expect(formatGBP(99.5)).toBe('99.50');
    });
  });
});
