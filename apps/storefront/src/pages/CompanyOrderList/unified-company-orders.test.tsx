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

import {
  type GetCompanyOrdersResponse,
  type Order,
  type OrderPlacedBy,
  OrdersSortInput,
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

const flagOn = { 'B2B-4613.buyer_portal_unified_sf_gql_orders': true };
const flagOff = { 'B2B-4613.buyer_portal_unified_sf_gql_orders': false };

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

const filteredCompanyOrdersResponse = (entityId: number): GetCompanyOrdersResponse => ({
  data: {
    customer: {
      activeCompany: {
        orders: {
          edges: [{ node: buildSfGqlOrderWith({ entityId }), cursor: 'filtered' }],
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
});

const buildPagedCompanyOrdersResponse = (
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

      const row = screen.getByText('12345').closest('tr')!;
      expect(row).toBeInTheDocument();
      expect(within(row).getByText('PO-9876')).toBeInTheDocument();
      expect(within(row).getByText('Acme Corp')).toBeInTheDocument();
      expect(within(row).getByText('Completed')).toBeInTheDocument();
      expect(within(row).getByText('Jane Doe')).toBeInTheDocument();
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

      const row = screen.getByText('77777').closest('tr')!;
      expect(within(row).getByText('$1,234.56')).toBeInTheDocument();
    });

    describe('sorting', () => {
      describe('default Order ID sort', () => {
        it('requests ID_Z_TO_A initially', async () => {
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

          expect(getOrders).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: OrdersSortInput.ID_Z_TO_A }),
          );
        });

        it('toggles to ID_A_TO_Z when the active Order column is clicked', async () => {
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

          const orderHeader = screen.getByRole('columnheader', { name: 'Order' });
          expect(orderHeader).toHaveAttribute('aria-sort', 'descending');

          when(getOrders)
            .calledWith(expect.objectContaining({ sortBy: OrdersSortInput.ID_A_TO_Z }))
            .thenReturn(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

          await userEvent.click(within(orderHeader).getByRole('button'));

          await waitFor(() => {
            expect(getOrders).toHaveBeenCalledWith(
              expect.objectContaining({ sortBy: OrdersSortInput.ID_A_TO_Z }),
            );
          });

          expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveAttribute(
            'aria-sort',
            'ascending',
          );
        });
      });

      it('uses CREATED_AT_NEWEST when first activating the Created on column', async () => {
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

        when(getOrders)
          .calledWith(expect.objectContaining({ sortBy: OrdersSortInput.CREATED_AT_NEWEST }))
          .thenReturn(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        await userEvent.click(
          within(screen.getByRole('columnheader', { name: 'Created on' })).getByRole('button'),
        );

        await waitFor(() => {
          expect(getOrders).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: OrdersSortInput.CREATED_AT_NEWEST }),
          );
        });

        expect(screen.getByRole('columnheader', { name: 'Created on' })).toHaveAttribute(
          'aria-sort',
          'descending',
        );
      });

      it('uses REFERENCE_Z_TO_A when first activating the PO/Reference column', async () => {
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

        when(getOrders)
          .calledWith(expect.objectContaining({ sortBy: OrdersSortInput.REFERENCE_Z_TO_A }))
          .thenReturn(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        await userEvent.click(
          within(screen.getByRole('columnheader', { name: 'PO / Reference' })).getByRole('button'),
        );

        await waitFor(() => {
          expect(getOrders).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: OrdersSortInput.REFERENCE_Z_TO_A }),
          );
        });
      });

      it('uses HIGHEST_TOTAL_INC_TAX when first activating the Grand Total column', async () => {
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

        when(getOrders)
          .calledWith(expect.objectContaining({ sortBy: OrdersSortInput.HIGHEST_TOTAL_INC_TAX }))
          .thenReturn(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        await userEvent.click(
          within(screen.getByRole('columnheader', { name: 'Grand total' })).getByRole('button'),
        );

        await waitFor(() => {
          expect(getOrders).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: OrdersSortInput.HIGHEST_TOTAL_INC_TAX }),
          );
        });

        expect(screen.getByRole('columnheader', { name: 'Grand total' })).toHaveAttribute(
          'aria-sort',
          'descending',
        );
      });

      it('uses PLACED_BY_Z_TO_A when first activating the Placed by column', async () => {
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

        when(getOrders)
          .calledWith(expect.objectContaining({ sortBy: OrdersSortInput.PLACED_BY_Z_TO_A }))
          .thenReturn(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        await userEvent.click(
          within(screen.getByRole('columnheader', { name: 'Placed by' })).getByRole('button'),
        );

        await waitFor(() => {
          expect(getOrders).toHaveBeenCalledWith(
            expect.objectContaining({ sortBy: OrdersSortInput.PLACED_BY_Z_TO_A }),
          );
        });
      });

      it('clears cursor variables when sort changes after paging forward', async () => {
        const page1Response = buildPagedCompanyOrdersResponse(
          [{ entityId: 1001 }, { entityId: 1002 }],
          {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1001',
            endCursor: 'cursor-1002',
          },
          20,
        );

        const getOrders = vi.fn().mockReturnValue(page1Response);

        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1002' }))
          .thenReturn(
            buildPagedCompanyOrdersResponse(
              [{ entityId: 2001 }, { entityId: 2002 }],
              {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor-2001',
                endCursor: 'cursor-2002',
              },
              20,
            ),
          );

        server.use(
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

        await waitFor(() => {
          expect(screen.getByText('2001').closest('tr')!).toBeInTheDocument();
        });

        await userEvent.click(
          within(screen.getByRole('columnheader', { name: 'Created on' })).getByRole('button'),
        );

        await waitFor(() => {
          const { calls } = getOrders.mock;
          const lastVars = calls[calls.length - 1]?.[0] as {
            sortBy?: string;
            after?: string;
            before?: string;
          };
          expect(lastVars?.sortBy).toBe(OrdersSortInput.CREATED_AT_NEWEST);
          expect(lastVars?.after).toBeUndefined();
          expect(lastVars?.before).toBeUndefined();
        });
      });

      it('includes sortBy with applied search filters', async () => {
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

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ search: 'findme' }),
              sortBy: OrdersSortInput.ID_Z_TO_A,
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(66996));

        await userEvent.type(screen.getByPlaceholderText('Search'), 'findme');

        await waitFor(() => {
          expect(getOrders).toHaveBeenCalledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ search: 'findme' }),
              sortBy: OrdersSortInput.ID_Z_TO_A,
            }),
          );
        });
      });
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

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ search: '66996' }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(66996));

        await userEvent.type(screen.getByPlaceholderText('Search'), '66996');

        await waitFor(() => {
          expect(screen.getByText('66996').closest('tr')!).toBeVisible();
        });
      });

      it('clears search and removes the filter from the query', async () => {
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

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ search: 'temp' }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(11111));

        const searchInput = screen.getByPlaceholderText('Search');
        await userEvent.type(searchInput, 'temp');

        await waitFor(() => {
          expect(screen.getByText('11111').closest('tr')!).toBeVisible();
        });

        await userEvent.clear(searchInput);

        await waitFor(() => {
          const { calls } = getOrders.mock;
          const lastCall = calls[calls.length - 1]?.[0];
          expect(lastCall?.filters).not.toHaveProperty('search');
        });
      });

      it('composes search with status and date range filters', async () => {
        vi.setSystemTime(new Date('21 November 2022'));

        const getOrders = vi
          .fn()
          .mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        server.use(
          graphql.query('GetOrderStatuses', () =>
            HttpResponse.json(
              buildLegacyB2BOrderStatusesResponseWith({
                data: {
                  orderStatuses: [
                    buildLegacyOrderStatusWith({
                      systemLabel: 'Completed',
                      customLabel: 'Completed',
                    }),
                  ],
                },
              }),
            ),
          ),
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({
                search: 'PO-42',
                status: ['Completed'],
                dateRange: { from: '2022-11-15', to: '2022-11-26' },
              }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(99999));

        await userEvent.type(screen.getByPlaceholderText('Search'), 'PO-42');

        await userEvent.click(screen.getByRole('button', { name: 'edit' }));

        const dialog = await screen.findByRole('dialog', { name: 'Filters' });

        await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
        await userEvent.click(screen.getByRole('option', { name: 'Completed' }));

        await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
        await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

        await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
        await userEvent.click(screen.getByRole('gridcell', { name: '26' }));

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => {
          expect(screen.getByText('99999').closest('tr')!).toBeVisible();
        });
      });

      it('filters by status', async () => {
        const getOrders = vi
          .fn()
          .mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        server.use(
          graphql.query('GetOrderStatuses', () =>
            HttpResponse.json(
              buildLegacyB2BOrderStatusesResponseWith({
                data: {
                  orderStatuses: [
                    buildLegacyOrderStatusWith({
                      systemLabel: 'Completed',
                      customLabel: 'Completed',
                    }),
                  ],
                },
              }),
            ),
          ),
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ status: ['Completed'] }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(66996));

        await userEvent.click(screen.getByRole('button', { name: 'edit' }));

        const dialog = await screen.findByRole('dialog', { name: 'Filters' });

        await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
        await userEvent.click(screen.getByRole('option', { name: 'Completed' }));

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => {
          expect(screen.getByText('66996').closest('tr')!).toBeVisible();
        });
      });

      it('resolves custom status label to systemLabel before sending', async () => {
        const getOrders = vi
          .fn()
          .mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        server.use(
          graphql.query('GetOrderStatuses', () =>
            HttpResponse.json(
              buildLegacyB2BOrderStatusesResponseWith({
                data: {
                  orderStatuses: [
                    buildLegacyOrderStatusWith({
                      systemLabel: 'Completed',
                      customLabel: 'All Done',
                    }),
                  ],
                },
              }),
            ),
          ),
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({ status: ['Completed'] }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(66996));

        await userEvent.click(screen.getByRole('button', { name: 'edit' }));

        const dialog = await screen.findByRole('dialog', { name: 'Filters' });

        await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
        await userEvent.click(screen.getByRole('option', { name: 'All Done' }));

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => {
          expect(screen.getByText('66996').closest('tr')!).toBeVisible();
        });
      });

      it('filters by date range', async () => {
        vi.setSystemTime(new Date('21 November 2022'));

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

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({
                dateRange: { from: '2022-11-15', to: '2022-11-26' },
              }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(66996));

        await userEvent.click(screen.getByRole('button', { name: 'edit' }));

        const dialog = await screen.findByRole('dialog', { name: 'Filters' });

        await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
        await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

        await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
        await userEvent.click(screen.getByRole('gridcell', { name: '26' }));

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => {
          expect(screen.getByText('66996').closest('tr')!).toBeVisible();
        });
      });

      it('filters by status and date range together', async () => {
        vi.setSystemTime(new Date('21 November 2022'));

        const getOrders = vi
          .fn()
          .mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

        server.use(
          graphql.query('GetOrderStatuses', () =>
            HttpResponse.json(
              buildLegacyB2BOrderStatusesResponseWith({
                data: {
                  orderStatuses: [
                    buildLegacyOrderStatusWith({
                      systemLabel: 'Pending',
                      customLabel: 'Pending',
                    }),
                  ],
                },
              }),
            ),
          ),
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        when(getOrders)
          .calledWith(
            expect.objectContaining({
              filters: expect.objectContaining({
                status: ['Pending'],
                dateRange: { from: '2022-11-15', to: '2022-11-26' },
              }),
            }),
          )
          .thenReturn(filteredCompanyOrdersResponse(66996));

        await userEvent.click(screen.getByRole('button', { name: 'edit' }));

        const dialog = await screen.findByRole('dialog', { name: 'Filters' });

        await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
        await userEvent.click(screen.getByRole('option', { name: 'Pending' }));

        await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
        await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

        await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
        await userEvent.click(screen.getByRole('gridcell', { name: '26' }));

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => {
          expect(screen.getByText('66996').closest('tr')!).toBeVisible();
        });
      });
    });

    describe('cursor pagination', () => {
      it('passes after cursor when navigating to the next page', async () => {
        const page1Response = buildPagedCompanyOrdersResponse(
          [{ entityId: 1001 }, { entityId: 1002 }],
          {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1001',
            endCursor: 'cursor-1002',
          },
          20,
        );

        const getOrders = vi.fn().mockReturnValue(page1Response);

        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1002' }))
          .thenReturn(
            buildPagedCompanyOrdersResponse(
              [{ entityId: 2001 }, { entityId: 2002 }],
              {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor-2001',
                endCursor: 'cursor-2002',
              },
              20,
            ),
          );

        server.use(
          graphql.query('GetCompanyOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));
        expect(screen.getByText('1001').closest('tr')!).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

        await waitFor(() => {
          expect(screen.getByText('2001').closest('tr')!).toBeInTheDocument();
        });
      });

      it('displays total count from collectionInfo.totalItems', async () => {
        const response = buildPagedCompanyOrdersResponse(
          [{ entityId: 3001 }, { entityId: 3002 }],
          {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-3001',
            endCursor: 'cursor-3002',
          },
          42,
        );

        server.use(graphql.query('GetCompanyOrders', () => HttpResponse.json(response)));

        renderWithProviders(<CompanyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        await waitFor(() => {
          expect(screen.getByText(/of 42/)).toBeInTheDocument();
        });
      });

      it('passes before cursor when navigating to the previous page', async () => {
        const page1Response = buildPagedCompanyOrdersResponse(
          [{ entityId: 1001 }],
          {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor-1001',
            endCursor: 'cursor-1001',
          },
          20,
        );

        const getOrders = vi.fn().mockReturnValue(page1Response);

        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1001' }))
          .thenReturn(
            buildPagedCompanyOrdersResponse(
              [{ entityId: 2001 }],
              {
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'cursor-2001',
                endCursor: 'cursor-2001',
              },
              20,
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

        await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
        await waitFor(() => {
          expect(screen.getByText('2001').closest('tr')!).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
        await waitFor(() => {
          expect(screen.getByText('1001').closest('tr')!).toBeInTheDocument();
        });
      });
    });
  });

  describe('subsidiary hierarchy filter', () => {
    const hierarchyState = (featureFlags: Record<string, boolean>) => ({
      company: buildCompanyStateWith({
        customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
        companyInfo: {
          id: '100',
          companyName: 'Parent Corp',
          status: CompanyStatus.APPROVED,
        },
        companyHierarchyInfo: {
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          selectCompanyHierarchyId: '',
          companyHierarchyList: [
            {
              companyId: 100,
              companyName: 'Parent Corp',
              parentCompanyId: null,
              channelFlag: true,
            },
            {
              companyId: 200,
              companyName: 'Sub Corp Alpha',
              parentCompanyId: 100,
              parentCompanyName: 'Parent Corp',
              channelFlag: true,
            },
            {
              companyId: 300,
              companyName: 'Sub Corp Beta',
              parentCompanyId: 100,
              parentCompanyName: 'Parent Corp',
              channelFlag: true,
            },
          ],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        pagesSubsidiariesPermission: { order: true },
      }),
      global: buildGlobalStateWith({ featureFlags }),
      storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
    });

    const noHierarchyState = (featureFlags: Record<string, boolean>) => ({
      company: buildCompanyStateWith({
        customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
        companyInfo: {
          id: '100',
          companyName: 'Parent Corp',
          status: CompanyStatus.APPROVED,
        },
        companyHierarchyInfo: {
          isEnabledCompanyHierarchy: false,
          isHasCurrentPagePermission: true,
          selectCompanyHierarchyId: '',
          companyHierarchyList: [],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        pagesSubsidiariesPermission: { order: true },
      }),
      global: buildGlobalStateWith({ featureFlags }),
      storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
    });

    const noOrderPermissionState = (featureFlags: Record<string, boolean>) => ({
      company: buildCompanyStateWith({
        customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
        companyInfo: {
          id: '100',
          companyName: 'Parent Corp',
          status: CompanyStatus.APPROVED,
        },
        companyHierarchyInfo: {
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          selectCompanyHierarchyId: '',
          companyHierarchyList: [
            {
              companyId: 100,
              companyName: 'Parent Corp',
              parentCompanyId: null,
              channelFlag: true,
            },
          ],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        pagesSubsidiariesPermission: { order: false },
      }),
      global: buildGlobalStateWith({ featureFlags }),
      storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
    });

    it('renders subsidiary selector when hierarchy is enabled and order permission is granted', async () => {
      server.use(
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json(buildCompanyOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByLabelText('Company')).toBeInTheDocument();
    });

    it('does NOT render subsidiary selector when hierarchy is disabled', async () => {
      server.use(
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json(buildCompanyOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: noHierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();
    });

    it('does NOT render subsidiary selector when order subsidiary permission is denied', async () => {
      server.use(
        graphql.query('GetCompanyOrders', () =>
          HttpResponse.json(buildCompanyOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<CompanyOrders />, {
        preloadedState: noOrderPermissionState(flagOn),
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();
    });

    it('sends companyIds in the initial query scoped to the current company', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCompanyOrders', ({ variables }) =>
          HttpResponse.json(getOrders(variables)),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ companyIds: ['100'] }),
        }),
      );
    });

    it('sends selected subsidiary companyId when a subsidiary is chosen', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCompanyOrders', ({ variables }) =>
          HttpResponse.json(getOrders(variables)),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const companySelect = screen.getByLabelText('Company');
      await userEvent.click(companySelect);
      await userEvent.click(screen.getByRole('option', { name: /Sub Corp Alpha/ }));

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          filters?: { companyIds?: string[] };
        };
        expect(lastVars?.filters?.companyIds).toEqual(expect.arrayContaining(['200']));
      });
    });

    it('removes companyIds from filters when "All" is selected', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCompanyOrders', ({ variables }) =>
          HttpResponse.json(getOrders(variables)),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const companySelect = screen.getByLabelText('Company');
      await userEvent.click(companySelect);
      await userEvent.click(screen.getByRole('option', { name: /All/ }));

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          filters?: { companyIds?: string[] };
        };
        expect(lastVars?.filters?.companyIds).toBeUndefined();
      });
    });

    it('resets pagination when subsidiary filter changes', async () => {
      const page1Response = buildPagedCompanyOrdersResponse(
        [{ entityId: 4001 }, { entityId: 4002 }],
        {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-4001',
          endCursor: 'cursor-4002',
        },
        20,
      );

      const getOrders = vi.fn().mockReturnValue(page1Response);

      when(getOrders)
        .calledWith(expect.objectContaining({ after: 'cursor-4002' }))
        .thenReturn(
          buildPagedCompanyOrdersResponse(
            [{ entityId: 5001 }, { entityId: 5002 }],
            {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'cursor-5001',
              endCursor: 'cursor-5002',
            },
            20,
          ),
        );

      server.use(
        graphql.query('GetCompanyOrders', ({ variables }) =>
          HttpResponse.json(getOrders(variables)),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

      await waitFor(() => {
        expect(screen.getByText('5001').closest('tr')!).toBeInTheDocument();
      });

      const companySelect = screen.getByLabelText('Company');
      await userEvent.click(companySelect);
      await userEvent.click(screen.getByRole('option', { name: /Sub Corp Alpha/ }));

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          after?: string;
          before?: string;
        };
        expect(lastVars?.after).toBeUndefined();
        expect(lastVars?.before).toBeUndefined();
      });
    });

    it('composes companyIds with search filter', async () => {
      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetCompanyOrders', ({ variables }) =>
          HttpResponse.json(getOrders(variables)),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const companySelect = screen.getByLabelText('Company');
      await userEvent.click(companySelect);
      await userEvent.click(screen.getByRole('option', { name: /Sub Corp Beta/ }));

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          filters?: { companyIds?: string[] };
        };
        expect(lastVars?.filters?.companyIds).toEqual(expect.arrayContaining(['300']));
      });

      // Close the dropdown before interacting with the search input
      await userEvent.keyboard('{Escape}');

      await userEvent.type(screen.getByPlaceholderText('Search'), 'widget');

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          filters?: { companyIds?: string[]; search?: string };
        };
        expect(lastVars?.filters?.search).toBe('widget');
        expect(lastVars?.filters?.companyIds).toEqual(expect.arrayContaining(['300']));
      });
    });

    it('composes companyIds with status and date range filters', async () => {
      vi.setSystemTime(new Date('21 November 2022'));

      const getOrders = vi.fn().mockReturnValue(buildCompanyOrdersResponseWith('WHATEVER_VALUES'));

      server.use(
        graphql.query('GetOrderStatuses', () =>
          HttpResponse.json(
            buildLegacyB2BOrderStatusesResponseWith({
              data: {
                orderStatuses: [
                  buildLegacyOrderStatusWith({
                    systemLabel: 'Shipped',
                    customLabel: 'Shipped',
                  }),
                ],
              },
            }),
          ),
        ),
        graphql.query('GetCompanyOrders', ({ variables }) =>
          HttpResponse.json(getOrders(variables)),
        ),
      );

      renderWithProviders(<CompanyOrders />, { preloadedState: hierarchyState(flagOn) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const companySelect = screen.getByLabelText('Company');
      await userEvent.click(companySelect);
      await userEvent.click(screen.getByRole('option', { name: /Sub Corp Alpha/ }));

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          filters?: { companyIds?: string[] };
        };
        expect(lastVars?.filters?.companyIds).toEqual(expect.arrayContaining(['200']));
      });

      // Close the dropdown before opening the filters dialog
      await userEvent.keyboard('{Escape}');

      await userEvent.click(screen.getByRole('button', { name: 'edit' }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
      await userEvent.click(screen.getByRole('option', { name: 'Shipped' }));

      await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
      await userEvent.click(screen.getByRole('gridcell', { name: '15' }));

      await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
      await userEvent.click(screen.getByRole('gridcell', { name: '26' }));

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        const { calls } = getOrders.mock;
        const lastVars = calls[calls.length - 1]?.[0] as {
          filters?: {
            companyIds?: string[];
            status?: string[];
            dateRange?: { from: string; to: string };
          };
        };
        expect(lastVars?.filters?.companyIds).toEqual(expect.arrayContaining(['200']));
        expect(lastVars?.filters?.status).toEqual(['Shipped']);
        expect(lastVars?.filters?.dateRange).toEqual({
          from: '2022-11-15',
          to: '2022-11-26',
        });
      });
    });
  });
});
