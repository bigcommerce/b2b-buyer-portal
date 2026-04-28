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
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';

import type {
  GetCustomerOrdersResponse,
  Order,
  OrderPlacedBy,
} from '@/shared/service/bc/graphql/orders';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import { CustomerOrderStatues, OrderStatus as LegacyOrderStatus } from '../order/orders';

import MyOrders from '.';

const { server } = startMockServer();

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const buildPlacedByWith = builder<OrderPlacedBy>(() => ({
  entityId: faker.number.int({ min: 1, max: 9999 }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
}));

const buildSfGqlOrderWith = builder<Order>(() => ({
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
  shippingCostTotal: { currencyCode: 'USD', value: 9.99 },
  handlingCostTotal: { currencyCode: 'USD', value: 0 },
  wrappingCostTotal: { currencyCode: 'USD', value: 0 },
  taxTotal: { currencyCode: 'USD', value: 5 },
  totalIncTax: { currencyCode: 'USD', value: 114.99 },
  isTaxIncluded: false,
  taxes: [{ name: 'Tax', amount: { currencyCode: 'USD', value: 5 } }],
  discounts: {
    couponDiscounts: [],
    nonCouponDiscountTotal: { currencyCode: 'USD', value: 0 },
    totalDiscount: null,
  },
  customerMessage: null,
  totalProductQuantity: 2,
  consignments: null,
  reference: faker.string.alphanumeric(8),
  company: { entityId: faker.number.int({ min: 1, max: 999 }), name: faker.company.name() },
  placedBy: buildPlacedByWith('WHATEVER_VALUES'),
  history: [],
  quote: null,
  invoice: null,
  extraFields: [],
}));

const buildSfGqlB2COrderWith = builder<Order>(() => ({
  ...buildSfGqlOrderWith('WHATEVER_VALUES'),
  reference: null,
  company: null,
  placedBy: null,
}));

const buildSfGqlCustomerOrdersResponseWith = builder<GetCustomerOrdersResponse>(() => {
  const numberOfOrders = faker.number.int({ min: 1, max: 5 });
  return {
    data: {
      customer: {
        orders: {
          edges: bulk(
            builder(() => ({
              node: buildSfGqlOrderWith('WHATEVER_VALUES'),
              cursor: faker.string.alphanumeric(20),
            })),
            'WHATEVER_VALUES',
          ).times(numberOfOrders),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: faker.string.alphanumeric(20),
            endCursor: faker.string.alphanumeric(20),
          },
        },
      },
    },
  };
});

const buildLegacyOrderStatusWith = builder<LegacyOrderStatus>(() => ({
  statusCode: faker.number.int().toString(),
  systemLabel: faker.word.noun(),
  customLabel: faker.word.noun(),
}));

const buildLegacyOrderStatusesResponseWith = builder<CustomerOrderStatues>(() => ({
  data: {
    bcOrderStatuses: bulk(buildLegacyOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

// ---------------------------------------------------------------------------
// Preloaded states
// ---------------------------------------------------------------------------

const flagOn = { 'B2B-4613.buyer_portal_unified_sf_gql_orders': true } as const;
const flagOff = { 'B2B-4613.buyer_portal_unified_sf_gql_orders': false } as const;

const b2cStateWithFlag = (featureFlags: Record<string, boolean>) => ({
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.B2C },
  }),
  global: buildGlobalStateWith({ featureFlags }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
});

const b2bStateWithFlag = (featureFlags: Record<string, boolean>) => ({
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.ADMIN, userType: UserTypes.MULTIPLE_B2C },
    companyInfo: { id: '123', companyName: 'Test Corp', status: CompanyStatus.APPROVED },
  }),
  global: buildGlobalStateWith({ featureFlags }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('My Orders — unified SF GQL orders (B2B-4613)', () => {
  beforeEach(() => {
    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildLegacyOrderStatusesResponseWith('WHATEVER_VALUES')),
      ),
    );
  });

  describe('flag OFF — old path unchanged', () => {
    it('does not call the SF GQL query', async () => {
      const sfGqlHandler = vi.fn();

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => {
          if (query.includes('orderedAt')) {
            sfGqlHandler();
          }
          return HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));
        }),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOff) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(sfGqlHandler).not.toHaveBeenCalled();
    });
  });

  describe('flag ON — unified SF GQL path', () => {
    it('renders B2B orders with all fields', async () => {
      const order = buildSfGqlOrderWith({
        entityId: 12345,
        reference: 'PO-9876',
        status: { value: 'COMPLETED', label: 'Completed' },
        totalIncTax: { currencyCode: 'USD', value: 250 },
        orderedAt: { utc: '2025-03-13T00:00:00Z' },
        company: { entityId: 1, name: 'Acme Corp' },
        placedBy: { entityId: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                orders: {
                  edges: [{ node: order, cursor: 'abc' }],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'abc',
                    endCursor: 'abc',
                  },
                },
              },
            },
          } satisfies GetCustomerOrdersResponse),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /12345/ });
      expect(row).toBeInTheDocument();
      expect(within(row).getByText('PO-9876')).toBeInTheDocument();
      expect(within(row).getByText(/Acme Corp/)).toBeInTheDocument();
      expect(within(row).getByText(/Completed/)).toBeInTheDocument();
    });

    it('renders B2C orders with null B2B fields', async () => {
      const order = buildSfGqlB2COrderWith({
        entityId: 55555,
        status: { value: 'PENDING', label: 'Pending' },
        totalIncTax: { currencyCode: 'USD', value: 50 },
        orderedAt: { utc: '2025-06-01T00:00:00Z' },
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                orders: {
                  edges: [{ node: order, cursor: 'def' }],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'def',
                    endCursor: 'def',
                  },
                },
              },
            },
          } satisfies GetCustomerOrdersResponse),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /55555/ });
      expect(row).toBeInTheDocument();
      expect(within(row).getByText('–')).toBeInTheDocument();
    });

    it('preserves column visibility — company hidden for B2C', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);

      expect(headerTexts).not.toContain('Company');
      expect(headerTexts).not.toContain('Placed by');
    });

    it('preserves column visibility — company visible for B2B', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);

      expect(headerTexts).toContain('Company');
    });

    it('formats currency correctly', async () => {
      const order = buildSfGqlOrderWith({
        entityId: 77777,
        totalIncTax: { currencyCode: 'USD', value: 1234.56 },
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                orders: {
                  edges: [{ node: order, cursor: 'cur' }],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: null,
                    endCursor: null,
                  },
                },
              },
            },
          } satisfies GetCustomerOrdersResponse),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /77777/ });
      expect(within(row).getByText(/1,234\.56/)).toBeInTheDocument();
    });

    it('formats date correctly', async () => {
      const order = buildSfGqlOrderWith({
        entityId: 88888,
        orderedAt: { utc: '2025-03-13T00:00:00Z' },
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                orders: {
                  edges: [{ node: order, cursor: 'dt' }],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: null,
                    endCursor: null,
                  },
                },
              },
            },
          } satisfies GetCustomerOrdersResponse),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /88888/ });
      expect(within(row).getByText(/13 March 2025/)).toBeInTheDocument();
    });
  });
});
