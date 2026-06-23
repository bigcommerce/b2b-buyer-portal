import { useMemo } from 'react';

import { usePicklistInventory } from '@/hooks/usePicklistInventory';
import { type ProductSearch } from '@/shared/service/b2b/graphql/product';
import { QuoteItem } from '@/types/quotes';
import {
  catalogListHasPicklistBackorderedItemsForDisplay,
  type PicklistSelection,
} from '@/utils/catalogBackorderDisplay';

import {
  getDraftBackorderDisplayFields,
  getDraftLineProductId,
  getDraftQuotePicklistSelections,
} from '../utils/getQuoteBackorderDisplayFields';

interface PicklistRow {
  id: string;
  qty: number;
  selections: PicklistSelection[];
}

interface DraftQuoteBackorderState {
  hasBackorderedItems: boolean;
  inventoryById: Record<number, ProductSearch>;
  picklistRows: PicklistRow[];
  selectionsByRowId: Record<string, PicklistSelection[]>;
}

interface DraftQuoteBackorderInput {
  items: QuoteItem[];
  isBackorderMessagingEnabled: boolean;
  draftQuoteBackorderContextEnabled: boolean;
}

// Single source of truth for the draft quote's backorder state, shared by the table and the
// summary so they can never disagree about whether an item is backordered.
export function useDraftQuoteBackorderState({
  items,
  isBackorderMessagingEnabled,
  draftQuoteBackorderContextEnabled,
}: DraftQuoteBackorderInput): DraftQuoteBackorderState {
  const { picklistRows, selectionsByRowId } = useMemo(() => {
    const rows = draftQuoteBackorderContextEnabled
      ? items.map((item) => ({
          id: String(item.node.id),
          qty: Number(item.node.quantity) || 0,
          selections: getDraftQuotePicklistSelections(item.node),
        }))
      : [];

    return {
      picklistRows: rows,
      selectionsByRowId: Object.fromEntries(rows.map((row) => [row.id, row.selections])),
    };
  }, [items, draftQuoteBackorderContextEnabled]);

  // Fetch line products and picklist children together so both reflect live inventory.
  const inventoryProductIds = useMemo(() => {
    if (!draftQuoteBackorderContextEnabled) {
      return [];
    }
    const lineIds = items.flatMap((item) => {
      const productId = getDraftLineProductId(item.node);
      return productId > 0 ? [productId] : [];
    });
    const childIds = picklistRows.flatMap((row) =>
      row.selections.map((selection) => selection.productId),
    );
    return [...new Set([...lineIds, ...childIds])];
  }, [items, picklistRows, draftQuoteBackorderContextEnabled]);

  const inventoryById = usePicklistInventory(inventoryProductIds);

  const hasBackorderedItems = useMemo(() => {
    if (!isBackorderMessagingEnabled) {
      return false;
    }

    const lineBackordered = items.some((item) =>
      Boolean(
        getDraftBackorderDisplayFields(item.node, inventoryById[getDraftLineProductId(item.node)]),
      ),
    );

    return (
      lineBackordered ||
      catalogListHasPicklistBackorderedItemsForDisplay(picklistRows, inventoryById)
    );
  }, [items, isBackorderMessagingEnabled, picklistRows, inventoryById]);

  return { hasBackorderedItems, inventoryById, picklistRows, selectionsByRowId };
}
