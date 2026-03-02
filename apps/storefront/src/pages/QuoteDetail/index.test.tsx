import { useParams } from 'react-router-dom';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildQuoteWith,
  buildStoreInfoStateWith,
  delay,
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
import { when } from 'vitest-when';

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

const buildProductSearchResponseWith = builder<B2BProducts>(() => ({
  data: {
    productsSearch: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
      ...buildProductSearchWith('WHATEVER_VALUES'),
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
        HttpResponse.json(buildProductSearchResponseWith('WHATEVER_VALUES')),
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
        HttpResponse.json(buildProductSearchResponseWith('WHATEVER_VALUES')),
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
        HttpResponse.json(buildProductSearchResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        global: { ...preloadedState.global, backorderEnabled: false },
      },
    });

    expect(await screen.findByText('2 products')).toBeInTheDocument();

    const rowOfWoolSocks = await screen.findByRole('row', { name: /Wool Socks/ });

    expect(within(rowOfWoolSocks).getByRole('cell', { name: '$49.00' })).toBeInTheDocument();
    expect(within(rowOfWoolSocks).getByRole('cell', { name: '10' })).toBeInTheDocument();
    expect(within(rowOfWoolSocks).getByRole('cell', { name: '$490.00' })).toBeInTheDocument();

    const rowOfDenimJacket = await screen.findByRole('row', { name: /Denim Jacket/ });

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
        HttpResponse.json(buildProductSearchResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        global: { ...preloadedState.global, backorderEnabled: false },
      },
    });

    expect(await screen.findByRole('heading', { name: 'Quote summary' })).toBeInTheDocument();

    expect(await screen.findByText('Original subtotal')).toBeInTheDocument();
    expect(await screen.findByText('$1,000.00')).toBeInTheDocument();

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
          buildProductSearchResponseWith({
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
              errorCode: 'OOS',
              product: {
                availableToSell: faker.number.int(),
              },
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
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(
      await screen.findByText(/does not have sufficient stock\. Please contact your Sales Rep/),
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
          buildProductSearchResponseWith({
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
          backorderEnabled: true,
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
          buildProductSearchResponseWith({
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
              errorCode: 'OOS',
              product: {
                availableToSell: faker.number.int(),
              },
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
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const checkoutButton = await screen.findByRole('button', { name: /PROCEED TO CHECKOUT/i });
    await userEvent.click(checkoutButton);

    // the error message is shown in a snackbar when loading the page and when user tries clicking the checkout button
    // and a product has an error
    expect(
      await screen.findAllByText(/does not have sufficient stock\. Please contact your Sales Rep/),
    ).toHaveLength(2);
  });

  it('allows proceeding to checkout if all products are valid', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '123',
          quoteNumber: '123',
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
          buildProductSearchResponseWith({
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
              responseType: 'SUCCESS',
              message: 'Product is valid',
            },
          },
        }),
      ),
      graphql.query('getStorefrontProductSettings', () =>
        HttpResponse.json({
          data: {
            storefrontProductSettings: {
              hidePriceFromGuests: false,
            },
          },
        }),
      ),
      graphql.mutation('CheckoutQuote', () =>
        HttpResponse.json({
          data: {
            quoteCheckout: {
              quoteCheckout: {
                checkoutUrl:
                  'https://my-store/cart.php?action=loadInCheckout&id=123&token=1234567889&isFromQuote=Y',
                cartId: '123',
                cartUrl: 'https://my-store/cart.php?action=load&id=123&token=1234567889',
              },
            },
          },
        }),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '123' });

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
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const checkoutButton = await screen.findByRole('button', { name: /PROCEED TO CHECKOUT/i });
    await userEvent.click(checkoutButton);

    expect(window.location.href).toBe(
      'https://my-store/cart.php?action=loadInCheckout&id=123&token=1234567889&isFromQuote=Y',
    );
  });

  it('shows error snackbar when quote checkout returns no checkout payload', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '123',
          quoteNumber: '123',
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
          buildProductSearchResponseWith({
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
              responseType: 'SUCCESS',
              message: 'Product is valid',
            },
          },
        }),
      ),
      graphql.query('getStorefrontProductSettings', () =>
        HttpResponse.json({
          data: {
            storefrontProductSettings: {
              hidePriceFromGuests: false,
            },
          },
        }),
      ),
      graphql.mutation('CheckoutQuote', () => HttpResponse.json({ data: {} })),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '123' });

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
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    const checkoutButton = await screen.findByRole('button', { name: 'Proceed to checkout' });
    await userEvent.click(checkoutButton);

    expect(await screen.findByText('Product validation failed for this quote')).toBeInTheDocument();
  });

  it('shows structured validation error snackbars when quote checkout returns productValidationErrors', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '123',
          quoteNumber: '123',
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
          buildProductSearchResponseWith({
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
              responseType: 'SUCCESS',
              message: 'Product is valid',
            },
          },
        }),
      ),
      graphql.query('getStorefrontProductSettings', () =>
        HttpResponse.json({
          data: {
            storefrontProductSettings: {
              hidePriceFromGuests: false,
            },
          },
        }),
      ),
      graphql.mutation('CheckoutQuote', () =>
        HttpResponse.json({
          data: {},
          errors: [
            {
              message: 'Product validation failed',
              extensions: {
                productValidationErrors: [
                  {
                    itemId: 'item-1',
                    productId: 101,
                    variantId: 201,
                    responseType: 'ERROR',
                    code: 'OOS',
                    productName: 'Test Product',
                  },
                ],
              },
            },
          ],
        }),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '123' });

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
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    const checkoutButton = await screen.findByRole('button', { name: 'Proceed to checkout' });
    await userEvent.click(checkoutButton);

    expect(
      await screen.findByText(
        'Test Product does not have sufficient stock. Please contact your Sales Rep to have it re-issued.',
      ),
    ).toBeInTheDocument();
  });

  it('renders TBD instead of price in quote summary if product has an error', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          quoteNumber: '911911',
          status: 1,
          grandTotal: '1000.00',
          allowCheckout: true,
          discount: '0.00',
          displayDiscount: true,
          shippingMethod: {
            description: 'Flat rate',
          },
          taxTotal: '0.0000',
          subtotal: '1000.00',
          shippingTotal: '0.0000',
          salesRep: '',
          salesRepEmail: '',
          productsList: [
            buildQuoteProductWith({
              productId: '123',
              offeredPrice: '1000.00',
              basePrice: '1000.00',
            }),
          ],
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [buildProductSearchWith({ id: 123 })],
          },
        }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
      graphql.query('ValidateProduct', async () => {
        /*
          adding a delay to make sure we are mimicking the scenario where validateProduct api takes time
          and product error is visible immediately after loading
        */
        await delay(200);

        return HttpResponse.json({
          data: {
            validateProduct: {
              responseType: 'ERROR',
              message: 'A product with the id of 123 does not have sufficient stock',
              errorCode: 'OOS',
              product: {
                availableToSell: faker.number.int(),
              },
            },
          },
        });
      }),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        global: {
          ...preloadedState.global,
          blockPendingQuoteNonPurchasableOOS: {
            isEnableProduct: false,
          },
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
    expect(
      screen.getByText(/does not have sufficient stock\. Please contact your Sales Rep/),
    ).toBeInTheDocument();
    const summaryElement = screen.getByTestId('quote-summary');
    const withinSummary = within(summaryElement);
    expect(withinSummary.getByRole('row', { name: /Original subtotal/ })).toHaveTextContent(/TBD/);
    expect(withinSummary.getByRole('row', { name: /Quoted subtotal/ })).toHaveTextContent(/TBD/);
    expect(withinSummary.getByRole('row', { name: /Shipping/ })).toHaveTextContent(/TBD/);
    expect(withinSummary.getByRole('row', { name: /Grand total/ })).toHaveTextContent(/TBD/);
  });

  it('renders prices immediately after loading in quote summary if product has no errors', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '272989',
          quoteNumber: '911911',
          status: 2,
          grandTotal: '1000.00',
          subtotal: '1000.00',
          discount: '0.00',
          allowCheckout: true,
          taxTotal: '0.0000',
          totalAmount: '1000.00',
          shippingTotal: '0.00',
          currency: {
            token: '$',
            location: 'left',
            currencyCode: 'USD',
            decimalToken: '.',
            decimalPlaces: 2,
            thousandsToken: ',',
            currencyExchangeRate: '1.0000000000',
          },
          shippingMethod: {
            id: '4dcbf24f457dd67d5f89bcf374e0bc9b',
            cost: 0.0,
            description: 'Flat rate',
          },
          productsList: [
            buildQuoteProductWith({
              productId: '123',
              offeredPrice: '1000.00',
              basePrice: '1000.00',
            }),
          ],
          salesRep: 'john',
          salesRepEmail: 'john@email.com',
          displayDiscount: true,
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [
              buildProductSearchWith({
                id: 123,
                costPrice: '1000',
                variants: [
                  {
                    variant_id: 132,
                    product_id: 123,
                    sku: 'test',
                    option_values: [],
                    calculated_price: 1000,
                    image_url: '',
                    has_price_list: false,
                    bulk_prices: [],
                    purchasing_disabled: false,
                    cost_price: 0,
                    inventory_level: 2,
                    bc_calculated_price: {
                      as_entered: 1000,
                      tax_inclusive: 1000,
                      tax_exclusive: 1000,
                      entered_inclusive: false,
                    },
                  },
                ],
              }),
            ],
          },
        }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
      graphql.query('ValidateProduct', async () => {
        /*
          adding a delay to make sure we are mimicking the scenario where validateProduct api takes time
          and still no TBD shows
        */
        await delay(200);
        return HttpResponse.json({
          data: {
            validateProduct: {
              responseType: 'SUCCESS',
              message: 'Product is valid',
            },
          },
        });
      }),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        global: {
          ...preloadedState.global,
          backorderEnabled: true,
        },
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
    const summaryElement = screen.getByTestId('quote-summary');
    const withinSummary = within(summaryElement);
    expect(withinSummary.getByRole('row', { name: /Original subtotal/ })).toHaveTextContent(
      /\$1,000.00/,
    );
    expect(withinSummary.getByRole('row', { name: /Discount/ })).toHaveTextContent(/\$0.00/);
    expect(withinSummary.getByRole('row', { name: /Quoted subtotal/ })).toHaveTextContent(
      /\$1,000.00/,
    );
    expect(withinSummary.getByRole('row', { name: /Shipping/ })).toHaveTextContent(/\$0.00/);
    expect(withinSummary.getByRole('row', { name: /Tax/ })).toHaveTextContent(/\$0.00/);
    expect(withinSummary.getByRole('row', { name: /Grand total/ })).toHaveTextContent(/\$1,000.00/);
  });

  it('renders proceed to checkout button when isAutoQuoteEnable is enabled and quote has sales rep revision', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '123',
          quoteNumber: '123',
          status: 2,
          allowCheckout: true,
          salesRep: 'John Sales', // sales rep already revised the quote
          salesRepEmail: 'john.sales@company.com',
          productsList: [buildQuoteProductWith({ productId: '123' })],
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(
          buildProductSearchResponseWith({
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
              responseType: 'SUCCESS',
              message: 'Product is valid',
            },
          },
        }),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '123' });

    const stateWithAutoQuoteDisabled = {
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
        backorderEnabled: true,
        quoteConfig: [
          {
            key: 'quote_auto_quoting',
            value: '1',
            extraFields: {},
          },
        ],
      },
    };

    renderWithProviders(<QuoteDetail />, {
      preloadedState: stateWithAutoQuoteDisabled,
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(await screen.findByRole('button', { name: /PROCEED TO CHECKOUT/i })).toBeVisible();
  });

  it('does not render Proceed to Checkout button when auto quoting is disabled and no sales rep info', async () => {
    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '14234',
          quoteNumber: '2342',
          status: 2,
          allowCheckout: true,
          salesRep: '', // No sales rep
          salesRepEmail: '', // No sales rep email
          productsList: [buildQuoteProductWith({ productId: '123' })],
        },
      },
    });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(
          buildProductSearchResponseWith({
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

    vitest.mocked(useParams).mockReturnValue({ id: '123' });

    const stateWithAutoQuoteDisabled = {
      ...preloadedState,
      global: {
        ...preloadedState.global,
        backorderEnabled: true,
        quoteConfig: [
          {
            key: 'quote_auto_quoting',
            value: '0', // Disable auto quoting
            extraFields: {},
          },
        ],
      },
    };

    renderWithProviders(<QuoteDetail />, {
      preloadedState: stateWithAutoQuoteDisabled,
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.queryByRole('button', { name: /PROCEED TO CHECKOUT/i })).not.toBeInTheDocument();
  });

  it('validates products with required modifiers correctly', async () => {
    const productWithModifiers = buildQuoteProductWith({
      productId: '112',
      variantId: 77,
      productName: 'Product with Required Modifiers',
      options: [
        {
          type: 'text',
          optionId: 113,
          optionName: 'Custom Message',
          optionLabel: 'Test Message',
          optionValue: 'Test Message',
        },
        {
          type: 'dropdown',
          optionId: 114,
          optionName: 'Size',
          optionLabel: 'Large',
          optionValue: '42',
        },
      ],
    });

    const quote = buildQuoteWith({
      data: {
        quote: {
          id: '99999',
          productsList: [productWithModifiers],
        },
      },
    });

    const productSearchResult = buildProductSearchWith({
      id: 112,
      name: 'Product with Required Modifiers',
      variants: [
        {
          variant_id: 77,
          product_id: 112,
          sku: 'BACK10',
          option_values: [],
          calculated_price: 10,
          image_url: '',
          has_price_list: false,
          bulk_prices: [],
          purchasing_disabled: false,
          cost_price: 0,
          inventory_level: 0,
          bc_calculated_price: {
            as_entered: 10,
            tax_inclusive: 10,
            tax_exclusive: 10,
            entered_inclusive: false,
          },
        },
      ],
    });

    const validateProduct = vi.fn();
    when(validateProduct)
      .calledWith(
        expect.objectContaining({
          productId: 112,
          variantId: 77,
          quantity: expect.any(Number),
          productOptions: [
            {
              optionId: 113,
              optionValue: 'Test Message',
            },
            {
              optionId: 114,
              optionValue: '42',
            },
          ],
        }),
      )
      .thenReturn({
        data: {
          validateProduct: {
            responseType: 'SUCCESS',
            message: '',
            errorCode: '',
          },
        },
      });

    server.use(
      graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [productSearchResult],
          },
        }),
      ),
      graphql.query('getQuoteExtraFields', () =>
        HttpResponse.json(buildQuoteExtraFieldsWith('WHATEVER_VALUES')),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    vitest.mocked(useParams).mockReturnValue({ id: '99999' });

    renderWithProviders(<QuoteDetail />, {
      preloadedState: {
        ...preloadedState,
        global: buildGlobalStateWith({
          backorderEnabled: true,
        }),
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Product with Required Modifiers')).toBeVisible();
    expect(screen.getByText('Custom Message: Test Message')).toBeVisible();
    expect(screen.getByText('Size: Large')).toBeVisible();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('when "Proceed to checkout" button is clicked', () => {
    beforeEach(() => {
      server.use(
        graphql.query('SearchProducts', () =>
          HttpResponse.json(
            buildProductSearchResponseWith({
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
                responseType: 'SUCCESS',
                message: 'Product is valid',
              },
            },
          }),
        ),
        graphql.query('getStorefrontProductSettings', () =>
          HttpResponse.json({
            data: {
              storefrontProductSettings: {
                hidePriceFromGuests: false,
              },
            },
          }),
        ),
        graphql.mutation('CheckoutQuote', () =>
          HttpResponse.json({
            data: {
              quoteCheckout: {
                quoteCheckout: {
                  checkoutUrl:
                    'https://my-store/cart.php?action=loadInCheckout&id=123&token=1234567889&isFromQuote=Y',
                  cartId: '123',
                  cartUrl: 'https://my-store/cart.php?action=load&id=123&token=1234567889',
                },
              },
            },
          }),
        ),
      );

      vitest.mocked(useParams).mockReturnValue({ id: '272989' });
    });
    describe('given the quote has uuid', () => {
      it('sets all the session storage for checkout', async () => {
        const id = '272989';
        const uuid = 'lsd-g';
        const dateString = Date.now().toString();
        const quote = buildQuoteWith({
          data: {
            quote: {
              id,
              uuid,
              quoteNumber: '911911',
              status: 2,
              allowCheckout: true,
              productsList: [buildQuoteProductWith({ productId: '123' })],
            },
          },
        });
        server.use(graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)));
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
            },
          },
          initialEntries: [`/272989?uuid=${uuid}&date=${dateString}`],
        });
        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

        const checkoutButton = screen.getByRole('button', { name: 'Proceed to checkout' });
        await userEvent.click(checkoutButton);
        expect(sessionStorage.getItem('quoteCheckoutUuid')).toEqual(uuid);
        expect(sessionStorage.getItem('isNewStorefront')).toEqual(JSON.stringify(true));
        expect(sessionStorage.getItem('quoteCheckoutId')).toEqual(id);
        expect(sessionStorage.getItem('quoteDate')).toEqual(dateString);
      });
    });

    describe("given the legacy quote which doesn't have uuid", () => {
      it('sets all the session storage for checkout', async () => {
        const id = '272989';
        const dateString = Date.now().toString();
        const quote = buildQuoteWith({
          data: {
            quote: {
              id,
              quoteNumber: '911911',
              status: 2,
              allowCheckout: true,
              productsList: [buildQuoteProductWith({ productId: '123' })],
            },
          },
        });
        server.use(graphql.query('GetQuoteInfoB2B', () => HttpResponse.json(quote)));
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
            },
          },
          initialEntries: [`/272989?date=${dateString}`],
        });
        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
        const checkoutButton = screen.getByRole('button', { name: 'Proceed to checkout' });
        await userEvent.click(checkoutButton);
        expect(sessionStorage.getItem('quoteCheckoutUuid')).toEqual('');
        expect(sessionStorage.getItem('isNewStorefront')).toEqual(JSON.stringify(true));
        expect(sessionStorage.getItem('quoteCheckoutId')).toEqual(id);
        expect(sessionStorage.getItem('quoteDate')).toEqual(dateString);
      });
    });
  });
});
