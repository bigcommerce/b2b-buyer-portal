import {
  buildB2BFeaturesStateWith,
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
  waitFor,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';
import { vi } from 'vitest';
import { when } from 'vitest-when';

import type {
  GetCompanyOrdersResponse,
  Order,
  OrderPlacedBy,
} from '@/shared/service/bc/graphql/orders';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import { CompanyOrderStatuses, OrderStatus as LegacyOrderStatus } from '../order/orders';

import CompanyOrders from '.';

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

const buildCompanyOrdersResponseWith = builder<GetCompanyOrdersResponse>(() => {
  const numberOfOrders = faker.number.int({ min: 1, max: 5 });
  return {
    data: {
      customer: {
        activeCompany: {
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
            collectionInfo: { totalItems: numberOfOrders },
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

const buildLegacyB2BOrderStatusesResponseWith = builder<CompanyOrderStatuses>(() => ({
  data: {
    orderStatuses: bulk(buildLegacyOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

// ---------------------------------------------------------------------------
// Preloaded states
// ---------------------------------------------------------------------------

const flagOn = { 'B2B-4613.buyer_portal_unified_sf_gql_orders': true } as const;
const flagOff = { 'B2B-4613.buyer_portal_unified_sf_gql_orders': false } as const;

const b2bStateWithFlag = (featureFlags: Record<string, boolean>) => ({
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
    companyInfo: { id: '123', companyName: 'Test Corp', status: CompanyStatus.APPROVED },
  }),
  global: buildGlobalStateWith({ featureFlags }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
});

const superAdminMasqueradingState = (featureFlags: Record<string, boolean>) => ({
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.SUPER_ADMIN, userType: UserTypes.MULTIPLE_B2C },
    companyInfo: { id: '456', companyName: 'Admin Corp', status: CompanyStatus.APPROVED },
  }),
  b2bFeatures: buildB2BFeaturesStateWith({
    masqueradeCompany: { id: 456, isAgenting: true },
  }),
  global: buildGlobalStateWith({ featureFlags }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Company Orders — unified SF GQL orders (B2B-4616)', () => {
  beforeEach(() => {
    server.use(
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json(buildLegacyB2BOrderStatusesResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetOrdersCreatedByUser', () =>
        HttpResponse.json({ data: { createdByUser: { results: [] } } }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('flag OFF — legacy path unchanged', () => {
    it('does not call the SF GQL company orders query', async () => {
      const sfGqlHandler = vi.fn();

      server.use(
        graphql.query('GetCompanyOrders', () => {
          sfGqlHandler();
          return HttpResponse.json(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));
        }),
        graphql.query('GetAllOrders', () =>
          HttpResponse.json({
            data: {
              allOrders: {
                totalCount: 1,
                pageInfo: { hasNextPage: false, hasPreviousPage: false },
                edges: [
                  {
                    node: {
                      orderId: '100',
                      createdAt: 1700000000,
                      totalIncTax: 50,
                      poNumber: 'PO1',
                      status: 'Pending',
                      firstName: 'A',
                      lastName: 'B',
                      companyInfo: { companyName: 'Corp' },
                    },
                  },
                ],
              },
            },
          }),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOff) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(sfGqlHandler).not.toHaveBeenCalled();
    });
  });

  describe('flag ON — unified SF GQL company orders path', () => {
    it('renders company orders with all fields', async () => {
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
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                activeCompany: {
                  orders: {
                    edges: [{ node: order, cursor: 'abc' }],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: 'abc',
                      endCursor: 'abc',
                    },
                    collectionInfo: { totalItems: 1 },
                  },
                },
              },
            },
          } satisfies GetCompanyOrdersResponse),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /12345/ });
      expect(row).toBeInTheDocument();
      expect(within(row).getByText('PO-9876')).toBeInTheDocument();
      expect(within(row).getByText(/Acme Corp/)).toBeInTheDocument();
      expect(within(row).getByText(/Completed/)).toBeInTheDocument();
      expect(within(row).getByText(/Jane Doe/)).toBeInTheDocument();
    });

    it('shows company and placed-by columns for company orders', async () => {
      server.use(
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json(buildCompanyOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);

      expect(headerTexts).toContain('Company');
      expect(headerTexts).toContain('Placed by');
    });

    it('shows placed-by column for super admin masquerading on company orders', async () => {
      server.use(
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json(buildCompanyOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<CompanyOrders />, {
        preloadedState: superAdminMasqueradingState(flagOn),
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);

      expect(headerTexts).toContain('Placed by');
    });

    it('formats currency correctly', async () => {
      const order = buildSfGqlOrderWith({
        entityId: 77777,
        totalIncTax: { currencyCode: 'USD', value: 1234.56 },
      });

      server.use(
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                activeCompany: {
                  orders: {
                    edges: [{ node: order, cursor: 'cur' }],
                    pageInfo: {
                      hasNextPage: false,
                      hasPreviousPage: false,
                      startCursor: null,
                      endCursor: null,
                    },
                    collectionInfo: { totalItems: 1 },
                  },
                },
              },
            },
          } satisfies GetCompanyOrdersResponse),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /77777/ });
      expect(within(row).getByText(/1,234\.56/)).toBeInTheDocument();
    });

    describe('filter behavior', () => {
      it('filters by search input', async () => {
        const getOrders = vi
          .fn()
          .mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        server.use(
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        const filteredResponse: GetCompanyOrdersResponse = {
          data: {
            customer: {
              activeCompany: {
                orders: {
                  edges: [
                    {
                      node: buildSfGqlOrderWith({ entityId: 66996 }),
                      cursor: 'filtered',
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'filtered',
                    endCursor: 'filtered',
                  },
                  collectionInfo: { totalItems: 1 },
                },
              },
            },
          },
        };

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ search: '66996' }),
            }),
          )
          .thenReturn(filteredResponse);

        await userEvent.type(screen.getByPlaceholderText(/Search/), '66996');

        await waitFor(() => {
          expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
        });
      });
    });

    describe('cursor pagination', () => {
      const buildPagedResponse = (
        orders: Array<{ entityId: number }>,
        pageInfo: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string | null;
          endCursor: string | null;
        },
        totalItems: number,
      ): GetCompanyOrdersResponse => ({
        data: {
          customer: {
            activeCompany: {
              orders: {
                edges: orders.map((o) => ({
                  node: buildSfGqlOrderWith(o),
                  cursor: `cursor-${o.entityId}`,
                })),
                pageInfo,
                collectionInfo: { totalItems },
              },
            },
          },
        },
      });

      it('passes after cursor when navigating to the next page', async () => {
        const page1Response = buildPagedResponse(
          [{ entityId: 1001 }, { entityId: 1002 }],
          {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1001',
            endCursor: 'cursor-1002',
          },
          4,
        );

        const getOrders = vi.fn().mockReturnValue(page1Response);

        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1002' }))
          .thenReturn(
            buildPagedResponse(
              [{ entityId: 2001 }, { entityId: 2002 }],
              {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor-2001',
                endCursor: 'cursor-2002',
              },
              4,
            ),
          );

        server.use(
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));
        expect(screen.getByRole('row', { name: /1001/ })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /next page/ }));

        await waitFor(() => {
          expect(screen.getByRole('row', { name: /2001/ })).toBeInTheDocument();
        });
      });

      it('passes before cursor when navigating to the previous page', async () => {
        const page1Response = buildPagedResponse(
          [{ entityId: 1001 }],
          {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1001',
            endCursor: 'cursor-1001',
          },
          2,
        );

        const getOrders = vi.fn().mockReturnValue(page1Response);

        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1001' }))
          .thenReturn(
            buildPagedResponse(
              [{ entityId: 2001 }],
              {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor-2001',
                endCursor: 'cursor-2001',
              },
              2,
            ),
          );

        when(getOrders)
          .calledWith(expect.objectContaining({ before: 'cursor-2001' }))
          .thenReturn(page1Response);

        server.use(
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        await userEvent.click(screen.getByRole('button', { name: /next page/ }));
        await waitFor(() => {
          expect(screen.getByRole('row', { name: /2001/ })).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', { name: /previous page/ }));
        await waitFor(() => {
          expect(screen.getByRole('row', { name: /1001/ })).toBeInTheDocument();
        });
      });
    });
  });
});
