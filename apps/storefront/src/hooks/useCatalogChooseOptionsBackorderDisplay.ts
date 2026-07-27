import { useCallback, useMemo } from 'react';

import { useBackorderStorefrontMessaging } from '@/hooks/useBackorderStorefrontMessaging';
import { useB3Lang } from '@/lib/lang';
import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import type { ShoppingListProductItem, Variant } from '@/types';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import {
  getCatalogBackorderDisplayFields,
  getCatalogBackorderDisplayQuantity,
  getCatalogInventoryRowFromSearchProduct,
  getCatalogProductRowDisplayState,
  shouldBlockQuoteAtsAdd,
} from '@/utils/catalogBackorderDisplay';

interface UseCatalogChooseOptionsBackorderDisplayOptions {
  product?: ShoppingListProductItem;
  variantInfo?: Partial<Variant> | null;
  quantity: number | string;
  showAvailableToSellHelper?: boolean;
  formatOnlyAvailable?: (count: number) => string;
  inventoryBySku?: Record<string, CatalogQuickVariantSku>;
  inventorySku?: string | null;
}

interface CatalogChooseOptionsBackorderDisplay {
  backorderUiEnabled: boolean;
  qtyHelperText: string;
  backorderFields: BackorderDisplayFields | null;
  exceedsAvailableToSell: boolean;
}

export function useCatalogChooseOptionsBackorderDisplay({
  product,
  variantInfo,
  quantity,
  showAvailableToSellHelper = true,
  formatOnlyAvailable: formatOnlyAvailableOverride,
  inventoryBySku,
  inventorySku,
}: UseCatalogChooseOptionsBackorderDisplayOptions): CatalogChooseOptionsBackorderDisplay {
  const b3Lang = useB3Lang();
  const { isBackorderMessagingContextEnabled, hasAnyBackorderDisplay } =
    useBackorderStorefrontMessaging();
  const backorderUiEnabled = isBackorderMessagingContextEnabled && hasAnyBackorderDisplay;

  const defaultFormatOnlyAvailable = useCallback(
    (count: number) =>
      b3Lang('purchasedProducts.quickAdd.inlineErrors.insufficientStockSku', { count }),
    [b3Lang],
  );

  const formatOnlyAvailable = formatOnlyAvailableOverride ?? defaultFormatOnlyAvailable;

  const searchInventoryRow = useMemo(
    () => (product ? getCatalogInventoryRowFromSearchProduct(product, variantInfo) : undefined),
    [product, variantInfo],
  );

  const apiInventoryRow = useMemo(() => {
    if (!inventoryBySku || !inventorySku) {
      return undefined;
    }

    return inventoryBySku[inventorySku.toUpperCase()];
  }, [inventoryBySku, inventorySku]);

  const qty = Number(quantity) || 0;
  const showHelper = showAvailableToSellHelper && backorderUiEnabled;
  const useApiInventoryForAts = Boolean(inventoryBySku);

  return useMemo(() => {
    const atsInventoryRow = useApiInventoryForAts ? apiInventoryRow : searchInventoryRow;
    const backorderInventoryRow = apiInventoryRow ?? searchInventoryRow;

    const { qtyHelperText } = getCatalogProductRowDisplayState({
      qty,
      showAvailableToSellHelper: showHelper,
      inventoryRow: atsInventoryRow,
      backorderUiEnabled,
      formatOnlyAvailable,
    });

    const backorderFields = backorderUiEnabled
      ? getCatalogBackorderDisplayFields(
          getCatalogBackorderDisplayQuantity(qty, backorderInventoryRow),
          backorderInventoryRow,
        )
      : null;

    return {
      backorderUiEnabled,
      qtyHelperText,
      backorderFields,
      exceedsAvailableToSell: showHelper && shouldBlockQuoteAtsAdd(qty, atsInventoryRow),
    };
  }, [
    qty,
    showHelper,
    useApiInventoryForAts,
    apiInventoryRow,
    searchInventoryRow,
    backorderUiEnabled,
    formatOnlyAvailable,
  ]);
}
