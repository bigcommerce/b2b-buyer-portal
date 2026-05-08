import { useParams } from 'react-router-dom';
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
  userEvent,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';

import { AddressConfig } from '@/shared/service/b2b/graphql/address';
import { CustomerOrderStatues, CustomerOrderStatus } from '@/shared/service/b2b/graphql/orders';
import { OrderHistoryEventType } from '@/shared/service/bc/graphql/orders';
import type { GetOrderDetailResponse, Order } from '@/shared/service/bc/graphql/orders';
import { CustomerRole } from '@/types';

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

const preloadedState = {
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.B2C },
  }),
  global: buildGlobalStateWith({
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
    server.use(
      graphql.query('GetOrderDetail', () =>
        HttpResponse.json(
          buildOrderDetailResponseWith({
            data: {
              site: {
                order: buildUnifiedOrderWith({
                  entityId: 6696,
                  orderedAt: { utc: '2025-05-04T00:00:00.000Z' },
                  placedBy: {
                    entityId: 1,
                    firstName: 'Mike',
                    lastName: 'Wazowski',
                    email: 'mike@monstersinc.com',
                  },
                  subTotal: { currencyCode: 'USD', value: 102 },
                  shippingCostTotal: { currencyCode: 'USD', value: 332 },
                  handlingCostTotal: { currencyCode: 'USD', value: 22.2 },
                  taxTotal: { currencyCode: 'USD', value: 13.5 },
                  totalIncTax: { currencyCode: 'USD', value: 100 },
                  discounts: {
                    couponDiscounts: [],
                    nonCouponDiscountTotal: { currencyCode: 'USD', value: 37.93 },
                    totalDiscount: null,
                  },
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

    expect(screen.getByRole('heading', { name: 'Summary' })).toBeVisible();
    expect(screen.getByText(/Purchased by Mike Wazowski on/)).toBeVisible();

    expect(screen.getByRole('group', { name: 'Sub total' })).toHaveTextContent('102.00');
    expect(screen.getByRole('group', { name: 'Shipping' })).toHaveTextContent('332.00');
    expect(screen.getByRole('group', { name: 'Handling Fee' })).toHaveTextContent('22.20');
    expect(screen.getByRole('group', { name: 'Tax' })).toHaveTextContent('13.50');
    expect(screen.getByRole('group', { name: 'Discount amount' })).toHaveTextContent('37.93');
    expect(screen.getByRole('group', { name: 'Grand total' })).toHaveTextContent('100.00');
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
                    reference: '3405',
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
});
