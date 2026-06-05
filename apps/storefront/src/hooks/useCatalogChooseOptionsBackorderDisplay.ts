import { useCallback, useMemo } from 'react';

import { useBackorderStorefrontMessaging } from '@/hooks/useBackorderStorefrontMessaging';
import { useB3Lang } from '@/lib/lang';
import type { ShoppingListProductItem, Variant } from '@/types';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import {
  getCatalogInventoryRowFromSearchProduct,
  getCatalogProductRowDisplayState,
} from '@/utils/catalogBackorderDisplay';

interface UseCatalogChooseOptionsBackorderDisplayOptions {
  product?: ShoppingListProductItem;
  variantInfo?: Partial<Variant> | null;
  quantity: number | string;
  showAvailableToSellHelper?: boolean;
}

interface CatalogChooseOptionsBackorderDisplay {
  backorderUiEnabled: boolean;
  qtyHelperText: string;
  backorderFields: BackorderDisplayFields | null;
}

export function useCatalogChooseOptionsBackorderDisplay({
  product,
  variantInfo,
  quantity,
  showAvailableToSellHelper = true,
}: UseCatalogChooseOptionsBackorderDisplayOptions): CatalogChooseOptionsBackorderDisplay {
  const b3Lang = useB3Lang();
  const { isBackorderMessagingContextEnabled, hasAnyBackorderDisplay } =
    useBackorderStorefrontMessaging();
  const backorderUiEnabled = isBackorderMessagingContextEnabled && hasAnyBackorderDisplay;

  const formatOnlyAvailable = useCallback(
    (count: number) =>
      b3Lang('purchasedProducts.quickAdd.inlineErrors.insufficientStockSku', { count }),
    [b3Lang],
  );

  const inventoryRow = useMemo(
    () => (product ? getCatalogInventoryRowFromSearchProduct(product, variantInfo) : undefined),
    [product, variantInfo],
  );

  return useMemo(
    () => ({
      backorderUiEnabled,
      ...getCatalogProductRowDisplayState({
        qty: Number(quantity) || 0,
        showAvailableToSellHelper: showAvailableToSellHelper && backorderUiEnabled,
        inventoryRow,
        backorderUiEnabled,
        formatOnlyAvailable,
      }),
    }),
    [quantity, inventoryRow, backorderUiEnabled, formatOnlyAvailable, showAvailableToSellHelper],
  );
}
