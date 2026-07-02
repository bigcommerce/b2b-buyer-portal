import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { set } from 'lodash-es';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  bulk,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  stringContainingAll,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { AddressConfig } from '@/shared/service/b2b/graphql/address';
import { CustomerOrderStatues, CustomerOrderStatus } from '@/shared/service/b2b/graphql/orders';
import type { GetOrderDetailResponse, Order } from '@/shared/service/bc/graphql/orders';
import { OrderHistoryEventType } from '@/shared/service/bc/graphql/orders';
import { useAppDispatch } from '@/store';
import { setCurrencies } from '@/store/slices/storeConfigs';
import { Currency, CustomerRole } from '@/types';

import { DigitalDownloadElementsResponse } from './components/getDigitalDownloadElements';
import OrderDetails from '.';

vi.mock('react-router-dom');

const { server } = startMockServer();

const buildOrderStatusWith = builder<CustomerOrderStatus>(() => ({
  statusCode: faker.number.int().toString(),
  systemLabel: faker.word.noun(),
  customLabel: faker.word.noun(),
}));

const buildCustomerOrderStatusesWith = builder<CustomerOrderStatues>(() => ({
  data: {
    bcOrderStatuses: bulk(buildOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

const buildAddressConfigWith = builder<AddressConfig>(() => ({
  key: [faker.word.noun(), faker.word.noun()].join('_'),
  isEnabled: faker.helpers.arrayElement(['0', '1']),
}));

const buildAddressConfigResponseWith = builder(() => {
  const n = faker.number.int({ min: 1, max: 5 });
  return {
    data: {
      addressConfig: bulk(buildAddressConfigWith, 'WHATEVER_VALUES').times(n),
    },
  };
});

const buildCurrencyWith = builder<Currency>(() => ({
  id: faker.string.uuid(),
  is_default: true,
  last_updated: faker.date.past().toUTCString(),
  country_iso2: 'US',
  default_for_country_codes: ['USD'],
  currency_code: 'USD',
  currency_exchange_rate: '1.0000000000',
  name: 'United States Dollar',
  token: '$',
  auto_update: false,
  decimal_token: '.',
  decimal_places: 2,
  enabled: true,
  is_transactional: true,
  token_location: 'left',
  thousands_token: ',',
}));

const buildUnifiedOrderWith = builder<Order>(() => ({
  entityId: faker.number.int({ min: 1000, max: 99999 }),
  orderedAt: { utc: faker.date.past().toISOString() },
  updatedAt: { utc: faker.date.past().toISOString() },
  status: { value: 'PENDING', label: 'Pending' },
  billingAddress: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    company: faker.company.name(),
    address1: faker.location.streetAddress(),
    address2: null,
    city: faker.location.city(),
    stateOrProvince: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: faker.location.country(),
    countryCode: faker.location.countryCode(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
  },
  subTotal: { currencyCode: 'USD', value: 100 },
  discountedSubTotal: null,
  shippingCostTotal: { currencyCode: 'USD', value: 0 },
  handlingCostTotal: { currencyCode: 'USD', value: 0 },
  wrappingCostTotal: { currencyCode: 'USD', value: 0 },
  taxTotal: { currencyCode: 'USD', value: 0 },
  totalIncTax: { currencyCode: 'USD', value: 100 },
  isTaxIncluded: false,
  taxes: [],
  discounts: {
    couponDiscounts: [],
    nonCouponDiscountTotal: { currencyCode: 'USD', value: 0 },
    totalDiscount: null,
  },
  customerMessage: null,
  totalProductQuantity: 0,
  consignments: null,
  reference: null,
  poNumber: null,
  company: null,
  placedBy: null,
  history: [],
  quote: null,
  invoice: null,
  extraFields: [],
}));

const buildOrderDetailResponseWith = builder<GetOrderDetailResponse>(() => ({
  data: {
    site: {
      order: buildUnifiedOrderWith('WHATEVER_VALUES'),
    },
  },
}));

const buildDigitalProductNodeWith = builder<DigitalDownloadElementsResponse>(() => ({
  data: {
    site: {
      order: {
        consignments: {
          downloads: [
            {
              lineItems: {
                edges: [
                  {
                    node: {
                      downloadFileUrls: [faker.internet.url(), faker.internet.url()],
                      downloadPageUrl: faker.internet.url(),
                      name: faker.commerce.productName(),
                      productEntityId: faker.number.int(),
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
}));

const buildCustomerShoppingListNodeWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    updatedAt: Math.floor(faker.date.recent().getTime() / 1000),
    products: {
      totalCount: faker.number.int({ min: 0, max: 10 }),
    },
  },
}));

const buildCustomerShoppingListResponseWith = builder(() => {
  const totalCount = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      customerShoppingLists: {
        totalCount,
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildCustomerShoppingListNodeWith, 'WHATEVER_VALUES').times(totalCount),
      },
    },
  };
});

beforeEach(() => {
  set(window, 'b2b.callbacks.dispatchEvent', vi.fn());
});

function OrderDetailsWithCurrencyHydration({ currencies }: { currencies?: Currency[] }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!currencies) {
      return;
    }

    dispatch(
      setCurrencies({
        currencies,
        channelCurrencies: {
          channel_id: 1,
          enabled_currencies: currencies.map((currency) => currency.currency_code),
          default_currency: currencies[0]?.currency_code ?? 'USD',
        },
        enteredInclusiveTax: false,
      }),
    );
  }, [currencies, dispatch]);

  return <OrderDetails />;
}

const preloadedState = {
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.B2C },
  }),
  global: buildGlobalStateWith({
    backorderEnabled: false,
    featureFlags: {
      'B2B-4613.buyer_portal_unified_sf_gql_orders': true,
    },
  }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
};

describe('Order detail path with unified SF GQL flag ON', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: '6696' });

    server.use(
      graphql.query('GetOrderDetail', () =>
        HttpResponse.json(
          buildOrderDetailResponseWith({
            data: {
              site: {
                order: buildUnifiedOrderWith({
                  entityId: 6696,
                  status: { value: 'PENDING', label: 'Pending' },
                  reference: '',
                }),
              },
            },
          }),
        ),
      ),
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(
          buildCustomerOrderStatusesWith({
            data: {
              bcOrderStatuses: [
                buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                buildOrderStatusWith('WHATEVER_VALUES'),
              ],
            },
          }),
        ),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
    );
  });

  async function renderOrderDetails() {
    const view = renderWithProviders(<OrderDetails />, {
      preloadedState,
      initialEntries: [
        {
          state: {
            isCompanyOrder: false,
          },
        },
      ],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    return view;
  }

  it('renders the order header', async () => {
    await renderOrderDetails();

    expect(await screen.findByRole('heading', { name: /Order #6696/ })).toBeVisible();
    expect(screen.getByText('Pending')).toBeVisible();
  });

  it('can navigate back to the orders listing page', async () => {
    const view = await renderOrderDetails();

    await userEvent.click(screen.getByText('Back to orders'));

    expect(view.navigation).toHaveBeenCalledWith('/orders');
  });

  it('renders the order summary', async () => {
    const euro = buildCurrencyWith({
      country_iso2: 'DE',
      default_for_country_codes: ['EUR'],
      currency_code: 'EUR',
      currency_exchange_rate: '0.85',
      name: 'Euro',
      token: '€',
      decimal_token: ',',
      thousands_token: '.',
    });

    const euroOrder = buildUnifiedOrderWith({
      entityId: 6696,
      orderedAt: { utc: '2025-05-04T00:00:00.000Z' },
      placedBy: {
        entityId: 1,
        firstName: 'Mike',
        lastName: 'Wazowski',
        email: 'mike@monstersinc.com',
      },
      subTotal: { currencyCode: 'EUR', value: 102 },
      shippingCostTotal: { currencyCode: 'EUR', value: 332 },
      handlingCostTotal: { currencyCode: 'EUR', value: 22.2 },
      taxTotal: { currencyCode: 'EUR', value: 13.5 },
      // 102 + 332 + 22.2 − 37.93 + 13.5
      totalIncTax: { currencyCode: 'EUR', value: 431.77 },
      discounts: {
        couponDiscounts: [],
        nonCouponDiscountTotal: { currencyCode: 'EUR', value: 37.93 },
        totalDiscount: null,
      },
    });

    server.use(
      graphql.query('GetOrderDetail', () =>
        HttpResponse.json(
          buildOrderDetailResponseWith({
            data: { site: { order: euroOrder } },
          }),
        ),
      ),
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<OrderDetails />, {
      preloadedState: {
        ...preloadedState,
        storeConfigs: {
          currencies: {
            currencies: [euro],
            channelCurrencies: {
              channel_id: 1,
              enabled_currencies: ['EUR'],
              default_currency: 'EUR',
            },
            enteredInclusiveTax: false,
          },
        },
      },
      initialEntries: [{ state: { isCompanyOrder: false } }],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.getByRole('heading', { name: 'Summary' })).toBeVisible();
    expect(
      screen.getByText(
        new RegExp(
          `Purchased by ${euroOrder.placedBy!.firstName} ${euroOrder.placedBy!.lastName} on`,
        ),
      ),
    ).toBeVisible();

    expect(screen.getByRole('group', { name: 'Sub total' })).toHaveTextContent('€102,00');
    expect(screen.getByRole('group', { name: 'Shipping' })).toHaveTextContent('€332,00');
    expect(screen.getByRole('group', { name: 'Handling Fee' })).toHaveTextContent('€22,20');
    expect(screen.getByRole('group', { name: 'Tax' })).toHaveTextContent('€13,50');
    expect(screen.getByRole('group', { name: 'Discount amount' })).toHaveTextContent('-€37,93');
    expect(screen.getByRole('group', { name: 'Grand total' })).toHaveTextContent('€431,77');
  });

  it('updates currency formatting without refetching the order detail', async () => {
    const euro = buildCurrencyWith({
      country_iso2: 'DE',
      default_for_country_codes: ['EUR'],
      currency_code: 'EUR',
      currency_exchange_rate: '0.85',
      name: 'Euro',
      token: '€',
      decimal_token: ',',
      thousands_token: '.',
    });

    const euroOrder = buildUnifiedOrderWith({
      entityId: 6696,
      subTotal: { currencyCode: 'EUR', value: 102 },
      shippingCostTotal: { currencyCode: 'EUR', value: 332 },
      handlingCostTotal: { currencyCode: 'EUR', value: 22.2 },
      taxTotal: { currencyCode: 'EUR', value: 13.5 },
      totalIncTax: { currencyCode: 'EUR', value: 431.77 },
      discounts: {
        couponDiscounts: [],
        nonCouponDiscountTotal: { currencyCode: 'EUR', value: 37.93 },
        totalDiscount: null,
      },
    });

    let orderDetailRequestCount = 0;

    server.use(
      graphql.query('GetOrderDetail', () => {
        orderDetailRequestCount += 1;

        return HttpResponse.json(
          buildOrderDetailResponseWith({
            data: { site: { order: euroOrder } },
          }),
        );
      }),
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
    );

    const { result } = renderWithProviders(<OrderDetailsWithCurrencyHydration />, {
      preloadedState,
      initialEntries: [{ state: { isCompanyOrder: false } }],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.getByRole('group', { name: 'Sub total' })).toHaveTextContent('$102.00');
    expect(orderDetailRequestCount).toBe(1);

    result.rerender(<OrderDetailsWithCurrencyHydration currencies={[euro]} />);

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Sub total' })).toHaveTextContent('€102,00');
    });

    expect(orderDetailRequestCount).toBe(1);
  });

  it('omits the handling fee row when cost is zero', async () => {
    server.use(
      graphql.query('GetOrderDetail', () =>
        HttpResponse.json(
          buildOrderDetailResponseWith({
            data: {
              site: {
                order: buildUnifiedOrderWith({
                  handlingCostTotal: { currencyCode: 'USD', value: 0 },
                }),
              },
            },
          }),
        ),
      ),
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<OrderDetails />, {
      preloadedState,
      initialEntries: [{ state: { isCompanyOrder: false } }],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.queryByRole('group', { name: 'Handling Fee' })).not.toBeInTheDocument();
  });

  describe('when there is no order history', () => {
    it('does not render the order history section', async () => {
      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({
              data: {
                site: {
                  order: buildUnifiedOrderWith({
                    history: [],
                  }),
                },
              },
            }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.queryByRole('heading', { name: 'History' })).not.toBeInTheDocument();
    });
  });

  describe('when it is a Purchase Order (includes reference/poNumber)', () => {
    it('renders the poNumber in the header', async () => {
      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({
              data: {
                site: {
                  order: buildUnifiedOrderWith({
                    entityId: 6696,
                    poNumber: '3405',
                  }),
                },
              },
            }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'Order #6696, 3405' })).toBeVisible();
    });
  });

  it('shows the cross-company banner when the order belongs to a different company', async () => {
    server.use(
      graphql.query('GetOrderDetail', () =>
        HttpResponse.json(
          buildOrderDetailResponseWith({
            data: {
              site: {
                order: buildUnifiedOrderWith({
                  // Active company in Redux state is 100; order belongs to company 200
                  company: { entityId: 200, name: 'Other Company' },
                }),
              },
            },
          }),
        ),
      ),
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
    );

    const crossCompanyState = {
      ...preloadedState,
      company: buildCompanyStateWith({
        customer: { role: CustomerRole.ADMIN },
        companyInfo: { id: '100' },
      }),
      global: buildGlobalStateWith({
        featureFlags: {
          'B2B-4613.buyer_portal_unified_sf_gql_orders': true,
        },
      }),
    };

    renderWithProviders(<OrderDetails />, {
      preloadedState: crossCompanyState,
      initialEntries: [{ state: { isCompanyOrder: false } }],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(
      screen.getByText(
        'This order is related to another company. To reorder, add to a shopping list, or perform other actions, you need to switch to that company.',
      ),
    ).toBeVisible();
  });

  it('renders customer message comments', async () => {
    server.use(
      graphql.query('GetOrderDetail', () =>
        HttpResponse.json(
          buildOrderDetailResponseWith({
            data: {
              site: {
                order: buildUnifiedOrderWith({
                  customerMessage: 'Customer note: leave at reception\nPlease call before delivery',
                }),
              },
            },
          }),
        ),
      ),
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<OrderDetails />, {
      preloadedState,
      initialEntries: [{ state: { isCompanyOrder: false } }],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.getByRole('heading', { name: 'Comments' })).toBeVisible();
    expect(screen.getByText('Customer note: leave at reception')).toBeVisible();
    expect(screen.getByText('Comments: Please call before delivery')).toBeVisible();
  });

  describe('B2B-4826: shipments', () => {
    function buildShippedOrder(overrides: Partial<Order> = {}) {
      return buildUnifiedOrderWith({
        entityId: 6696,
        status: { value: 'SHIPPED', label: 'Shipped' },
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: 'Acme Corp',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 15 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: 4001,
                          sku: 'WIDGET-A',
                          brand: 'WidgetCo',
                          name: 'Premium Widget',
                          quantity: 3,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 75 },
                          image: { url: 'https://example.com/widget.jpg' },
                          baseCatalogProduct: { path: '/widget/' },
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: {
                    edges: [
                      {
                        node: {
                          entityId: 5001,
                          shippedAt: { utc: '2026-05-15T10:00:00Z' },
                          shippingMethodName: 'Standard Shipping',
                          shippingProviderName: 'FedEx',
                          tracking: {
                            number: '1Z999AA10123456784',
                            url: 'https://fedex.com/track/1Z999AA10123456784',
                          },
                          items: [{ lineItemId: 2001, quantity: 3 }],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          downloads: null,
        },
        payments: [{ description: 'Credit Card' }],
        ...overrides,
      });
    }

    function setupServerWithOrder(order: Order) {
      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(
            buildCustomerOrderStatusesWith({
              data: {
                bcOrderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Shipped', customLabel: 'Shipped' }),
                ],
              },
            }),
          ),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );
    }

    async function renderAndWait() {
      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });
      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));
    }

    it('renders a shipped products section with tracking', async () => {
      setupServerWithOrder(buildShippedOrder());
      await renderAndWait();

      expect(await screen.findByText(/Shipment/)).toBeVisible();
      expect(screen.getByText(/FedEx/)).toBeVisible();
      expect(screen.getByText('1Z999AA10123456784')).toBeVisible();
      expect(screen.getByText('Premium Widget')).toBeVisible();
    });

    it('renders the shipping address', async () => {
      setupServerWithOrder(buildShippedOrder());
      await renderAndWait();

      expect(await screen.findByText(/Jane Doe/)).toBeVisible();
      expect(screen.getByText(/123 Main St/)).toBeVisible();
    });

    it('renders a not-shipped products section when no shipments exist', async () => {
      const unshippedOrder = buildShippedOrder({
        status: { value: 'PENDING', label: 'Pending' },
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: 'Acme Corp',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 15 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: 4001,
                          sku: 'WIDGET-A',
                          brand: 'WidgetCo',
                          name: 'Unshipped Widget',
                          quantity: 2,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 50 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
      });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({ data: { site: { order: unshippedOrder } } }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(
            buildCustomerOrderStatusesWith({
              data: {
                bcOrderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                ],
              },
            }),
          ),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      await renderAndWait();

      expect(await screen.findByText('Not shipped yet')).toBeVisible();
      expect(screen.getByText('Unshipped Widget')).toBeVisible();
    });

    it('renders multiple shipping addresses', async () => {
      const multiAddressOrder = buildShippedOrder({
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: 'Acme Corp',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 10 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: 4001,
                          sku: 'W-A',
                          brand: null,
                          name: 'Widget A',
                          quantity: 1,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 25 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: { edges: [] },
                },
              },
              {
                cursor: 'sc2',
                node: {
                  entityId: 1002,
                  shippingAddress: {
                    firstName: 'Bob',
                    lastName: 'Smith',
                    company: 'Acme Corp',
                    address1: '456 Oak Ave',
                    address2: 'Suite 200',
                    city: 'Dallas',
                    stateOrProvince: 'TX',
                    postalCode: '75201',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 12 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2002,
                          productEntityId: 3002,
                          variantEntityId: 4002,
                          sku: 'W-B',
                          brand: null,
                          name: 'Widget B',
                          quantity: 2,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 50 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
      });

      setupServerWithOrder(multiAddressOrder);
      await renderAndWait();

      expect(await screen.findByText(/Jane Doe/)).toBeVisible();
      expect(screen.getByText(/Bob Smith/)).toBeVisible();
      expect(screen.getByText(/123 Main St/)).toBeVisible();
      expect(screen.getByText(/456 Oak Ave/)).toBeVisible();
    });

    it('renders both shipped and not-shipped sections for a partial shipment', async () => {
      const partialOrder = buildShippedOrder({
        status: { value: 'PARTIALLY_SHIPPED', label: 'Partially Shipped' },
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: 'Acme Corp',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 15 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: 4001,
                          sku: 'WIDGET-A',
                          brand: 'WidgetCo',
                          name: 'Partially Shipped Widget',
                          quantity: 5,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 125 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: {
                    edges: [
                      {
                        node: {
                          entityId: 5001,
                          shippedAt: { utc: '2026-05-15T10:00:00Z' },
                          shippingMethodName: 'Standard Shipping',
                          shippingProviderName: 'FedEx',
                          tracking: {
                            number: 'PARTIAL-TRACK-001',
                            url: 'https://fedex.com/track/PARTIAL-TRACK-001',
                          },
                          items: [{ lineItemId: 2001, quantity: 2 }],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          downloads: null,
        },
      });

      setupServerWithOrder(partialOrder);
      await renderAndWait();

      expect(await screen.findByText(/Shipment/)).toBeVisible();
      expect(screen.getByText('PARTIAL-TRACK-001')).toBeVisible();
      expect(screen.getByText('Not shipped yet')).toBeVisible();
      // Product appears in both shipped and not-shipped sections
      expect(screen.getAllByText('Partially Shipped Widget')).toHaveLength(2);
    });

    it('renders multiple shipments for different line items in the same consignment', async () => {
      const multiShipmentOrder = buildShippedOrder({
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: 'Acme Corp',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 20 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: 4001,
                          sku: 'W-A',
                          brand: null,
                          name: 'Widget Alpha',
                          quantity: 3,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 75 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                      {
                        node: {
                          entityId: 2002,
                          productEntityId: 3002,
                          variantEntityId: 4002,
                          sku: 'W-B',
                          brand: null,
                          name: 'Widget Beta',
                          quantity: 4,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 100 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: {
                    edges: [
                      {
                        node: {
                          entityId: 5001,
                          shippedAt: { utc: '2026-05-10T10:00:00Z' },
                          shippingMethodName: 'Standard Shipping',
                          shippingProviderName: 'FedEx',
                          tracking: {
                            number: 'MULTI-TRACK-001',
                            url: 'https://fedex.com/track/MULTI-TRACK-001',
                          },
                          items: [{ lineItemId: 2001, quantity: 3 }],
                        },
                      },
                      {
                        node: {
                          entityId: 5002,
                          shippedAt: { utc: '2026-05-12T14:00:00Z' },
                          shippingMethodName: 'Express Shipping',
                          shippingProviderName: 'UPS',
                          tracking: {
                            number: 'MULTI-TRACK-002',
                            url: 'https://ups.com/track/MULTI-TRACK-002',
                          },
                          items: [{ lineItemId: 2002, quantity: 2 }],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          downloads: null,
        },
      });

      setupServerWithOrder(multiShipmentOrder);
      await renderAndWait();

      expect(await screen.findByText('MULTI-TRACK-001')).toBeVisible();
      expect(screen.getByText('MULTI-TRACK-002')).toBeVisible();
      expect(screen.getByText('Widget Alpha')).toBeVisible();
      // Widget Beta appears in both shipped and not-shipped sections (2 of 4 shipped)
      expect(screen.getAllByText('Widget Beta')).toHaveLength(2);
      expect(screen.getByText('Not shipped yet')).toBeVisible();
    });
  });

  describe('B2B-4826: payment details', () => {
    it('renders payment details for a paid-in-full order', async () => {
      const paidOrder = buildUnifiedOrderWith({
        entityId: 6696,
        reference: null,
        orderedAt: { utc: '2026-05-01T12:00:00Z' },
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: '',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 0 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: null,
                          sku: 'SKU1',
                          brand: null,
                          name: 'Test Product',
                          quantity: 1,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 100 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
        payments: [{ description: 'Visa ending in 1234' }],
      });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order: paidOrder } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'Payment' })).toBeVisible();
      expect(screen.getByText(/Paid in full/)).toBeVisible();
      expect(screen.getByText(/Visa ending in 1234/)).toBeVisible();
    });

    it('renders payment details for a Purchase Order', async () => {
      const poOrder = buildUnifiedOrderWith({
        entityId: 6696,
        poNumber: 'PO-2026-001',
        orderedAt: { utc: '2026-05-01T12:00:00Z' },
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: '',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 0 },
                  lineItems: {
                    edges: [
                      {
                        node: {
                          entityId: 2001,
                          productEntityId: 3001,
                          variantEntityId: null,
                          sku: 'SKU1',
                          brand: null,
                          name: 'Test Product',
                          quantity: 1,
                          productOptions: [],
                          subTotalListPrice: { currencyCode: 'USD', value: 100 },
                          image: null,
                          baseCatalogProduct: null,
                          returnableQuantity: 0,
                        },
                      },
                    ],
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
        payments: [{ description: 'Purchase Order' }],
      });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order: poOrder } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'Payment' })).toBeVisible();
      expect(screen.getByText(/PO Submitted/)).toBeVisible();
    });
  });

  describe('when there are order history events', () => {
    it('renders the order history section', async () => {
      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({
              data: {
                site: {
                  order: buildUnifiedOrderWith({
                    history: [
                      {
                        id: '1',
                        eventType: OrderHistoryEventType.ORDER_CREATED,
                        status: 'Pending',
                        source: null,
                        createdBy: null,
                        details: null,
                        createdAt: '2025-05-01T03:44:00.000Z',
                      },
                      {
                        id: '2',
                        eventType: OrderHistoryEventType.ORDER_UPDATED,
                        status: 'Shipped',
                        source: null,
                        createdBy: null,
                        details: null,
                        createdAt: '2025-05-04T07:22:00.000Z',
                      },
                    ],
                  }),
                },
              },
            }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(
            buildCustomerOrderStatusesWith({
              data: {
                bcOrderStatuses: [
                  buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'Pending' }),
                  buildOrderStatusWith({ systemLabel: 'Shipped', customLabel: 'Shipped' }),
                ],
              },
            }),
          ),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'History' })).toBeVisible();

      const table = screen.getByRole('table');
      expect(within(table).getByRole('columnheader', { name: 'Date' })).toBeVisible();
      expect(within(table).getByRole('columnheader', { name: 'Status' })).toBeVisible();

      const pendingRow = within(within(table).getByRole('row', { name: /Pending/ }));
      expect(pendingRow.getByRole('cell', { name: 'Pending' })).toBeVisible();
      expect(pendingRow.getByRole('cell', { name: 'May 1 2025 @ 3:44 AM' })).toBeVisible();

      const shippedRow = within(within(table).getByRole('row', { name: /Shipped/ }));
      expect(shippedRow.getByRole('cell', { name: 'Shipped' })).toBeVisible();
      expect(shippedRow.getByRole('cell', { name: 'May 4 2025 @ 7:22 AM' })).toBeVisible();
    });
  });

  describe('B2B-4826: digital products', () => {
    function buildOrderWithDigitalProducts(
      digitalItems: Array<{
        entityId: number;
        productEntityId: number;
        name: string;
        quantity: number;
        productOptions: Array<{ name: string; value: string }>;
        subTotalListPrice: { currencyCode: string; value: number };
      }>,
      physicalConsignment?: Order['consignments'],
    ) {
      const downloads = {
        edges: [
          {
            cursor: 'dc1',
            node: {
              entityId: 9001,
              lineItems: {
                edges: digitalItems.map((item) => ({ node: item })),
              },
            },
          },
        ],
      };

      const shipping = physicalConsignment?.shipping ?? { edges: [] };

      return buildUnifiedOrderWith({
        entityId: 6696,
        consignments: {
          shipping,
          downloads,
        },
      });
    }

    const euro = buildCurrencyWith({
      country_iso2: 'DE',
      default_for_country_codes: ['EUR'],
      currency_code: 'EUR',
      currency_exchange_rate: '0.85',
      name: 'Euro',
      token: '€',
      decimal_token: ',',
      thousands_token: '.',
    });

    const euroPreloadedState = {
      ...preloadedState,
      storeConfigs: {
        currencies: {
          currencies: [euro],
          channelCurrencies: {
            channel_id: 1,
            enabled_currencies: ['EUR'],
            default_currency: 'EUR',
          },
          enteredInclusiveTax: false,
        },
      },
    };

    it('renders a digital products section', async () => {
      const digitalOrder = buildOrderWithDigitalProducts([
        {
          entityId: 5001,
          productEntityId: 3001,
          name: 'Scare Floor Operations Manual (eBook)',
          quantity: 112,
          productOptions: [{ name: 'Format', value: 'ePub' }],
          subTotalListPrice: { currencyCode: 'EUR', value: 2502.08 },
        },
      ]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({ data: { site: { order: digitalOrder } } }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState: euroPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(await screen.findByText('Digital products')).toBeVisible();
      expect(screen.getByText('Scare Floor Operations Manual (eBook)')).toBeVisible();
      expect(screen.getByText('112')).toBeVisible();
      expect(screen.getByText('Format: ePub')).toBeVisible();
    });

    it('displays the view files link for digital products in an order', async () => {
      const digitalOrder = buildOrderWithDigitalProducts([
        {
          entityId: 5001,
          productEntityId: 1234,
          name: 'Digital Product',
          quantity: 1,
          productOptions: [],
          subTotalListPrice: { currencyCode: 'USD', value: 10 },
        },
      ]);

      const digitalDownloadElements = buildDigitalProductNodeWith({
        data: {
          site: {
            order: {
              consignments: {
                downloads: [
                  {
                    lineItems: {
                      edges: [
                        {
                          node: {
                            name: '',
                            downloadPageUrl: '',
                            downloadFileUrls: ['cat.com', 'meow.com'],
                            productEntityId: 1234,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({ data: { site: { order: digitalOrder } } }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetDigitalDownloadLinks', () => HttpResponse.json(digitalDownloadElements)),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(await screen.findByText('Digital products')).toBeVisible();
      expect(await screen.findByText('View files')).toBeVisible();
      await userEvent.click(await screen.findByText('View files'));

      expect(screen.getByText('Files to download')).toBeVisible();

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(2);
      });
    });

    it('does not render the view files link for physical products and digital products with no file in an order', async () => {
      const physicalConsignment: Order['consignments'] = {
        shipping: {
          edges: [
            {
              cursor: 'sc1',
              node: {
                entityId: 1001,
                shippingAddress: {
                  firstName: 'Jane',
                  lastName: 'Doe',
                  company: '',
                  address1: '123 Main St',
                  address2: null,
                  city: 'Austin',
                  stateOrProvince: 'TX',
                  postalCode: '73301',
                  country: 'United States',
                  countryCode: 'US',
                  phone: null,
                  email: null,
                },
                shippingCost: { currencyCode: 'USD', value: 0 },
                lineItems: {
                  edges: [
                    {
                      node: {
                        entityId: 2001,
                        productEntityId: 3001,
                        variantEntityId: 4001,
                        sku: 'PHONE-1',
                        brand: null,
                        name: 'Phone',
                        quantity: 2,
                        productOptions: [],
                        subTotalListPrice: { currencyCode: 'USD', value: 200 },
                        image: null,
                        baseCatalogProduct: null,
                        returnableQuantity: 0,
                      },
                    },
                  ],
                },
                shipments: { edges: [] },
              },
            },
          ],
        },
        downloads: {
          edges: [
            {
              cursor: 'dc1',
              node: {
                entityId: 9001,
                lineItems: {
                  edges: [
                    {
                      node: {
                        entityId: 5001,
                        productEntityId: 3002,
                        name: 'How to meow',
                        quantity: 1,
                        productOptions: [],
                        subTotalListPrice: { currencyCode: 'USD', value: 10 },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      };

      const orderWithBoth = buildUnifiedOrderWith({
        entityId: 6696,
        consignments: physicalConsignment,
      });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(
            buildOrderDetailResponseWith({ data: { site: { order: orderWithBoth } } }),
          ),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(await screen.findByText('Phone')).toBeVisible();
      expect(await screen.findByText('How to meow')).toBeVisible();
      expect(screen.queryByText('View files')).not.toBeInTheDocument();
    });
  });

  describe('B2B-4826: reorder — frontend validation', () => {
    function buildUnifiedOrderWithProducts(
      products: Array<{
        entityId: number;
        productEntityId: number;
        variantEntityId: number | null;
        name: string;
        quantity: number;
        productOptions: Array<{ name: string; value: string }>;
      }>,
    ) {
      return buildUnifiedOrderWith({
        entityId: 6696,
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: '',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 0 },
                  lineItems: {
                    edges: products.map((p) => ({
                      node: {
                        entityId: p.entityId,
                        productEntityId: p.productEntityId,
                        variantEntityId: p.variantEntityId,
                        sku: `SKU-${p.productEntityId}`,
                        brand: null,
                        name: p.name,
                        quantity: p.quantity,
                        productOptions: p.productOptions,
                        subTotalListPrice: { currencyCode: 'USD', value: p.quantity * 10 },
                        image: null,
                        baseCatalogProduct: null,
                        returnableQuantity: 0,
                      },
                    })),
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
      });
    }

    it('can re-order a single product', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [{ name: 'Color', value: 'bar' }],
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);
      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      createCartSimple.mockReturnValue({
        data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } },
      });

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      expect(within(dialog).getByText('Select products and quantity for reorder')).toBeVisible();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(createCartSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          createCartInput: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                quantity: 1,
                productEntityId: 3002,
                variantEntityId: 4002,
              }),
            ]),
          }),
        }),
      );

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('can adjust the quantity of a product', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct]);
      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      createCartSimple.mockReturnValue({
        data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } },
      });

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      expect(within(dialog).getByText('Select products and quantity for reorder')).toBeVisible();

      const productGroup = within(dialog).getByRole('group', { name: 'Scream Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.type(within(productGroup).getByRole('spinbutton'), '2', {
        initialSelectionStart: 0,
        initialSelectionEnd: 1,
      });

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(createCartSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          createCartInput: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                productEntityId: 3001,
                variantEntityId: 4001,
              }),
            ]),
          }),
        }),
      );

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('can re-order all products in one go', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);
      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      createCartSimple.mockReturnValue({
        data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } },
      });

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const checkboxes = await screen.findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(createCartSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          createCartInput: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                productEntityId: 3001,
                variantEntityId: 4001,
              }),
              expect.objectContaining({
                quantity: 1,
                productEntityId: 3002,
                variantEntityId: 4002,
              }),
            ]),
          }),
        }),
      );

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('can independently select products that share variant_id 0', async () => {
      const simpleProductA = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: null,
        name: 'Gift Card $50',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const simpleProductB = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: null,
        name: 'Gift Card $100',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([simpleProductA, simpleProductB]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      const giftCard50 = within(dialog).getByRole('group', { name: 'Gift Card $50' });
      const giftCard100 = within(dialog).getByRole('group', { name: 'Gift Card $100' });

      await userEvent.click(within(giftCard50).getByRole('checkbox'));

      expect(within(giftCard50).getByRole('checkbox')).toBeChecked();
      expect(within(giftCard100).getByRole('checkbox')).not.toBeChecked();
    });

    it('shows a warning if no product is selected', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Please select at least one item')).toBeVisible();
      });
    });
  });

  describe('B2B-4826: reorder — backend validation', () => {
    const backorderPreloadedState = {
      company: buildCompanyStateWith({
        customer: { role: CustomerRole.B2C },
      }),
      global: buildGlobalStateWith({
        backorderEnabled: true,
        featureFlags: {
          'B2B-4613.buyer_portal_unified_sf_gql_orders': true,
          'BACK-134.backorders_phase_1_1_control_messaging_on_storefront': true,
        },
      }),
      storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
    };

    function buildUnifiedOrderWithProducts(
      products: Array<{
        entityId: number;
        productEntityId: number;
        variantEntityId: number | null;
        name: string;
        quantity: number;
        productOptions: Array<{ name: string; value: string }>;
      }>,
    ) {
      return buildUnifiedOrderWith({
        entityId: 6696,
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: '',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 0 },
                  lineItems: {
                    edges: products.map((p) => ({
                      node: {
                        entityId: p.entityId,
                        productEntityId: p.productEntityId,
                        variantEntityId: p.variantEntityId,
                        sku: `SKU-${p.productEntityId}`,
                        brand: null,
                        name: p.name,
                        quantity: p.quantity,
                        productOptions: p.productOptions,
                        subTotalListPrice: { currencyCode: 'USD', value: p.quantity * 10 },
                        image: null,
                        baseCatalogProduct: null,
                        returnableQuantity: 0,
                      },
                    })),
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
      });
    }

    it('can re-order a single product', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [{ name: 'Color', value: 'bar' }],
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);
      const createCartSimple = vi.fn();

      const validateProducts = when(vi.fn())
        .calledWith({
          productId: 123,
          variantId: 456,
          quantity: 1,
          productOptions: [{ optionId: 0, optionValue: 'bar' }],
          target: 'CART',
        })
        .thenReturn({
          data: {
            validateProduct: {
              responseType: 'SUCCESS',
              message: '',
            },
          },
        });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
        graphql.query('ValidateProduct', ({ variables }) =>
          HttpResponse.json(validateProducts(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 1,
                productEntityId: 123,
                variantEntityId: 456,
                selectedOptions: {
                  multipleChoices: [],
                  textFields: [{ optionEntityId: 0, text: 'bar' }],
                },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      expect(within(dialog).getByText('Select products and quantity for reorder')).toBeVisible();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('displays an error message when all products fail validation', async () => {
      const laughProduct = {
        entityId: 2001,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([laughProduct]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('ValidateProduct', () =>
          HttpResponse.json({
            data: {
              validateProduct: {
                errorCode: 'OOS',
                responseType: 'ERROR',
                message: 'A message from the backend',
                product: { availableToSell: 5 },
              },
            },
          }),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      await userEvent.click(within(dialog).getAllByRole('checkbox')[0]); // Select all checkbox

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(
          screen.getByText('Some items were not added to the cart. Please adjust quantities.'),
        ).toBeVisible();
      });

      expect(within(dialog).getByText('Only 5 available')).toBeVisible();

      expect(window.b2b.callbacks.dispatchEvent).not.toHaveBeenCalled();
    });

    it('displays an error when a network error occurs', async () => {
      const laughProduct = {
        entityId: 2001,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([laughProduct]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('ValidateProduct', () => HttpResponse.error()),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      await userEvent.click(within(dialog).getAllByRole('checkbox')[0]); // Select all checkbox

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'There was an issue with adding products to the cart. Please check the errors below.',
          ),
        ).toBeVisible();
      });

      expect(within(dialog).getByText('Add failed, try again.')).toBeVisible();
    });

    it('can adjust the quantity of a product', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Scream Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct]);
      const createCartSimple = vi.fn();

      const validateProducts = when(vi.fn())
        .calledWith({
          productId: 123,
          variantId: 456,
          quantity: 2,
          productOptions: [],
          target: 'CART',
        })
        .thenReturn({
          data: {
            validateProduct: {
              responseType: 'SUCCESS',
              message: '',
            },
          },
        });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
        graphql.query('ValidateProduct', ({ variables }) =>
          HttpResponse.json(validateProducts(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 2,
                productEntityId: 123,
                variantEntityId: 456,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      expect(within(dialog).getByText('Select products and quantity for reorder')).toBeVisible();

      const productGroup = within(dialog).getByRole('group', { name: 'Scream Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.type(within(productGroup).getByRole('spinbutton'), '2', {
        initialSelectionStart: 0,
        initialSelectionEnd: 1,
      });

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('can re-order all products in one go', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);
      const createCartSimple = vi.fn();

      const validateProducts = when(vi.fn())
        .calledWith({
          productId: 3002,
          variantId: 4002,
          quantity: 1,
          productOptions: [],
          target: 'CART',
        })
        .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

      when(validateProducts)
        .calledWith({
          productId: 3001,
          variantId: 4001,
          quantity: 2,
          productOptions: [],
          target: 'CART',
        })
        .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
        graphql.query('ValidateProduct', ({ variables }) =>
          HttpResponse.json(validateProducts(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 2,
                productEntityId: 3001,
                variantEntityId: 4001,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
              {
                quantity: 1,
                productEntityId: 3002,
                variantEntityId: 4002,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      await userEvent.click(screen.getAllByRole('checkbox')[0]); // Select all checkbox

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('handles partial cart updates', async () => {
      const productWithErrorDef = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Product with Error',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const productWithWarningDef = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Product with Warning',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProductDef = {
        entityId: 2003,
        productEntityId: 3003,
        variantEntityId: 4003,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([
        productWithErrorDef,
        productWithWarningDef,
        laughProductDef,
      ]);

      const createCartSimple = vi.fn().mockReturnValue({
        data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } },
      });

      const validateProductHandler = vi
        .fn()
        .mockImplementation((variables: { productId: number }) => {
          if (variables.productId === 3001) {
            return {
              data: {
                validateProduct: {
                  responseType: 'ERROR',
                  message: 'An error message from the backend',
                  errorCode: 'VALIDATION_ERROR',
                  product: { availableToSell: 0 },
                },
              },
            };
          }
          if (variables.productId === 3002) {
            return {
              data: {
                validateProduct: {
                  responseType: 'WARNING',
                  message: 'A warning message from the backend',
                },
              },
            };
          }
          return { data: { validateProduct: { responseType: 'SUCCESS', message: '' } } };
        });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
        graphql.query('ValidateProduct', ({ variables }) =>
          HttpResponse.json(validateProductHandler(variables)),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      const checkboxes = await within(dialog).findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('1 Product was added to the cart.')).toBeVisible();
      });

      await waitFor(() => {
        expect(
          screen.getByText('Some items were not added to the cart. Please adjust quantities.'),
        ).toBeVisible();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });

      expect(dialog).toBeVisible();

      const groupWithError = within(dialog).getByRole('group', { name: 'Product with Error' });

      expect(within(groupWithError).getByRole('checkbox')).toBeChecked();
      expect(within(groupWithError).getByText('An error message from the backend')).toBeVisible();

      const groupWithWarning = within(dialog).getByRole('group', {
        name: 'Product with Warning',
      });
      expect(within(groupWithWarning).getByRole('checkbox')).toBeChecked();
      expect(
        within(groupWithWarning).getByText('A warning message from the backend'),
      ).toBeVisible();

      const groupWithLaughCanister = within(dialog).getByRole('group', {
        name: 'Laugh Canister',
      });
      expect(within(groupWithLaughCanister).getByRole('checkbox')).not.toBeChecked();
    });

    it('shows a warning if no product is selected', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState: backorderPreloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Please select at least one item')).toBeVisible();
      });
    });
  });

  describe('B2B-4826: add to shopping list', () => {
    function buildUnifiedOrderWithProducts(
      products: Array<{
        entityId: number;
        productEntityId: number;
        variantEntityId: number | null;
        name: string;
        quantity: number;
        productOptions: Array<{ name: string; value: string }>;
      }>,
    ) {
      return buildUnifiedOrderWith({
        entityId: 6696,
        consignments: {
          shipping: {
            edges: [
              {
                cursor: 'sc1',
                node: {
                  entityId: 1001,
                  shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    company: '',
                    address1: '123 Main St',
                    address2: null,
                    city: 'Austin',
                    stateOrProvince: 'TX',
                    postalCode: '73301',
                    country: 'United States',
                    countryCode: 'US',
                    phone: null,
                    email: null,
                  },
                  shippingCost: { currencyCode: 'USD', value: 0 },
                  lineItems: {
                    edges: products.map((p) => ({
                      node: {
                        entityId: p.entityId,
                        productEntityId: p.productEntityId,
                        variantEntityId: p.variantEntityId,
                        sku: `SKU-${p.productEntityId}`,
                        brand: null,
                        name: p.name,
                        quantity: p.quantity,
                        productOptions: p.productOptions,
                        subTotalListPrice: { currencyCode: 'USD', value: p.quantity * 10 },
                        image: null,
                        baseCatalogProduct: null,
                        returnableQuantity: 0,
                      },
                    })),
                  },
                  shipments: { edges: [] },
                },
              },
            ],
          },
          downloads: null,
        },
      });
    }

    it('can add a single product to an existing shopping list', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 2,
        productOptions: [{ name: 'Color', value: 'bar' }],
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      const addItemsToCustomerShoppingList = vi.fn();

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(
            buildCustomerShoppingListResponseWith({
              data: { customerShoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ variables })),
        ),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 2,
                  optionList: expect.arrayContaining([
                    expect.objectContaining({
                      optionId: 'attribute[0]',
                      optionValue: 'bar',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      expect(
        within(dialog).getByText('Select products and quantity to add to shopping list'),
      ).toBeVisible();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(await screen.findByRole('button', { name: 'Add to shopping list' }));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeVisible();
      });
    });

    it('can add a product to a new shopping list', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 2,
        productOptions: [{ name: 'Color', value: 'bar' }],
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      const addItemsToCustomerShoppingList = vi.fn();
      const getCustomerShoppingLists = vi.fn().mockReturnValue(
        buildCustomerShoppingListResponseWith({
          data: { customerShoppingLists: { totalCount: 0, edges: [] } },
        }),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 2,
                  optionList: expect.arrayContaining([
                    expect.objectContaining({
                      optionId: 'attribute[0]',
                      optionValue: 'bar',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      const createCustomerShoppingList = vi.fn();

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('CustomerShoppingLists', ({ query }) =>
          HttpResponse.json(getCustomerShoppingLists(query)),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ variables })),
        ),
        graphql.mutation('CreateCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(createCustomerShoppingList(variables)),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(within(dialog).getByRole('button', { name: 'Add to shopping list' }));

      const createNewButton = await screen.findByRole('button', { name: 'Create new' });

      await userEvent.click(createNewButton);

      expect(await screen.findByRole('heading', { name: 'Create new' })).toBeVisible();

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      const descriptionInput = screen.getByRole('textbox', { name: 'Description' });

      await userEvent.type(nameInput, 'New Shopping List');
      await userEvent.type(descriptionInput, 'This is a new shopping list');

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'New Shopping List' },
      });

      when(createCustomerShoppingList)
        .calledWith({
          shoppingListData: {
            name: 'New Shopping List',
            description: 'This is a new shopping list',
            channelId: 1,
          },
        })
        .thenResolve({});

      when(getCustomerShoppingLists, { times: 1 })
        .calledWith(stringContainingAll('first: 50', 'channelId: 1'))
        .thenReturn(
          buildCustomerShoppingListResponseWith({
            data: { customerShoppingLists: { totalCount: 0, edges: [shoppingList] } },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await userEvent.click(await screen.findByText('New Shopping List'));

      await userEvent.click(screen.getByRole('button', { name: 'OK' }));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeVisible();
      });
    });

    it('can adjust the quantity of a product', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [{ name: 'Color', value: 'bar' }],
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      const addItemsToCustomerShoppingList = vi.fn();

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(
            buildCustomerShoppingListResponseWith({
              data: { customerShoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ variables })),
        ),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 2,
                  optionList: expect.arrayContaining([
                    expect.objectContaining({
                      optionId: 'attribute[0]',
                      optionValue: 'bar',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      expect(
        within(dialog).getByText('Select products and quantity to add to shopping list'),
      ).toBeVisible();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.type(within(productGroup).getByRole('spinbutton'), '2', {
        initialSelectionStart: 0,
        initialSelectionEnd: 1,
      });

      await userEvent.click(await screen.findByRole('button', { name: 'Add to shopping list' }));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeVisible();
      });
    });

    it('can add all the products in one go', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 789,
        variantEntityId: 1011,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 123,
        variantEntityId: 456,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      const addItemsToCustomerShoppingList = vi.fn();

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(
            buildCustomerShoppingListResponseWith({
              data: { customerShoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ query, variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ query, variables })),
        ),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 1,
                  optionList: [],
                }),
                expect.objectContaining({
                  productId: 789,
                  variantId: 1011,
                  quantity: 2,
                  optionList: [],
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      const checkboxes = await within(dialog).findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(await screen.findByRole('button', { name: 'Add to shopping list' }));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeVisible();
      });
    });

    it('can add all products in one go via reorder', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);
      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      createCartSimple.mockReturnValue({
        data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } },
      });

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const checkboxes = await screen.findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeVisible();
      });

      expect(createCartSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          createCartInput: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                productEntityId: 3001,
                variantEntityId: 4001,
              }),
              expect.objectContaining({
                quantity: 1,
                productEntityId: 3002,
                variantEntityId: 4002,
              }),
            ]),
          }),
        }),
      );

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('shows a warning if no product is selected', async () => {
      const screamProduct = {
        entityId: 2001,
        productEntityId: 3001,
        variantEntityId: 4001,
        name: 'Scream Canister',
        quantity: 2,
        productOptions: [] as Array<{ name: string; value: string }>,
      };
      const laughProduct = {
        entityId: 2002,
        productEntityId: 3002,
        variantEntityId: 4002,
        name: 'Laugh Canister',
        quantity: 1,
        productOptions: [] as Array<{ name: string; value: string }>,
      };

      const order = buildUnifiedOrderWithProducts([screamProduct, laughProduct]);

      server.use(
        graphql.query('GetOrderDetail', () =>
          HttpResponse.json(buildOrderDetailResponseWith({ data: { site: { order } } })),
        ),
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [{ state: { isCompanyOrder: false } }],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Please select at least one item')).toBeVisible();
      });
    });
  });
});
