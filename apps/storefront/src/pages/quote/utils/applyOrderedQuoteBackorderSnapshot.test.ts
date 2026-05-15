import { QuoteStatus } from '@/shared/service/b2b/graphql/quote';

import {
  applyOrderedQuoteBackorderSnapshot,
  type OrderSnapshotProduct,
} from './applyOrderedQuoteBackorderSnapshot';

describe('applyOrderedQuoteBackorderSnapshot', () => {
  const baseLine = {
    productId: 42,
    sku: 'SKU-42',
    quantityBackordered: 99,
    totalOnHand: 99,
    backorderMessage: 'live',
  };

  it('returns items unchanged when status is not ordered', () => {
    const items = [{ ...baseLine }];
    const snapshot = {
      products: [
        {
          productId: 42,
          sku: 'SKU-42',
          totalOnHand: 2,
          quantityBackordered: 3,
          backorderMessage: 'Ships later',
        } satisfies OrderSnapshotProduct,
      ],
    };

    const result = applyOrderedQuoteBackorderSnapshot(items, snapshot, QuoteStatus.OPEN);

    expect(result).toEqual(items);
    expect(result[0]).toBe(items[0]);
  });

  it('clears backorder fields when ordered and backorder snapshot is missing or empty', () => {
    expect(
      applyOrderedQuoteBackorderSnapshot([{ ...baseLine }], null, QuoteStatus.ORDERED)[0],
    ).toEqual({
      ...baseLine,
      totalOnHand: undefined,
      quantityBackordered: undefined,
      backorderMessage: undefined,
    });

    expect(
      applyOrderedQuoteBackorderSnapshot(
        [{ ...baseLine }],
        { products: [] },
        QuoteStatus.ORDERED,
      )[0],
    ).toEqual({
      ...baseLine,
      totalOnHand: undefined,
      quantityBackordered: undefined,
      backorderMessage: undefined,
    });
  });

  it('merges order backorder snapshot onto line items matched by productId and sku', () => {
    const snapshot = {
      products: [
        {
          productId: 42,
          sku: 'SKU-42',
          totalOnHand: 2,
          quantityBackordered: 3,
          backorderMessage: 'Ships later',
        } satisfies OrderSnapshotProduct,
      ],
    };

    const result = applyOrderedQuoteBackorderSnapshot(
      [{ ...baseLine }],
      snapshot,
      QuoteStatus.ORDERED,
    );

    expect(result[0]).toMatchObject({
      productId: 42,
      sku: 'SKU-42',
      totalOnHand: 2,
      quantityBackordered: 3,
      backorderMessage: 'Ships later',
    });
  });

  it('matches order backorder snapshot using variantSku when line item sku is absent', () => {
    const snapshot = {
      products: [
        {
          productId: 10,
          sku: 'VAR-SKU',
          totalOnHand: 1,
          quantityBackordered: 2,
          backorderMessage: 'Soon',
        } satisfies OrderSnapshotProduct,
      ],
    };

    const result = applyOrderedQuoteBackorderSnapshot(
      [
        {
          productId: 10,
          variantSku: 'VAR-SKU',
          quantityBackordered: 0,
        },
      ],
      snapshot,
      QuoteStatus.ORDERED,
    );

    expect(result[0]).toMatchObject({
      quantityBackordered: 2,
      backorderMessage: 'Soon',
    });
  });

  it('merges each line item to the next matching snapshot row when productId and sku repeat', () => {
    const snapshot = {
      products: [
        {
          productId: 1,
          sku: 'S',
          totalOnHand: 1,
          quantityBackordered: 1,
          backorderMessage: 'A',
        },
        {
          productId: 1,
          sku: 'S',
          totalOnHand: 2,
          quantityBackordered: 2,
          backorderMessage: 'B',
        },
      ] satisfies OrderSnapshotProduct[],
    };

    const result = applyOrderedQuoteBackorderSnapshot(
      [
        { productId: 1, sku: 'S' },
        { productId: 1, sku: 'S' },
      ],
      snapshot,
      QuoteStatus.ORDERED,
    );

    expect(result[0]).toMatchObject({ quantityBackordered: 1 });
    expect(result[1]).toMatchObject({ quantityBackordered: 2 });
  });

  it('clears backorder fields on line items with no matching backorder snapshot row', () => {
    const snapshot = {
      products: [
        {
          productId: 1,
          sku: 'A',
          totalOnHand: 1,
          quantityBackordered: 1,
          backorderMessage: 'x',
        } satisfies OrderSnapshotProduct,
      ],
    };

    const result = applyOrderedQuoteBackorderSnapshot(
      [{ productId: 2, sku: 'B', quantityBackordered: 5 }],
      snapshot,
      QuoteStatus.ORDERED,
    );

    expect(result[0]?.quantityBackordered).toBeUndefined();
  });
});
