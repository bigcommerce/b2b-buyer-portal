import { useMemo } from 'react';

import { useBackorderStorefrontMessaging } from '@/hooks/useBackorderStorefrontMessaging';
import { usePicklistInventory } from '@/hooks/usePicklistInventory';
import { type ProductSearch } from '@/shared/service/b2b/graphql/product';
import { QuoteStatus } from '@/shared/service/b2b/graphql/quote';
import {
  catalogListHasPicklistBackorderedItemsForDisplay,
  getPicklistSelectionsFromStoredOptions,
  type StoredPicklistOptionRow,
} from '@/utils/catalogBackorderDisplay';

import {
  type QuoteBackorderRow,
  quoteDetailListHasBackorderedItemsForDisplay,
  quoteDetailListHasPicklistBackorderHistory,
} from '../utils/getQuoteBackorderDisplayFields';

type QuoteDetailBackorderRow = QuoteBackorderRow & StoredPicklistOptionRow;

interface QuoteDetailBackorderState {
  isOrdered: boolean;
  backorderContextEnabled: boolean;
  picklistProductsById: Record<number, ProductSearch>;
  hasBackorderedItems: boolean;
}

export function useQuoteDetailBackorderState(
  productList: QuoteDetailBackorderRow[],
  status: string | number,
): QuoteDetailBackorderState {
  const isOrdered = Number(status) === QuoteStatus.ORDERED;

  const { isBackorderMessagingContextEnabled, hasAnyBackorderDisplay } =
    useBackorderStorefrontMessaging();
  const backorderContextEnabled = isBackorderMessagingContextEnabled && hasAnyBackorderDisplay;

  // Ordered quotes read picklist-child backorders from the frozen history on each row, so they
  // never fetch live inventory; only submitted quotes resolve children against current stock.
  const picklistProductIds = useMemo(
    () =>
      backorderContextEnabled && !isOrdered
        ? productList.flatMap((row) =>
            getPicklistSelectionsFromStoredOptions(row).map((selection) => selection.productId),
          )
        : [],
    [productList, backorderContextEnabled, isOrdered],
  );
  const picklistProductsById = usePicklistInventory(picklistProductIds);

  const hasBackorderedItems = useMemo(
    () =>
      quoteDetailListHasBackorderedItemsForDisplay(productList, {
        useOrderSnapshot: isOrdered,
      }) ||
      (isOrdered
        ? quoteDetailListHasPicklistBackorderHistory(productList)
        : catalogListHasPicklistBackorderedItemsForDisplay(
            productList.map((row) => ({
              qty: Number(row.quantity) || 0,
              selections: getPicklistSelectionsFromStoredOptions(row),
            })),
            picklistProductsById,
          )),
    [productList, picklistProductsById, isOrdered],
  );

  return {
    isOrdered,
    backorderContextEnabled,
    picklistProductsById,
    hasBackorderedItems,
  };
}
