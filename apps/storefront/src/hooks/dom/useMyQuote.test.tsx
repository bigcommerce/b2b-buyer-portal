import { render, screen, waitFor } from '@testing-library/react';
import {
  FakeProductDataProvider,
  graphql,
  HttpResponse,
  startMockServer,
  stringContainingAll,
} from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { GlobalState, initialState } from '@/store';

import useMyQuote from './useMyQuote';

const { server } = startMockServer();

const mockGlobalState: GlobalState = {
  ...initialState,
  blockPendingQuoteNonPurchasableOOS: {
    isEnableProduct: true,
  },
  featureFlags: {
    'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
  },
};

describe('useMyQuote', () => {
  it('should render add to quote button if product is purchasable', async () => {
    const b2bProductPurchasable = vi.fn().mockReturnValue({
      availability: 'available',
      inventoryLevel: 5,
      inventoryTracking: 'product',
      purchasingDisabled: '0',
      availableToSell: 5,
      unlimitedBackorder: true,
    });

    server.use(
      graphql.query('GetProductPurchasable', ({ query }) =>
        HttpResponse.json({ data: { productPurchasable: b2bProductPurchasable(query) } }),
      ),
    );

    render(<FakeProductDataProvider productId="123" quantity="1" sku="TEST-SKU" options={{}} />);

    renderHookWithProviders(
      () =>
        useMyQuote({
          setOpenPage: () => {},
          productQuoteEnabled: true,
          role: 1,
          customerId: 1,
        }),
      {
        preloadedState: {
          global: mockGlobalState,
        },
      },
    );

    await waitFor(() => {
      expect(b2bProductPurchasable).toHaveBeenCalledWith(
        stringContainingAll('productId: 123,', 'sku: "TEST-SKU",'),
      );
    });
    expect(screen.getByText(/Add to quote/i)).toBeInTheDocument();
  });

  it('should not render add to quote button if product is not purchasable', async () => {
    const b2bProductPurchasable = vi.fn().mockReturnValue({
      availability: 'unavailable',
      inventoryLevel: 0,
      inventoryTracking: 'product',
      purchasingDisabled: '1',
      availableToSell: 0,
      unlimitedBackorder: false,
    });

    server.use(
      graphql.query('GetProductPurchasable', ({ query }) =>
        HttpResponse.json({ data: { productPurchasable: b2bProductPurchasable(query) } }),
      ),
    );

    render(<FakeProductDataProvider productId="123" quantity="1" sku="TEST-SKU" options={{}} />);

    renderHookWithProviders(
      () =>
        useMyQuote({
          setOpenPage: () => {},
          productQuoteEnabled: true,
          role: 1,
          customerId: 1,
        }),
      {
        preloadedState: {
          global: mockGlobalState,
        },
      },
    );

    await waitFor(() => {
      expect(b2bProductPurchasable).toHaveBeenCalledWith(
        stringContainingAll('productId: 123,', 'sku: "TEST-SKU",'),
      );
    });
    expect(screen.queryByText(/Add to Quote/i)).not.toBeInTheDocument();
  });
});
