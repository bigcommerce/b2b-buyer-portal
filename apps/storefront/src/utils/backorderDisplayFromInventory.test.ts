import { describe, expect, it } from 'vitest';

import { getBackorderDisplayFieldsFromOnHand } from './backorderDisplayFromInventory';

describe('getBackorderDisplayFieldsFromOnHand', () => {
  it('returns null when ordered quantity is within on hand', () => {
    expect(getBackorderDisplayFieldsFromOnHand(3, 10)).toBeNull();
  });

  it('returns quantity backordered and optional message when qty exceeds on hand', () => {
    expect(getBackorderDisplayFieldsFromOnHand(10, 3, 'Soon')).toEqual({
      totalOnHand: 3,
      quantityBackordered: 7,
      backorderMessage: 'Soon',
    });
  });

  it('treats negative total on hand as fully backordered', () => {
    expect(getBackorderDisplayFieldsFromOnHand(10, -1)).toEqual({
      totalOnHand: -1,
      quantityBackordered: 11,
      backorderMessage: undefined,
    });
  });
});
