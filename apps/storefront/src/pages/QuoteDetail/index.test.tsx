import { useParams } from 'react-router-dom';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildQuoteWith,
  buildStoreInfoStateWith,
  faker,
  getUnixTime,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';

import { B2BProducts, ProductSearch } from '@/shared/service/b2b/graphql/product';
import { B2BQuoteDetail, QuoteExtraFieldsConfig } from '@/shared/service/b2b/graphql/quote';
import { CompanyStatus, UserTypes } from '@/types';

import QuoteDetail from './index';

vitest.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: vitest.fn(),
}));

const { server } = startMockServer();

type QuoteProduct = B2BQuoteDetail['data']['quote']['productsList'][number];

const buildQuoteProductWith = builder<QuoteProduct>(() => ({
  productId: faker.number.int().toString(),
  sku: faker.string.uuid(),
  basePrice: faker.commerce.price(),
  discount: faker.commerce.price(),
  offeredPrice: faker.commerce.price(),
  quantity: faker.number.int(),
  variantId: faker.number.int(),
  imageUrl: faker.image.url(),
  orderQuantityMaximum: faker.number.int(),
  orderQuantityMinimum: faker.number.int(),
  productName: faker.commerce.productName(),
  purchaseHandled: faker.datatype.boolean(),
  options: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    type: faker.lorem.word(),
    optionId: faker.number.int(),
    optionName: faker.lorem.word(),
    optionLabel: faker.commerce.productMaterial(),
    optionValue: faker.lorem.word(),
  })),
  notes: faker.lorem.sentence(),
  costPrice: faker.commerce.price(),
  inventoryTracking: faker.lorem.word(),
  inventoryLevel: faker.number.int(),
}));

const buildProductSearchWith = builder<ProductSearch>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.uuid(),
  costPrice: faker.commerce.price(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'simple', 'complex']),
  availability: faker.helpers.arrayElement(['available', 'unavailable']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    variant_id: faker.number.int(),
    product_id: faker.number.int(),
    sku: faker.string.uuid(),
    option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      id: faker.number.int(),
      label: faker.commerce.productAdjective(),
      option_id: faker.number.int(),
      option_display_name: faker.commerce.productAdjective(),
    })),
    calculated_price: parseFloat(faker.commerce.price()),
    image_url: faker.image.url(),
    has_price_list: faker.datatype.boolean(),
    bulk_prices: [],
    purchasing_disabled: faker.datatype.boolean(),
    cost_price: parseFloat(faker.commerce.price()),
    inventory_level: faker.number.int(),
    bc_calculated_price: {
      as_entered: parseFloat(faker.commerce.price()),
      tax_inclusive: parseFloat(faker.commerce.price()),
      tax_exclusive: parseFloat(faker.commerce.price()),
      entered_inclusive: faker.datatype.boolean(),
    },
  })),
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    option_id: faker.number.int(),
    display_name: faker.commerce.productAdjective(),
    sort_order: faker.number.int(),
    is_required: faker.datatype.boolean(),
  })),
  optionsV3: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    id: faker.number.int(),
    product_id: faker.number.int(),
    name: faker.commerce.productAdjective(),
    display_name: faker.commerce.productAdjective(),
    type: faker.helpers.arrayElement(['rectangles', 'swatch', 'dropdown']),
    sort_order: faker.number.int(),
    option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      id: faker.number.int(),
      label: faker.commerce.productAdjective(),
      sort_order: faker.number.int(),
      value_data: null,
      is_default: faker.datatype.boolean(),
    })),
    config: [],
  })),
  channelId: [],
  productUrl: faker.internet.url(),
  taxClassId: faker.number.int(),
  isPriceHidden: faker.datatype.boolean(),
}));

const buildProductSearchDataWith = builder<B2BProducts>(() => ({
  data: {
    productsSearch: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      id: faker.number.int(),
      name: faker.commerce.productName(),
      sku: faker.string.uuid(),
      costPrice: faker.commerce.price(),
      inventoryLevel: faker.number.int(),
      inventoryTracking: faker.helpers.arrayElement(['none', 'simple', 'complex']),
      availability: faker.helpers.arrayElement(['available', 'unavailable']),
      orderQuantityMinimum: faker.number.int(),
      orderQuantityMaximum: faker.number.int(),
      variants: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        variant_id: faker.number.int(),
        product_id: faker.number.int(),
        sku: faker.string.uuid(),
        option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
          id: faker.number.int(),
          label: faker.commerce.productAdjective(),
          option_id: faker.number.int(),
          option_display_name: faker.commerce.productAdjective(),
        })),
        calculated_price: parseFloat(faker.commerce.price()),
        image_url: faker.image.url(),
        has_price_list: faker.datatype.boolean(),
        bulk_prices: [],
        purchasing_disabled: faker.datatype.boolean(),
        cost_price: parseFloat(faker.commerce.price()),
        inventory_level: faker.number.int(),
        bc_calculated_price: {
          as_entered: parseFloat(faker.commerce.price()),
          tax_inclusive: parseFloat(faker.commerce.price()),
          tax_exclusive: parseFloat(faker.commerce.price()),
          entered_inclusive: faker.datatype.boolean(),
        },
      })),
      currencyCode: faker.finance.currencyCode(),
      imageUrl: faker.image.url(),
      modifiers: [],
      options: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        option_id: faker.number.int(),
        display_name: faker.commerce.productAdjective(),
        sort_order: faker.number.int(),
        is_required: faker.datatype.boolean(),
      })),
      optionsV3: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
        id: faker.number.int(),
        product_id: faker.number.int(),
        name: faker.commerce.productAdjective(),
        display_name: faker.commerce.productAdjective(),
        type: faker.helpers.arrayElement(['rectangles', 'swatch', 'dropdown']),
        sort_order: faker.number.int(),
        option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
          id: faker.number.int(),
          label: faker.commerce.productAdjective(),
          sort_order: faker.number.int(),
          value_data: null,
          is_default: faker.datatype.boolean(),
        })),
        config: [],
      })),
      channelId: [],
      productUrl: faker.internet.url(),
      taxClassId: faker.number.int(),
      isPriceHidden: faker.datatype.boolean(),
    })),
  },
}));

const buildQuoteExtraFieldsWith = builder<QuoteExtraFieldsConfig>(() => ({
  data: { quoteExtraFieldsConfig: [] },
}));

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C },
  });

  const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

  const preloadedState = {
    company: approvedB2BCompany,
    storeInfo: storeInfoWithDateFormat,
    global: buildGlobalStateWith('WHATEVER_VALUES'),
  };

  it('displays the quote number as the page "title"', async () => {
    const quote = buildQuoteWith({ data: { quote: { id: '272989', quoteNumber: '911911' } } });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchDataWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByText('Quote #911911')).toBeInTheDocument();
  });

  it('displays the quote status, issue and expiration dates', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          status: 4,
          createdAt: getUnixTime(new Date('2 February 2025')),
          expiredAt: getUnixTime(new Date('3 March 2025')),
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchDataWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByText('Ordered')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Issued on:' })).toBeInTheDocument();
    expect(screen.getByText('2 February 2025')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Expiration date:' })).toBeInTheDocument();
    expect(screen.getByText('3 March 2025')).toBeInTheDocument();
  });

  it('displays a summary of the products within the quote', async () => {
    const woolSock = buildQuoteProductWith({
      productName: 'Wool Socks',
      quantity: 10,
      basePrice: '49.00',
      offeredPrice: '49.00',
    });

    const denimJacket = buildQuoteProductWith({
      productName: 'Denim Jacket',
      quantity: 3,
      basePrice: '133.33',
      offeredPrice: '133.33',
    });

    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          productsList: [woolSock, denimJacket],
          currency: { token: '$', location: 'left', decimalToken: '.', decimalPlaces: 2 },
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchDataWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByText('2 products')).toBeInTheDocument();

    const rowOfWoolSocks = screen.getByRole('row', { name: /Wool Socks/ });

    expect(within(rowOfWoolSocks).getByRole('cell', { name: '$49.00' })).toBeInTheDocument();
    expect(within(rowOfWoolSocks).getByRole('cell', { name: '10' })).toBeInTheDocument();
    expect(within(rowOfWoolSocks).getByRole('cell', { name: '$490.00' })).toBeInTheDocument();

    const rowOfDenimJacket = screen.getByRole('row', { name: /Denim Jacket/ });

    expect(within(rowOfDenimJacket).getByRole('cell', { name: '$133.33' })).toBeInTheDocument();
    expect(within(rowOfDenimJacket).getByRole('cell', { name: '3' })).toBeInTheDocument();
    expect(within(rowOfDenimJacket).getByRole('cell', { name: '$399.99' })).toBeInTheDocument();
  });

  it('displays a quote summary', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          productsList: [buildQuoteProductWith('WHATEVER_VALUES')],
          currency: { token: '$', location: 'left', decimalToken: '.', decimalPlaces: 2 },
          displayDiscount: true,
          discount: '25.00',
          subtotal: '1000.00',
          shippingTotal: '50.00',
          taxTotal: '33.00',
          totalAmount: '1025.00',
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildProductSearchDataWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Quote summary' })).toBeInTheDocument();

    expect(await screen.findByText('Original subtotal')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();

    expect(screen.getByText('Discount amount')).toBeInTheDocument();
    expect(screen.getByText('-$25.00')).toBeInTheDocument();

    expect(screen.getByText('Quoted subtotal')).toBeInTheDocument();
    expect(screen.getByText('$975.00')).toBeInTheDocument();

    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();

    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('$33.00')).toBeInTheDocument();

    expect(screen.getByText('Grand total')).toBeInTheDocument();
    expect(screen.getByText('$1,025.00')).toBeInTheDocument();
  });

  it('displays snackbar error on load if a product in the quote has validation errors', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          quoteNumber: '911911',
          status: 2,
          allowCheckout: true,
          productsList: [buildQuoteProductWith({ productId: '123' })],
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(
          buildProductSearchDataWith({
            data: {
              productsSearch: [buildProductSearchWith({ id: 123 })],
            },
          }),
        ),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
      graphql.query('ValidateProduct', () =>
        HttpResponse.json({
          data: {
            validateProduct: {
              responseType: 'ERROR',
              message: 'A product with the id of 123 does not have sufficient stock',
            },
          },
        }),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        company: {
          ...preloadedState.company,
          permissions: [
            { code: 'purchase_enable', permissionLevel: 1 },
            { code: 'checkout_with_quote', permissionLevel: 1 },
          ],
        },
        global: {
          ...preloadedState.global,
          featureFlags: {
            'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
          },
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(
      await screen.findByText('A product with the id of 123 does not have sufficient stock'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /PROCEED TO CHECKOUT/i })).toBeInTheDocument();
  });

  it('does not render any message for product that has a validation warning', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          quoteNumber: '911911',
          productsList: [buildQuoteProductWith({ productId: '123' })],
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(
          buildProductSearchDataWith({
            data: {
              productsSearch: [buildProductSearchWith({ id: 123 })],
            },
          }),
        ),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
      graphql.query('ValidateProduct', () =>
        HttpResponse.json({
          data: {
            validateProduct: {
              responseType: 'WARNING',
              message: 'A product with the id of 123 does not have sufficient stock',
            },
          },
        }),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        global: {
          ...preloadedState.global,
          featureFlags: {
            'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
          },
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(
      screen.queryByText('A product with the id of 123 does not have sufficient stock'),
    ).not.toBeInTheDocument();
  });

  it('checkout throws an error if validateProduct endpoint returns a product with error', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          quoteNumber: '911911',
          status: 2,
          allowCheckout: true,
          productsList: [buildQuoteProductWith({ productId: '123' })],
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(
          buildProductSearchDataWith({
            data: {
              productsSearch: [buildProductSearchWith({ id: 123 })],
            },
          }),
        ),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
      graphql.query('ValidateProduct', () =>
        HttpResponse.json({
          data: {
            validateProduct: {
              responseType: 'ERROR',
              message: 'A product with the id of 123 does not have sufficient stock',
            },
          },
        }),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        company: {
          ...preloadedState.company,
          permissions: [
            { code: 'purchase_enable', permissionLevel: 1 },
            { code: 'checkout_with_quote', permissionLevel: 1 },
          ],
        },
        global: {
          ...preloadedState.global,
          featureFlags: {
            'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
          },
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const checkoutButton = await screen.findByRole('button', { name: /PROCEED TO CHECKOUT/i });
    await userEvent.click(checkoutButton);

    // the error message is shown in a snackbar when loading the page and when user tries clicking the checkout button
    // and a product has an error
    expect(
      await screen.findAllByText('A product with the id of 123 does not have sufficient stock'),
    ).toHaveLength(2);
  });
});
