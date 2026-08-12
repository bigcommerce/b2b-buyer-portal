import type { CatalogQuickVariantSku, ProductSearch } from '@/shared/service/b2b/graphql/product';
import type { Variant } from '@/types/products';
import type { ShoppingListProductItem } from '@/types/shoppingList';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import { getBackorderDisplayFieldsFromOnHand } from '@/utils/backorderDisplayFromInventory';
import { parseAttributeOptionId } from '@/utils/parseAttributeOptionId';

export function buildVariantSkuDependencyKey(skus: readonly (string | undefined | null)[]): string {
  return [...new Set(skus.filter((sku): sku is string => Boolean(sku)))].sort().join('|');
}

export function productRequiresChooseOptionsBeforeAdd(product: { allOptions?: unknown }): boolean {
  return Array.isArray(product.allOptions) && product.allOptions.length > 0;
}

type SearchProductInventorySource = Pick<
  ShoppingListProductItem,
  | 'inventoryTracking'
  | 'availableToSell'
  | 'unlimitedBackorder'
  | 'totalOnHand'
  | 'backorderMessage'
>;

type CatalogInventorySkuSource = Pick<ShoppingListProductItem, 'inventoryTracking' | 'sku'>;

export function getCatalogInventorySku(
  product: CatalogInventorySkuSource | null | undefined,
  variantSku?: string | null,
): string {
  const tracking = product?.inventoryTracking || 'none';
  if (tracking === 'product') {
    return product?.sku ?? '';
  }
  if (tracking === 'variant') {
    return variantSku ?? '';
  }
  return '';
}

export function getCatalogInventoryRowFromSearchProduct(
  product: SearchProductInventorySource,
  variant?: Partial<Variant> | null,
): CatalogQuickVariantSku | undefined {
  const tracking = product.inventoryTracking || 'none';
  if (tracking !== 'product' && tracking !== 'variant') return undefined;

  if (tracking === 'product') {
    return {
      inventoryTracking: tracking,
      availableToSell: product.availableToSell ?? 0,
      unlimitedBackorder: product.unlimitedBackorder ?? false,
      totalOnHand: product.totalOnHand,
      backorderMessage: product.backorderMessage,
    };
  }

  if (!variant) return undefined;

  return {
    inventoryTracking: tracking,
    availableToSell: variant.available_to_sell ?? 0,
    unlimitedBackorder: variant.unlimited_backorder ?? false,
    totalOnHand: variant.total_on_hand,
    backorderMessage: variant.backorder_message,
  };
}

export function quantityExceedsAvailableToSell(
  quantity: number,
  row: CatalogQuickVariantSku | undefined,
): boolean {
  if (!row) return false;
  const tracking = row.inventoryTracking || 'none';
  if (tracking === 'none') return false;
  if (row.unlimitedBackorder) return false;
  const availableToSell = row.availableToSell ?? 0;

  return quantity > availableToSell;
}

export function shouldBlockQuoteAtsAdd(
  quantity: number,
  inventoryRow: CatalogQuickVariantSku | undefined,
): boolean {
  return quantityExceedsAvailableToSell(quantity, inventoryRow);
}

export function getCatalogBackorderDisplayQuantity(
  quantity: number,
  row: CatalogQuickVariantSku | undefined,
): number {
  if (!row) return quantity;
  if (quantity <= 0) return quantity;
  if (!quantityExceedsAvailableToSell(quantity, row)) return quantity;

  return Math.min(quantity, row.availableToSell ?? 0);
}

export function getCatalogBackorderDisplayFields(
  quantity: number,
  row: CatalogQuickVariantSku | undefined,
): BackorderDisplayFields | null {
  if (!row) return null;
  const tracking = row.inventoryTracking || 'none';
  if (tracking !== 'product' && tracking !== 'variant') return null;

  const { totalOnHand } = row;
  if (totalOnHand === null || totalOnHand === undefined) return null;

  return getBackorderDisplayFieldsFromOnHand(
    quantity,
    totalOnHand,
    row.backorderMessage ?? undefined,
  );
}

export function getCatalogBackorderFieldsForVariantSku({
  quantity,
  variantSku,
  inventoryBySku,
}: {
  quantity: number;
  variantSku?: string | null;
  inventoryBySku: Record<string, CatalogQuickVariantSku>;
}): BackorderDisplayFields | null {
  if (!variantSku) return null;

  const catalogVariant = inventoryBySku[variantSku.toUpperCase()];

  return getCatalogBackorderDisplayFields(
    getCatalogBackorderDisplayQuantity(quantity, catalogVariant),
    catalogVariant,
  );
}

interface CatalogProductRowDisplayState {
  qtyHelperText: string;
  backorderFields: BackorderDisplayFields | null;
}

export function getCatalogProductRowDisplayState({
  qty,
  productHelperText,
  showAvailableToSellHelper,
  inventoryRow,
  backorderUiEnabled,
  formatOnlyAvailable,
}: {
  qty: number;
  productHelperText?: string;
  showAvailableToSellHelper: boolean;
  inventoryRow?: CatalogQuickVariantSku;
  backorderUiEnabled: boolean;
  formatOnlyAvailable: (availableToSell: number) => string;
}): CatalogProductRowDisplayState {
  const exceedsAvailableToSell =
    showAvailableToSellHelper &&
    Boolean(inventoryRow) &&
    quantityExceedsAvailableToSell(qty, inventoryRow);

  const availableToSellHelperText = exceedsAvailableToSell
    ? formatOnlyAvailable(inventoryRow?.availableToSell ?? 0)
    : '';

  const qtyHelperText = productHelperText?.trim() ? productHelperText : availableToSellHelperText;

  const backorderFields = backorderUiEnabled
    ? getCatalogBackorderDisplayFields(
        getCatalogBackorderDisplayQuantity(qty, inventoryRow),
        inventoryRow,
      )
    : null;

  return { qtyHelperText, backorderFields };
}

export function catalogListHasBackorderedItemsForDisplay(
  items: Array<{ qty: number; variantSku?: string }>,
  inventoryBySku: Record<string, CatalogQuickVariantSku>,
): boolean {
  return items.some(({ qty, variantSku }) =>
    Boolean(
      getCatalogBackorderFieldsForVariantSku({
        quantity: qty,
        variantSku,
        inventoryBySku,
      }),
    ),
  );
}

export interface PicklistSelection {
  modifierId: number;
  displayName: string;
  productId: number;
}

// Only the modifier fields this resolver reads — keeps the input contract decoupled
// from the full Modifiers type so loosely-typed row sources can be passed directly.
interface PicklistModifier {
  id?: number | string;
  type?: string;
  display_name: string;
  option_values?: Array<{ id: number; value_data?: { product_id?: number } | null }> | null;
}

interface PicklistSelectionSource {
  optionSelections?: Array<{ option_id: number; value_id: number }> | null;
  productsSearch?: { modifiers?: PicklistModifier[] | null } | null;
}

const isPicklistModifier = (modifier: PicklistModifier): boolean =>
  typeof modifier.type === 'string' && modifier.type.includes('product_list');

export function getProductDetailsForPicklistSelections(
  row: PicklistSelectionSource,
): PicklistSelection[] {
  const optionSelections = row.optionSelections ?? [];
  if (optionSelections.length === 0) {
    return [];
  }

  const modifiers = row.productsSearch?.modifiers ?? [];

  return modifiers.flatMap((modifier) => {
    if (!isPicklistModifier(modifier)) {
      return [];
    }

    const selection = optionSelections.find(
      (option) => Number(option.option_id) === Number(modifier.id),
    );
    if (!selection) {
      return [];
    }

    const optionValue = (modifier.option_values ?? []).find(
      (value) => Number(value.id) === Number(selection.value_id),
    );
    const productId = optionValue?.value_data?.product_id;
    if (productId == null) {
      return [];
    }

    return [
      {
        modifierId: Number(modifier.id),
        displayName: modifier.display_name,
        productId,
      },
    ];
  });
}

interface StoredOptionEntry {
  option_id?: number | string;
  optionId?: number | string;
  option_value?: number | string;
  optionValue?: number | string;
}

function toStoredOptionSelection(
  rawId: number | string | undefined,
  rawValue: number | string | undefined,
): { option_id: number; value_id: number } | null {
  if (rawId == null || rawValue == null) {
    return null;
  }

  const optionId = parseAttributeOptionId(rawId);
  const valueId = Number(rawValue);
  if (optionId === null || Number.isNaN(valueId)) {
    return null;
  }

  return { option_id: optionId, value_id: valueId };
}

// Entries come from persisted/API data that callers may hand over unvalidated, so skip anything
// that isn't an object rather than reading properties off it.
function storedOptionEntriesToSelections(
  entries: readonly unknown[],
): Array<{ option_id: number; value_id: number }> {
  return entries.flatMap((item) => {
    if (item === null || typeof item !== 'object') {
      return [];
    }

    const entry = item as StoredOptionEntry;
    const selection = toStoredOptionSelection(
      entry.option_id ?? entry.optionId,
      entry.option_value ?? entry.optionValue,
    );
    return selection ? [selection] : [];
  });
}

function parseStoredOptionList(
  optionList: string | null | undefined,
): Array<{ option_id: number; value_id: number }> {
  if (!optionList) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(optionList);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return storedOptionEntriesToSelections(parsed);
}

export interface StoredPicklistOptionRow {
  optionList?: string | null;
  options?: StoredOptionEntry[] | null;
  productsSearch?: PicklistSelectionSource['productsSearch'];
}

export function getPicklistSelectionsFromStoredOptions(
  row: StoredPicklistOptionRow,
): PicklistSelection[] {
  const optionSelections = row.options?.length
    ? storedOptionEntriesToSelections(row.options)
    : parseStoredOptionList(row.optionList);

  return getProductDetailsForPicklistSelections({
    optionSelections,
    productsSearch: row.productsSearch,
  });
}

export function getCatalogBackorderFieldsForPicklistProduct(
  quantity: number,
  product: ProductSearch | undefined,
): BackorderDisplayFields | null {
  if (!product) {
    return null;
  }

  // A picklist (product_list) modifier references a product, not a variant — value_data
  // carries only product_id, and the row stores no child-variant id. The app resolves a
  // picklist product to variants[0] wherever it's carted/quoted/listed (ProductListDialog,
  // ChooseOptionsDialog, B3ProductList), so matching that here reflects the same variant the
  // item was ordered under.
  const inventoryRow = getCatalogInventoryRowFromSearchProduct(
    product,
    product.variants?.[0] as unknown as Partial<Variant> | undefined,
  );

  return getCatalogBackorderDisplayFields(
    getCatalogBackorderDisplayQuantity(quantity, inventoryRow),
    inventoryRow,
  );
}

export interface PicklistBackorderHistoryChild {
  product_id: number;
  sku?: string | null;
  backorder_message?: string | null;
  quantity_backordered?: number | null;
  total_on_hand?: number | null;
}

export function getPicklistBackorderHistoryFields(
  child: PicklistBackorderHistoryChild | undefined,
): BackorderDisplayFields | null {
  if (!child) {
    return null;
  }
  if ((child.quantity_backordered ?? 0) <= 0) {
    return null;
  }

  return {
    totalOnHand: child.total_on_hand ?? 0,
    quantityBackordered: child.quantity_backordered ?? 0,
    backorderMessage: child.backorder_message ?? undefined,
  };
}

export function catalogListHasPicklistBackorderedItemsForDisplay(
  rows: Array<{ qty: number; selections: PicklistSelection[] }>,
  picklistProductsById: Record<number, ProductSearch>,
): boolean {
  return rows.some(({ qty, selections }) =>
    selections.some((selection) =>
      Boolean(
        getCatalogBackorderFieldsForPicklistProduct(qty, picklistProductsById[selection.productId]),
      ),
    ),
  );
}
