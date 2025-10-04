import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Mock, vi } from 'vitest';

import { initState } from '@/shared/global/context/config';
import { getB2BProductPurchasable } from '@/shared/service/b2b/graphql/product';

import { renderHookWithProviders } from '../../../tests/utils/hook-test-utils';

import usePurchasableQuote from './usePurchasableQuote';

type HookResult = ReturnType<typeof usePurchasableQuote>;
type HookProps = Parameters<typeof usePurchasableQuote>[0];

vi.mock('@/shared/service/b2b/graphql/product', () => ({
  getB2BProductPurchasable: vi.fn(),
}));

const mockFeatureFlags = {
  'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
};

vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => mockFeatureFlags,
}));

const mockGlobalState = {
  ...initState,
  blockPendingQuoteNonPurchasableOOS: {
    isEnableProduct: true,
  },
} as any;

describe('usePurchasableQuote - B2B-3318 changes', () => {
  let mockGetB2BProductPurchasable: Mock;

  beforeEach(async () => {
    mockGetB2BProductPurchasable = getB2BProductPurchasable as Mock;

    // Setup DOM elements required by the hook
    document.body.innerHTML = `
      <div>
        <div data-product-sku="TEST-SKU" data-test-id="product-sku">TEST-SKU</div>
        <input 
          name="qty[]" 
          value="1" 
          type="number"
          role="spinbutton"
          aria-label="qty"
          data-test-id="qty-input"
        />
        <input name="product_id" value="123" type="hidden" data-test-id="product-id" />
      </div>
    `;

    // Reset mock before each test
    mockGetB2BProductPurchasable.mockReset();

    // Wait for DOM to be ready
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should allow purchase when unlimited backorder is enabled', async () => {
    mockGetB2BProductPurchasable.mockImplementation(() =>
      Promise.resolve({
        productPurchasable: {
          availability: 'available',
          inventoryLevel: 5,
          inventoryTracking: 'product',
          purchasingDisabled: '0',
          availableToSell: 5,
          unlimitedBackorder: true,
        },
      }),
    );

    const { result: hookResult } = renderHookWithProviders<HookResult, HookProps>(
      () => usePurchasableQuote(false),
      {
        preloadedState: {
          global: mockGlobalState,
        },
      },
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockGetB2BProductPurchasable).toHaveBeenCalledWith({
        productId: '123',
        sku: 'TEST-SKU',
        isProduct: true,
      });
    });

    // Wait for hook to initialize
    await waitFor(() => {
      expect(hookResult.result.current).toBeDefined();
    });

    // Initial state should be purchasable
    expect(hookResult.result.current).toEqual([true]);

    // Change quantity to more than available stock
    const qtyInput = screen.getByRole('spinbutton', { name: /qty/i });
    await userEvent.clear(qtyInput);
    await userEvent.type(qtyInput, '10');

    // Should still be purchasable due to unlimited backorder
    await waitFor(() => {
      expect(hookResult.result.current).toEqual([true]);
    });
  });

  it('should use availableToSell for stock validation when provided', async () => {
    mockGetB2BProductPurchasable.mockImplementation(() =>
      Promise.resolve({
        productPurchasable: {
          availability: 'available',
          inventoryLevel: 10, // Higher inventory level
          inventoryTracking: 'product',
          purchasingDisabled: '0',
          availableToSell: 5, // Lower available to sell
          unlimitedBackorder: false,
        },
      }),
    );

    const { result: hookResult } = renderHookWithProviders<HookResult, HookProps>(
      () => usePurchasableQuote(false),
      {
        preloadedState: {
          global: mockGlobalState,
        },
      },
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockGetB2BProductPurchasable).toHaveBeenCalledWith({
        productId: '123',
        sku: 'TEST-SKU',
        isProduct: true,
      });
    });

    // Wait for hook to initialize
    await waitFor(() => {
      expect(hookResult.result.current).toBeDefined();
    });

    // Initial state should be purchasable
    expect(hookResult.result.current).toEqual([true]);

    // Change quantity to more than availableToSell but less than inventoryLevel
    const qtyInput = screen.getByRole('spinbutton', { name: /qty/i });
    await userEvent.clear(qtyInput);
    await userEvent.type(qtyInput, '6');

    // Should not be purchasable as it exceeds availableToSell
    await waitFor(() => {
      expect(hookResult.result.current).toEqual([false]);
    });
  });

  it('should fallback to inventory level when feature flag is enabled but no backorder data is provided', async () => {
    mockGetB2BProductPurchasable.mockImplementation(() =>
      Promise.resolve({
        productPurchasable: {
          availability: 'available',
          inventoryLevel: 5,
          inventoryTracking: 'product',
          purchasingDisabled: '0',
          // No availableToSell or unlimitedBackorder provided
        },
      }),
    );

    const { result: hookResult } = renderHookWithProviders<HookResult, HookProps>(
      () => usePurchasableQuote(false),
      {
        preloadedState: {
          global: mockGlobalState,
        },
      },
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockGetB2BProductPurchasable).toHaveBeenCalledWith({
        productId: '123',
        sku: 'TEST-SKU',
        isProduct: true,
      });
    });

    // Wait for hook to initialize
    await waitFor(() => {
      expect(hookResult.result.current).toBeDefined();
    });

    // Initial state should be purchasable
    expect(hookResult.result.current).toEqual([true]);

    // Change quantity to more than inventory level
    const qtyInput = screen.getByRole('spinbutton', { name: /qty/i });
    await userEvent.clear(qtyInput);
    await userEvent.type(qtyInput, '6');

    // Should not be purchasable as it exceeds inventory level
    await waitFor(() => {
      expect(hookResult.result.current).toEqual([false]);
    });
  });

  it('should not allow purchase when inventory level is 0 and backorder is false', async () => {
    mockGetB2BProductPurchasable.mockImplementation(() =>
      Promise.resolve({
        productPurchasable: {
          availability: 'available',
          inventoryLevel: 0,
          inventoryTracking: 'product',
          purchasingDisabled: '0',
          availableToSell: 0,
          unlimitedBackorder: false,
        },
      }),
    );

    const { result: hookResult } = renderHookWithProviders<HookResult, HookProps>(
      () => usePurchasableQuote(false),
      {
        preloadedState: {
          global: mockGlobalState,
        },
      },
    );

    // Wait for API call to complete
    await waitFor(() => {
      expect(mockGetB2BProductPurchasable).toHaveBeenCalledWith({
        productId: '123',
        sku: 'TEST-SKU',
        isProduct: true,
      });
    });

    // Wait for hook to initialize
    await waitFor(() => {
      expect(hookResult.result.current).toBeDefined();
    });

    // Should not be purchasable when inventory is 0 and no backorder
    await waitFor(() => {
      expect(hookResult.result.current).toEqual([false]);
    });
  });
});
