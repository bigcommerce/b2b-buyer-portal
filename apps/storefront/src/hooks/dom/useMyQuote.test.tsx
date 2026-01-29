import { render, screen, waitFor } from '@testing-library/react';
import {
  builder,
  FakeProductDataProvider,
  faker,
  graphql,
  HttpResponse,
  startMockServer,
  stringContainingAll,
} from 'tests/test-utils';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { when } from 'vitest-when';

import { B2BProductPurchasableResponse } from '@/shared/service/b2b/graphql/product';
import { GlobalState, initialState } from '@/store';

import { useMyQuote } from './useMyQuote';

const { server } = startMockServer();

type ProductPurchasable = B2BProductPurchasableResponse['data']['productPurchasable'];

const buildProductPurchasableWith = builder<ProductPurchasable>(() => ({
  availability: faker.helpers.arrayElement(['available', 'disabled']),
  availableToSell: faker.number.int(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'product', 'variant']),
  purchasingDisabled: faker.datatype.boolean(),
  unlimitedBackorder: faker.datatype.boolean(),
}));

const mockGlobalState: GlobalState = {
  ...initialState,
  blockPendingQuoteNonPurchasableOOS: {
    isEnableProduct: true,
  },
  backorderEnabled: true,
  featureFlags: {
    'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
  },
};

describe('when NP&OOS setting is enabled', () => {
  it('should render add to quote button if product is purchasable', async () => {
    const productPurchasableResponse = vi.fn();

    when(productPurchasableResponse)
      .calledWith(stringContainingAll('productId: 123', 'sku: "TEST-SKU"'))
      .thenReturn(
        buildProductPurchasableWith({
          availability: 'available',
          availableToSell: 5,
          inventoryLevel: 5,
          inventoryTracking: 'product',
          purchasingDisabled: false,
          unlimitedBackorder: true,
        }),
      );

    server.use(
      graphql.query('GetProductPurchasable', ({ query }) =>
        HttpResponse.json({ data: { productPurchasable: productPurchasableResponse(query) } }),
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
      expect(productPurchasableResponse).toHaveBeenCalled();
    });

    expect(screen.getByText(/Add to quote/i)).toBeInTheDocument();
  });

  it('should render add to quote button if product is not purchasable', async () => {
    const productPurchasableResponse = vi.fn();

    when(productPurchasableResponse)
      .calledWith(stringContainingAll('productId: 123', 'sku: "TEST-SKU"'))
      .thenReturn(
        buildProductPurchasableWith({
          availability: 'disabled',
          availableToSell: 0,
          inventoryLevel: 0,
          inventoryTracking: 'product',
          purchasingDisabled: true,
          unlimitedBackorder: false,
        }),
      );

    server.use(
      graphql.query('GetProductPurchasable', ({ query }) =>
        HttpResponse.json({ data: { productPurchasable: productPurchasableResponse(query) } }),
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
      expect(productPurchasableResponse).toHaveBeenCalled();
    });

    expect(screen.getByText(/Add to 1 quote/i)).toBeInTheDocument();
  });
});

describe('when NP&OOS setting is disabled', () => {
  beforeEach(() => {
    mockGlobalState.blockPendingQuoteNonPurchasableOOS.isEnableProduct = false;
  });

  it('should render add to quote button if product is purchasable', async () => {
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
      expect(screen.getByText(/Add to quote/i)).toBeInTheDocument();
    });
  });

  it('should not render add to quote button if product is not purchasable', async () => {
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
      expect(screen.queryByText(/Add to 1 quote/i)).not.toBeInTheDocument();
    });
  });
});
