import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { searchProducts } from '@/shared/service/b2b';
import { Product } from '@/types';
import { QuoteItem } from '@/types/quotes';

import { useDraftQuoteBackorderState } from './useDraftQuoteBackorderState';

vi.mock('@/shared/service/b2b', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b')>()),
  searchProducts: vi.fn(),
}));

const picklistModifier = {
  id: 100,
  type: 'product_list',
  display_name: 'PickleFest',
  option_values: [{ id: 200, value_data: { product_id: 555 } }],
};

const backorderedLine: QuoteItem = {
  node: {
    id: 'line',
    productId: 999,
    quantity: 10,
    variantSku: 'PK',
    productName: 'Pickle Kit',
    basePrice: 24,
    taxPrice: 0,
    optionList: '[]',
    calculatedValue: {},
    productsSearch: {
      inventoryTracking: 'product',
      totalOnHand: 2,
      availableToSell: 100,
      unlimitedBackorder: false,
      backorderMessage: 'Stored kit note',
    } as unknown as Product,
  },
};

const untrackedLineWithPicklist: QuoteItem = {
  node: {
    id: 'line-picklist',
    productId: 999,
    quantity: 5,
    variantSku: 'PK',
    productName: 'Pickle Kit',
    basePrice: 24,
    taxPrice: 0,
    optionList: JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]),
    calculatedValue: {},
    // Stored data says the line is untracked; live inventory below overrides it.
    productsSearch: {
      inventoryTracking: 'none',
      modifiers: [picklistModifier],
    } as unknown as Product,
  },
};

const lineWithoutProductId: QuoteItem = {
  node: {
    id: 'line-no-product-id',
    quantity: 10,
    variantSku: 'PK',
    productName: 'Pickle Kit',
    basePrice: 24,
    taxPrice: 0,
    optionList: '[]',
    calculatedValue: {},
    // No node.productId; the product id lives on the stored snapshot instead.
    productsSearch: {
      id: 777,
      inventoryTracking: 'none',
    } as unknown as Product,
  },
};

const contextEnabled = {
  items: [] as QuoteItem[],
  isBackorderMessagingEnabled: true,
  draftQuoteBackorderContextEnabled: true,
};

const renderState = (input: Parameters<typeof useDraftQuoteBackorderState>[0]) =>
  renderHookWithProviders(
    (props: Parameters<typeof useDraftQuoteBackorderState>[0]) =>
      useDraftQuoteBackorderState(props),
    { initialProps: input },
  );

describe('useDraftQuoteBackorderState', () => {
  beforeEach(() => {
    vi.mocked(searchProducts).mockReset();
    vi.mocked(searchProducts).mockResolvedValue({ productsSearch: [] });
  });

  it('reports no backorders when messaging is disabled', () => {
    const { result } = renderState({
      ...contextEnabled,
      items: [backorderedLine],
      isBackorderMessagingEnabled: false,
    });

    expect(result.result.current.hasBackorderedItems).toBe(false);
  });

  it('does not resolve picklist rows or fetch when the context is disabled', () => {
    const { result } = renderState({
      ...contextEnabled,
      items: [untrackedLineWithPicklist],
      draftQuoteBackorderContextEnabled: false,
    });

    expect(result.result.current.picklistRows).toEqual([]);
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it('flags the line as backordered from stored data before live inventory arrives', () => {
    const { result } = renderState({ ...contextEnabled, items: [backorderedLine] });

    // Live fetch has not resolved yet, so the line falls back to its stored snapshot.
    expect(result.result.current.hasBackorderedItems).toBe(true);
  });

  it('drives line backorder state from live inventory over the stored snapshot', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      productsSearch: [
        {
          id: 999,
          inventoryTracking: 'product',
          totalOnHand: 1,
          availableToSell: 100,
          unlimitedBackorder: false,
          backorderMessage: 'Live kit note',
        },
      ],
    });

    const { result } = renderState({ ...contextEnabled, items: [untrackedLineWithPicklist] });

    await waitFor(() => expect(result.result.current.inventoryById[999]).toBeDefined());
    // Stored inventoryTracking 'none' would yield no line backorder; the live product does.
    expect(result.result.current.hasBackorderedItems).toBe(true);
  });

  it('flags backorders from a picklist child even when the line itself is not backordered', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      productsSearch: [
        {
          id: 555,
          inventoryTracking: 'product',
          totalOnHand: 1,
          availableToSell: 100,
          unlimitedBackorder: false,
          backorderMessage: 'Child ships late',
        },
      ],
    });

    const { result } = renderState({ ...contextEnabled, items: [untrackedLineWithPicklist] });

    await waitFor(() => expect(result.result.current.inventoryById[555]).toBeDefined());
    expect(result.result.current.hasBackorderedItems).toBe(true);
  });

  it('requests both line and picklist-child product ids together', async () => {
    renderState({ ...contextEnabled, items: [untrackedLineWithPicklist] });

    await waitFor(() =>
      expect(searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({ productIds: expect.arrayContaining([999, 555]) }),
      ),
    );
  });

  it('resolves live inventory from the snapshot product id when node.productId is missing', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      productsSearch: [
        {
          id: 777,
          inventoryTracking: 'product',
          totalOnHand: 1,
          availableToSell: 100,
          unlimitedBackorder: false,
          backorderMessage: 'Ships late',
        },
      ],
    });

    const { result } = renderState({ ...contextEnabled, items: [lineWithoutProductId] });

    await waitFor(() =>
      expect(searchProducts).toHaveBeenCalledWith(expect.objectContaining({ productIds: [777] })),
    );
    await waitFor(() => expect(result.result.current.inventoryById[777]).toBeDefined());
    expect(result.result.current.hasBackorderedItems).toBe(true);
  });

  it('exposes resolved picklist selections keyed by row id', () => {
    const { result } = renderState({ ...contextEnabled, items: [untrackedLineWithPicklist] });

    expect(result.result.current.selectionsByRowId['line-picklist']).toEqual([
      { modifierId: 100, displayName: 'PickleFest', productId: 555 },
    ]);
  });
});
