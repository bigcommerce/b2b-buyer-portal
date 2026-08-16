import { describe, expect, it } from 'vitest';

import { getProductListColumnAlignments } from './getProductListColumnAlignments';

describe('getProductListColumnAlignments', () => {
  it('left-aligns qty and right-aligns price/total on desktop', () => {
    expect(getProductListColumnAlignments(false)).toEqual({
      qtyTextAlign: 'left',
      numericTextAlign: 'right',
      qtyStackItemsAlignment: 'flex-start',
      numericStackItemsAlignment: 'flex-end',
    });
  });

  it('left-aligns qty and price/total on mobile', () => {
    expect(getProductListColumnAlignments(true)).toEqual({
      qtyTextAlign: 'left',
      numericTextAlign: 'left',
      qtyStackItemsAlignment: 'flex-start',
      numericStackItemsAlignment: 'flex-start',
    });
  });
});
