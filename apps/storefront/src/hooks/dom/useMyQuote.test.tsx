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

import * as productService from '@/shared/service/b2b/graphql/product';
import { GlobalState, initialState } from '@/store';

import { useMyQuote } from './useMyQuote';

const { server } = startMockServer();

type ProductPurchasable =
  productService.B2BProductPurchasableResponse['data']['productPurchasable'];

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
};

describe('when NP&OOS setting is enabled', () => {
  it('renders the purchasable button for a translated SKU', async () => {
    const productPurchasableResponse = vi.fn();

    when(productPurchasableResponse)
      .calledWith(stringContainingAll('productId: 123', 'sku: "81006564"'))
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

    render(<FakeProductDataProvider productId="123" quantity="1" sku="81006564" options={{}} />);

    const skuElement = screen.getByText('81006564');
    skuElement.innerHTML = '<font dir="auto"><font dir="auto">81006564</font></font>';

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
          global: {
            ...mockGlobalState,
            featureFlags: { 'B2B-3474.get_sku_from_pdp_with_text_content': true },
          },
        },
      },
    );

    await waitFor(() => {
      expect(productPurchasableResponse).toHaveBeenCalledWith(
        stringContainingAll('productId: 123', 'sku: "81006564"'),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Add to quote/i)).toBeInTheDocument();
    });
  });

  it('does not request purchasability again when translated subtree churn preserves the SKU', async () => {
    const productPurchasableResponse = vi.fn();

    when(productPurchasableResponse)
      .calledWith(stringContainingAll('productId: 123', 'sku: "81006564"'))
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

    render(<FakeProductDataProvider productId="123" quantity="1" sku="81006564" options={{}} />);

    const skuElement = screen.getByText('81006564');
    skuElement.innerHTML = '<font dir="auto"><font dir="auto">81006564</font></font>';

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
          global: {
            ...mockGlobalState,
            featureFlags: { 'B2B-3474.get_sku_from_pdp_with_text_content': true },
          },
        },
      },
    );

    await waitFor(() => {
      expect(productPurchasableResponse).toHaveBeenCalledWith(
        stringContainingAll('productId: 123', 'sku: "81006564"'),
      );
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    const requestCountBeforeSubtreeChurn = productPurchasableResponse.mock.calls.length;

    skuElement.innerHTML = '<font dir="auto"><span>81006564</span></font>';
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(productPurchasableResponse).toHaveBeenCalledTimes(requestCountBeforeSubtreeChurn);
  });

  it('requests purchasability with the translated SKU mutation', async () => {
    const productPurchasableResponse = vi.fn();

    when(productPurchasableResponse)
      .calledWith(stringContainingAll('productId: 123', 'sku: "81006564"'))
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
    when(productPurchasableResponse)
      .calledWith(stringContainingAll('productId: 123', 'sku: "81006565"'))
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

    render(<FakeProductDataProvider productId="123" quantity="1" sku="81006564" options={{}} />);

    const skuElement = screen.getByText('81006564');
    skuElement.innerHTML = '<font dir="auto"><font dir="auto">81006564</font></font>';

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
          global: {
            ...mockGlobalState,
            featureFlags: { 'B2B-3474.get_sku_from_pdp_with_text_content': true },
          },
        },
      },
    );

    await waitFor(() => {
      expect(productPurchasableResponse).toHaveBeenCalledWith(
        stringContainingAll('productId: 123', 'sku: "81006564"'),
      );
    });

    const nestedSkuElement = screen.getByText('81006564');
    nestedSkuElement.textContent = '81006565';

    await waitFor(() => {
      expect(productPurchasableResponse).toHaveBeenCalledWith(
        stringContainingAll('productId: 123', 'sku: "81006565"'),
      );
    });
  });

  it('does not request purchasability for nested translated SKU mutations when B2B-3474 is disabled', async () => {
    const getProductPurchasable = vi
      .spyOn(productService, 'getB2BProductPurchasable')
      .mockResolvedValue({
        productPurchasable: buildProductPurchasableWith({
          availability: 'available',
          availableToSell: 5,
          inventoryLevel: 5,
          inventoryTracking: 'product',
          purchasingDisabled: false,
          unlimitedBackorder: true,
        }),
      });

    render(<FakeProductDataProvider productId="123" quantity="1" sku="81006564" options={{}} />);

    const skuElement = screen.getByText('81006564');
    skuElement.innerHTML = '<font dir="auto"><font dir="auto">81006564</font></font>';

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
          global: {
            ...mockGlobalState,
            featureFlags: { 'B2B-3474.get_sku_from_pdp_with_text_content': false },
          },
        },
      },
    );

    await waitFor(() => {
      expect(getProductPurchasable).toHaveBeenCalled();
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    const requestCountBeforeNestedMutation = getProductPurchasable.mock.calls.length;

    const nestedSkuElement = screen.getByText('81006564');
    nestedSkuElement.textContent = '81006565';
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(getProductPurchasable).toHaveBeenCalledTimes(requestCountBeforeNestedMutation);
  });

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
