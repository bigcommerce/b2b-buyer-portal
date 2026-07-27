import { describe, expect, it } from 'vitest';

import { parseAttributeOptionId } from './parseAttributeOptionId';

describe('parseAttributeOptionId', () => {
  it('extracts the numeric id from an attribute-keyed option id', () => {
    expect(parseAttributeOptionId('attribute[123]')).toBe(123);
  });

  it('returns a numeric id unchanged', () => {
    expect(parseAttributeOptionId(456)).toBe(456);
  });

  it('parses a bare numeric string', () => {
    expect(parseAttributeOptionId('789')).toBe(789);
  });

  it('returns the first digit run for a compound attribute key', () => {
    expect(parseAttributeOptionId('attribute[12][month]')).toBe(12);
  });

  it('returns null when the id has no digits', () => {
    expect(parseAttributeOptionId('none')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseAttributeOptionId('')).toBeNull();
  });
});
