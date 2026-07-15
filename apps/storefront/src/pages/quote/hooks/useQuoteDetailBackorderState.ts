import { useMemo } from 'react';

import { useBackorderStorefrontMessaging } from '@/hooks/useBackorderStorefrontMessaging';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { usePicklistInventory } from '@/hooks/usePicklistInventory';
import { type ProductSearch } from '@/shared/service/b2b/graphql/product';
import { QuoteStatus } from '@/shared/service/b2b/graphql/quote';
import { catalogListHasPicklistBackorderedItemsForDisplay } from '@/utils/catalogBackorderDisplay';

import {
  getQuotePicklistSelections,
  type QuoteBackorderRow,
  quoteDetailListHasBackorderedItemsForDisplay,
} from '../utils/getQuoteBackorderDisplayFields';

type QuoteDetailBackorderRow = QuoteBackorderRow & Parameters<typeof getQuotePicklistSelections>[0];

interface QuoteDetailBackorderState {
  shouldDisplayBackorderInformation: boolean;
  backorderContextEnabled: boolean;
  picklistProductsById: Record<number, ProductSearch>;
  hasBackorderedItems: boolean;
}

export function useQuoteDetailBackorderState(
  productList: QuoteDetailBackorderRow[],
  status: string | number,
): QuoteDetailBackorderState {
  const isOrdered = Number(status) === QuoteStatus.ORDERED;
  const surfaceOrderedQuoteBackorders = useFeatureFlag(
    'BACK-593.surface_order_backorder_info_on_quotes',
  );
  const shouldDisplayBackorderInformation = !isOrdered || surfaceOrderedQuoteBackorders;

  const { isBackorderMessagingContextEnabled, hasAnyBackorderDisplay } =
    useBackorderStorefrontMessaging();
  const backorderContextEnabled =
    isBackorderMessagingContextEnabled &&
    hasAnyBackorderDisplay &&
    shouldDisplayBackorderInformation;

  const picklistProductIds = useMemo(
    () =>
      backorderContextEnabled
        ? productList.flatMap((row) =>
            getQuotePicklistSelections(row).map((selection) => selection.productId),
          )
        : [],
    [productList, backorderContextEnabled],
  );
  const picklistProductsById = usePicklistInventory(picklistProductIds);

  const hasBackorderedItems = useMemo(
    () =>
      quoteDetailListHasBackorderedItemsForDisplay(productList) ||
      catalogListHasPicklistBackorderedItemsForDisplay(
        productList.map((row) => ({
          qty: Number(row.quantity) || 0,
          selections: getQuotePicklistSelections(row),
        })),
        picklistProductsById,
      ),
    [productList, picklistProductsById],
  );

  return {
    shouldDisplayBackorderInformation,
    backorderContextEnabled,
    picklistProductsById,
    hasBackorderedItems,
  };
}
