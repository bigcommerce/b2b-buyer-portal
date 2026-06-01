import { describe, expect, it } from 'vitest';

import { detectQuoteStockChange, QuoteStockSnapshotItem } from './detectQuoteStockChange';

const item = (
  productId: number,
  variantId: number,
  quantity: number,
  totalOnHand: number | null,
  inventoryTracking: QuoteStockSnapshotItem['inventoryTracking'] = 'product',
  lineId: number | string = `${productId}:${variantId}`,
): QuoteStockSnapshotItem => ({
  lineId,
  productId,
  variantId,
  quantity,
  totalOnHand,
  inventoryTracking,
});

describe('detectQuoteStockChange', () => {
  it('returns false when after is empty', () => {
    expect(detectQuoteStockChange([item(1, 1, 5, 10)], [])).toBe(false);
  });

  it('returns false when stock state is unchanged', () => {
    expect(detectQuoteStockChange([item(1, 1, 5, 10)], [item(1, 1, 5, 10)])).toBe(false);
  });

  it('returns true when fulfillable quantity differs (stock decreased)', () => {
    expect(detectQuoteStockChange([item(1, 1, 10, 10)], [item(1, 1, 10, 2)])).toBe(true);
  });

  it('returns true when fulfillable quantity differs (stock increased)', () => {
    expect(detectQuoteStockChange([item(1, 1, 10, 2)], [item(1, 1, 10, 50)])).toBe(true);
  });

  it('returns false when stock decreases but remains above cart quantity', () => {
    // qty=5 on both sides; stock 50 → 30, but min(5, 50) === min(5, 30), so fulfillable is unchanged.
    expect(detectQuoteStockChange([item(1, 1, 5, 50)], [item(1, 1, 5, 30)])).toBe(false);
  });

  it('returns true when one of multiple items changed', () => {
    expect(
      detectQuoteStockChange(
        [item(1, 1, 5, 10), item(2, 2, 5, 10)],
        [item(1, 1, 5, 10), item(2, 2, 5, 2)],
      ),
    ).toBe(true);
  });

  it('skips items with inventoryTracking none', () => {
    expect(detectQuoteStockChange([item(1, 1, 5, 0, 'none')], [item(1, 1, 5, 0, 'none')])).toBe(
      false,
    );
  });

  it('skips items when previous snapshot tracking is unknown', () => {
    expect(
      detectQuoteStockChange([item(1, 1, 5, null, 'unknown')], [item(1, 1, 5, 2, 'product')]),
    ).toBe(false);
  });

  it('skips comparison when both sides have null totalOnHand (lookup failed)', () => {
    expect(detectQuoteStockChange([item(1, 1, 5, null)], [item(1, 1, 5, null)])).toBe(false);
  });

  it('skips comparison when previous totalOnHand is null but current is resolved', () => {
    expect(detectQuoteStockChange([item(1, 1, 5, null)], [item(1, 1, 5, 2)])).toBe(false);
  });

  it('skips comparison when current totalOnHand is null but previous is resolved', () => {
    expect(detectQuoteStockChange([item(1, 1, 5, 10)], [item(1, 1, 5, null)])).toBe(false);
  });

  it('compares each line independently when two lines share productId and variantId', () => {
    // Two quote lines, same product+variant but different lineIds (e.g. different modifier selections).
    // If we keyed by productId+variantId, the second line would overwrite the first in the map and
    // one line would be silently skipped.
    expect(
      detectQuoteStockChange(
        [item(1, 1, 5, 10, 'product', 'line-a'), item(1, 1, 5, 10, 'product', 'line-b')],
        [item(1, 1, 5, 10, 'product', 'line-a'), item(1, 1, 5, 2, 'product', 'line-b')],
      ),
    ).toBe(true);
  });

  it('treats negative totalOnHand as zero fulfillable (oversold inventory)', () => {
    // qty=5; before stock=-3, after stock=-5. Both clamp to fulfillable=0, so no detectable change.
    expect(detectQuoteStockChange([item(1, 1, 5, -3)], [item(1, 1, 5, -5)])).toBe(false);
  });

  it('returns true when stock crosses from negative to positive (oversold → restocked)', () => {
    // qty=5; before stock=-2 (fulfillable=0), after stock=3 (fulfillable=3). Differs.
    expect(detectQuoteStockChange([item(1, 1, 5, -2)], [item(1, 1, 5, 3)])).toBe(true);
  });
});
