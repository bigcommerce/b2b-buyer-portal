import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import * as b2bService from '@/shared/service/b2b';
import { QuoteStatus } from '@/shared/service/b2b/graphql/quote';

import { useQuoteDetailBackorderState } from './useQuoteDetailBackorderState';

const messaging = {
  isBackorderMessagingContextEnabled: true,
  hasAnyBackorderDisplay: true,
};

vi.mock('@/hooks/useBackorderStorefrontMessaging', () => ({
  useBackorderStorefrontMessaging: () => messaging,
}));

vi.mock('@/hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => false,
}));

const picklistModifier = {
  id: 100,
  type: 'product_list',
  display_name: 'PickleFest',
  option_values: [{ id: 200, value_data: { product_id: 555 } }],
};

const backorderedLine = {
  quantity: 10,
  optionList: '[]',
  productsSearch: {
    inventoryTracking: 'product',
    totalOnHand: 2,
    availableToSell: 100,
    unlimitedBackorder: false,
    backorderMessage: 'Ships late',
  },
} as never;

// The line itself is untracked (never backordered), so any backorder must come from the picklist child.
const lineWithBackorderedPicklistChild = {
  quantity: 5,
  optionList: JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]),
  productsSearch: {
    inventoryTracking: 'none',
    modifiers: [picklistModifier],
  },
} as never;

const renderState = (...args: Parameters<typeof useQuoteDetailBackorderState>) =>
  renderHookWithProviders(
    (props: { productList: (typeof args)[0]; status: (typeof args)[1] }) =>
      useQuoteDetailBackorderState(props.productList, props.status),
    { initialProps: { productList: args[0], status: args[1] } },
  );

describe('useQuoteDetailBackorderState', () => {
  beforeEach(() => {
    vi.spyOn(b2bService, 'searchProducts').mockResolvedValue({ productsSearch: [] });
    messaging.isBackorderMessagingContextEnabled = true;
    messaging.hasAnyBackorderDisplay = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flags the line as backordered from its stored snapshot', () => {
    const { result } = renderState([backorderedLine], 1);

    expect(result.result.current.hasBackorderedItems).toBe(true);
  });

  it('flags backorders from a picklist child even when the line itself is not backordered', async () => {
    vi.spyOn(b2bService, 'searchProducts').mockResolvedValue({
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

    const { result } = renderState([lineWithBackorderedPicklistChild], 1);

    await waitFor(() => expect(result.result.current.picklistProductsById[555]).toBeDefined());
    expect(result.result.current.hasBackorderedItems).toBe(true);
  });

  it('does not flag backorders or fetch inventory when the messaging context is disabled', () => {
    messaging.isBackorderMessagingContextEnabled = false;

    const { result } = renderState([lineWithBackorderedPicklistChild], 1);

    expect(result.result.current.backorderContextEnabled).toBe(false);
    expect(result.result.current.hasBackorderedItems).toBe(false);
    expect(b2bService.searchProducts).not.toHaveBeenCalled();
  });

  it('flags backorders from the picklist snapshot on an ordered quote without fetching live inventory', () => {
    const orderedRowWithSnapshotChild = {
      quantity: 5,
      optionList: JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]),
      productsSearch: { inventoryTracking: 'none', modifiers: [picklistModifier] },
      picklistBackorder: [
        {
          product_id: 555,
          quantity_backordered: 3,
          total_on_hand: 1,
          backorder_message: 'Ships later',
        },
      ],
    } as never;

    const { result } = renderState([orderedRowWithSnapshotChild], QuoteStatus.ORDERED);

    expect(result.result.current.isOrdered).toBe(true);
    expect(result.result.current.hasBackorderedItems).toBe(true);
    expect(b2bService.searchProducts).not.toHaveBeenCalled();
  });
});
