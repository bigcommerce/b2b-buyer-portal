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
  quoteDetailListHasPicklistBackorderHistory,
} from '../utils/getQuoteBackorderDisplayFields';

type QuoteDetailBackorderRow = QuoteBackorderRow & Parameters<typeof getQuotePicklistSelections>[0];

interface QuoteDetailBackorderState {
  isOrdered: boolean;
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

  // Ordered quotes read picklist-child backorders from the frozen history on each row, so they
  // never fetch live inventory; only submitted quotes resolve children against current stock.
  const picklistProductIds = useMemo(
    () =>
      backorderContextEnabled && !isOrdered
        ? productList.flatMap((row) =>
            getQuotePicklistSelections(row).map((selection) => selection.productId),
          )
        : [],
    [productList, backorderContextEnabled, isOrdered],
  );
  const picklistProductsById = usePicklistInventory(picklistProductIds);

  const hasBackorderedItems = useMemo(
    () =>
      quoteDetailListHasBackorderedItemsForDisplay(productList) ||
      (isOrdered
        ? quoteDetailListHasPicklistBackorderHistory(productList)
        : catalogListHasPicklistBackorderedItemsForDisplay(
            productList.map((row) => ({
              qty: Number(row.quantity) || 0,
              selections: getQuotePicklistSelections(row),
            })),
            picklistProductsById,
          )),
    [productList, picklistProductsById, isOrdered],
  );

  return {
    isOrdered,
    shouldDisplayBackorderInformation,
    backorderContextEnabled,
    picklistProductsById,
    hasBackorderedItems,
  };
}
