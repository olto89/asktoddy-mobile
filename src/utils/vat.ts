/**
 * UK VAT calculation utilities.
 * All stored prices are ex-VAT; VAT is calculated at display time only.
 */

export const VAT_RATE = 0.2;

/** Calculate VAT amount with penny rounding */
export function calculateVAT(amount: number): number {
  return Math.round(amount * VAT_RATE * 100) / 100;
}

/** Calculate amount including VAT */
export function calculateIncVAT(amount: number): number {
  return Math.round((amount + calculateVAT(amount)) * 100) / 100;
}

/** Format a number as GBP with 2 decimal places */
export function formatGBP(amount: number): string {
  return amount.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
