import { describe, expect, it } from 'vitest';

import { sanitizeErrorMessage } from './sanitizeErrorMessage';

describe('sanitizeErrorMessage', () => {
  it('should remove UUID patterns in parentheses', () => {
    const input =
      "Not enough stock: Item (6aa93718-59c1-4523-bcfb-6220d6321596) out of stock is out of stock and can't be added to the cart.";
    const expected =
      "Not enough stock: Item out of stock is out of stock and can't be added to the cart.";
    expect(sanitizeErrorMessage(input)).toBe(expected);
  });

  it('should remove multiple UUID patterns', () => {
    const input =
      'Error (6aa93718-59c1-4523-bcfb-6220d6321596) occurred with item (7bb84829-60d2-5634-cdfc-7331e7432607)';
    const expected = 'Error occurred with item';
    expect(sanitizeErrorMessage(input)).toBe(expected);
  });

  it('should handle uppercase UUIDs', () => {
    const input = 'Item (6AA93718-59C1-4523-BCFB-6220D6321596) is invalid';
    const expected = 'Item is invalid';
    expect(sanitizeErrorMessage(input)).toBe(expected);
  });

  it('should preserve normal parenthetical text (short content)', () => {
    const input = 'This is a message (with text) that should remain';
    const expected = 'This is a message (with text) that should remain';
    expect(sanitizeErrorMessage(input)).toBe(expected);
  });

  it('should handle messages without IDs', () => {
    const input = 'This is a normal error message';
    const expected = 'This is a normal error message';
    expect(sanitizeErrorMessage(input)).toBe(expected);
  });

  it('should handle empty strings', () => {
    expect(sanitizeErrorMessage('')).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(sanitizeErrorMessage(null as unknown as string)).toBe(null);
    expect(sanitizeErrorMessage(undefined as unknown as string)).toBe(undefined);
  });

  it('should clean up extra spaces after removal', () => {
    const input = 'Item (6aa93718-59c1-4523-bcfb-6220d6321596)   is   out   of   stock';
    const expected = 'Item is out of stock';
    expect(sanitizeErrorMessage(input)).toBe(expected);
  });
});
