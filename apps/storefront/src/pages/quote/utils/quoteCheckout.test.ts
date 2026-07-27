import type { Location } from 'react-router-dom';
import { graphql, HttpResponse, startMockServer } from 'tests/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LangFormatFunction } from '@/lib/lang';
import type { ProductValidationError } from '@/shared/service/request/b3Fetch';

import { QuoteStockSnapshotItem } from './detectQuoteStockChange';
import { handleQuoteCheckout, QUOTE_BACKORDER_CHANGE_STORAGE_KEY } from './quoteCheckout';

vi.mock('@/store', () => ({
  store: {
    dispatch: vi.fn(),
    getState: vi.fn(() => ({ company: { tokens: { B2BToken: 'test-token' } } })),
  },
  setQuoteDetailToCheckoutUrl: vi.fn((payload) => ({
    type: 'setQuoteDetailToCheckoutUrl',
    payload,
  })),
}));

vi.mock('@/store/selectors', () => ({
  isLoggedInSelector: vi.fn(() => true),
}));

vi.mock('@/utils/b3checkout', () => ({
  attemptCheckoutLoginAndRedirect: vi.fn(),
  setQuoteToStorage: vi.fn(),
}));

vi.mock('@/utils/b3Logger', () => ({
  default: { error: vi.fn() },
}));

vi.mock('@/utils/b3Tip', () => ({
  snackbar: { error: vi.fn() },
}));

vi.mock('@/utils/basicConfig', () => ({
  platform: 'bigcommerce',
  storeHash: 'test-store',
  channelId: 1,
  disableLogoutButton: false,
  BigCommerceStorefrontAPIBaseURL: 'https://store-test-store.mybigcommerce.com',
  isBigCommercePlatform: () => true,
  isCatalystPlatform: () => false,
}));

vi.mock('@/utils/loginInfo', () => ({
  getSearchVal: vi.fn(() => ''),
}));

const { server } = startMockServer();

const stockSnapshot = (totalOnHand: number): QuoteStockSnapshotItem[] => [
  {
    lineId: 'line-1',
    productId: 1,
    variantId: 10,
    quantity: 5,
    inventoryTracking: 'product',
    totalOnHand,
  },
];

const b3Lang: LangFormatFunction = (key) => key as unknown as string;
const formatValidationError = (err: ProductValidationError) => `error-${err.code}`;

const baseArgs = {
  quoteId: '42',
  role: 0,
  location: { search: '', pathname: '/quote/42' } as Location,
  b3Lang,
  formatValidationError,
};

describe('handleQuoteCheckout backorder snapshot detection', () => {
  beforeEach(() => {
    sessionStorage.clear();

    server.use(
      graphql.query('getStorefrontProductSettings', () =>
        HttpResponse.json({
          data: {
            storefrontProductSettings: { hidePriceFromGuests: false },
          },
        }),
      ),
      graphql.mutation('CheckoutQuote', () =>
        HttpResponse.json({
          data: {
            quoteCheckout: {
              quoteCheckout: { checkoutUrl: '/checkout', cartId: 'cart-1' },
            },
          },
        }),
      ),
    );
  });

  it('writes the backorder flag when fulfillable quantity differs between snapshots', async () => {
    await handleQuoteCheckout({
      ...baseArgs,
      isBackorderMessagingEnabled: true,
      quoteStockSnapshot: stockSnapshot(10),
      fetchCurrentStockSnapshot: async () => stockSnapshot(2),
    });

    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBe('true');
  });

  it('does not write the flag when fulfillable quantity is unchanged', async () => {
    await handleQuoteCheckout({
      ...baseArgs,
      isBackorderMessagingEnabled: true,
      quoteStockSnapshot: stockSnapshot(10),
      fetchCurrentStockSnapshot: async () => stockSnapshot(10),
    });

    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBeNull();
  });

  it('does not refetch or write the flag when the feature flag is off', async () => {
    const fetcher = vi.fn(async () => stockSnapshot(2));

    await handleQuoteCheckout({
      ...baseArgs,
      isBackorderMessagingEnabled: false,
      quoteStockSnapshot: stockSnapshot(10),
      fetchCurrentStockSnapshot: fetcher,
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBeNull();
  });

  it('does not refetch when the previous snapshot is empty', async () => {
    const fetcher = vi.fn(async () => stockSnapshot(2));

    await handleQuoteCheckout({
      ...baseArgs,
      isBackorderMessagingEnabled: true,
      quoteStockSnapshot: [],
      fetchCurrentStockSnapshot: fetcher,
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBeNull();
  });

  it('clears a stale flag from a previous attempt when the current verdict is no-change', async () => {
    sessionStorage.setItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY, 'true');

    await handleQuoteCheckout({
      ...baseArgs,
      isBackorderMessagingEnabled: true,
      quoteStockSnapshot: stockSnapshot(10),
      fetchCurrentStockSnapshot: async () => stockSnapshot(10),
    });

    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBeNull();
  });

  it('clears a stale flag even when the feature flag is off', async () => {
    sessionStorage.setItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY, 'true');

    await handleQuoteCheckout({
      ...baseArgs,
      isBackorderMessagingEnabled: false,
      quoteStockSnapshot: stockSnapshot(10),
      fetchCurrentStockSnapshot: async () => stockSnapshot(2),
    });

    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBeNull();
  });

  it('does not throw or write the flag when fetchCurrentStockSnapshot rejects', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('network down');
    });

    await expect(
      handleQuoteCheckout({
        ...baseArgs,
        isBackorderMessagingEnabled: true,
        quoteStockSnapshot: stockSnapshot(10),
        fetchCurrentStockSnapshot: fetcher,
      }),
    ).resolves.toBeUndefined();

    expect(sessionStorage.getItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY)).toBeNull();
  });
});
