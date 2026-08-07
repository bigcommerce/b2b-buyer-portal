import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildSfGqlMoneyWith,
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
  GetCustomerOrdersResponse,
  Order,
  OrderPlacedBy,
} from '@/shared/service/bc/graphql/orders';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import {
  CompanyOrderStatuses,
  CustomerOrderStatues,
  OrderStatus as LegacyOrderStatus,
} from '../order/orders';

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
  status: { value: 'AWAITING_FULFILLMENT', label: 'Awaiting fulfillment' },
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
  subTotal: buildSfGqlMoneyWith({ value: 100 }),
  discountedSubTotal: null,
  shippingCostTotal: buildSfGqlMoneyWith({ value: 9.99 }),
  handlingCostTotal: buildSfGqlMoneyWith({ value: 0 }),
  wrappingCostTotal: buildSfGqlMoneyWith({ value: 0 }),
  taxTotal: buildSfGqlMoneyWith({ value: 5 }),
  totalIncTax: buildSfGqlMoneyWith({ value: 114.99 }),
  isTaxIncluded: false,
  taxes: [{ name: 'Tax', amount: buildSfGqlMoneyWith({ value: 5 }) }],
  discounts: {
    couponDiscounts: [],
    nonCouponDiscountTotal: buildSfGqlMoneyWith({ value: 0 }),
    totalDiscount: null,
  },
  customerMessage: null,
  totalProductQuantity: 2,
  consignments: null,
  reference: faker.string.alphanumeric(8),
  poNumber: faker.string.alphanumeric(6),
  company: { entityId: faker.number.int({ min: 1, max: 999 }), name: faker.company.name() },
  placedBy: buildPlacedByWith('WHATEVER_VALUES'),
  history: [],
  invoice: null,
}));

const buildSfGqlB2COrderWith = builder<Order>(() => ({
  ...buildSfGqlOrderWith('WHATEVER_VALUES'),
  reference: null,
  poNumber: null,
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

// TODO: Needs to be removed when order statuses api gets added to unified graphql api
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

const b2bStateWithCurrency = (featureFlags: Record<string, boolean>) => ({
  ...b2bStateWithFlag(featureFlags),
  storeConfigs: {
    currencies: {
      currencies: [
        {
          id: '1',
          is_default: true,
          last_updated: '',
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
          token_location: 'left' as const,
          thousands_token: ',',
        },
      ],
      channelCurrencies: {
        channel_id: 1,
        enabled_currencies: ['USD'],
        default_currency: 'USD',
      },
      enteredInclusiveTax: false,
    },
    activeCurrency: { node: { isActive: true, entityId: 1 } },
  },
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
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json(buildLegacyB2BOrderStatusesResponseWith('WHATEVER_VALUES')),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
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
        poNumber: 'PO-9876',
        status: { value: 'COMPLETED', label: 'Completed' },
        totalIncTax: buildSfGqlMoneyWith({ value: 250 }),
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
        totalIncTax: buildSfGqlMoneyWith({ value: 50 }),
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

    // Sorting is not available on customer.orders — the agreed schema puts sortBy on the
    // company path only, and the upstream endpoint has no sort parameter. A header that
    // still reports aria-sort tells the user the list sorted when it did not.
    it('renders My Orders column headers as non-sortable when unified orders is enabled', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      expect(await screen.findByRole('columnheader', { name: 'Order' })).toBeInTheDocument();
      screen.getAllByRole('columnheader').forEach((header) => {
        expect(header).not.toHaveAttribute('aria-sort');
        expect(header.querySelector('.MuiTableSortLabel-root')).toBeNull();
      });
    });

    it('does not send sortBy on the customer orders query', async () => {
      let capturedQuery = '';
      let capturedVariables: Record<string, unknown> = {};

      server.use(
        graphql.query('GetCustomerOrders', ({ query, variables }) => {
          capturedQuery = query;
          capturedVariables = variables;
          return HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));
        }),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

      await waitFor(() => expect(capturedQuery).not.toBe(''));
      expect(capturedQuery).not.toContain('sortBy');
      expect(capturedVariables).not.toHaveProperty('sortBy');
    });

    // Search is kept visible even though it's a no-op: it's deferred to its own ticket,
    // not permanently unsupported, so the UI stays unchanged for now (see B2B-5420). The
    // company-hierarchy selector stays hidden — that field is permanently absent from
    // OrdersFiltersInput (B2B-5421), so there's no query for it to ever start filtering.
    it('renders the search box but not the company selector on the unified customer path', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<MyOrders />, {
        preloadedState: {
          ...b2bStateWithFlag(flagOn),
          company: buildCompanyStateWith({
            customer: { role: CustomerRole.ADMIN, userType: UserTypes.MULTIPLE_B2C },
            companyInfo: { id: '123', companyName: 'Test Corp', status: CompanyStatus.APPROVED },
            companyHierarchyInfo: { isEnabledCompanyHierarchy: true },
            pagesSubsidiariesPermission: { order: true },
          }),
        },
      });

      expect(await screen.findByRole('table')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: /compan/i })).not.toBeInTheDocument();
    });

    // A super admin who isn't currently agenting hits a different branch of
    // getFilterMoreData's role/agenting checks than CustomerRole.ADMIN does, and that
    // branch used to leave the "Company" more-filter field visible even though the
    // customer path's filter state has nowhere to send it — the exact visible-but-inert
    // defect this fixes for the company more-filter field.
    it('renders no Company field in more filters for a super admin who is not agenting', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<MyOrders />, {
        preloadedState: {
          ...b2bStateWithFlag(flagOn),
          company: buildCompanyStateWith({
            customer: { role: CustomerRole.SUPER_ADMIN, userType: UserTypes.MULTIPLE_B2C },
            companyInfo: { id: '123', companyName: 'Test Corp', status: CompanyStatus.APPROVED },
          }),
        },
      });

      expect(await screen.findByRole('table')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      expect(within(dialog).queryByRole('textbox', { name: /compan/i })).not.toBeInTheDocument();
    });

    it("displays the order's own currency via formattedV2, ignoring the store's currency settings", async () => {
      const order = buildSfGqlOrderWith({
        entityId: 90909,
        totalIncTax: buildSfGqlMoneyWith({
          currencyCode: 'USD',
          value: 319.95,
          formattedV2: '319.95$$$',
        }),
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json({
            data: {
              customer: {
                orders: {
                  edges: [{ node: order, cursor: 'fmt' }],
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

      renderWithProviders(<MyOrders />, {
        preloadedState: b2bStateWithCurrency(flagOn),
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const row = screen.getByRole('row', { name: /90909/ });
      expect(within(row).getByText('319.95$$$')).toBeVisible();
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

    describe('filter behavior', () => {
      const filteredOrderResponse = (entityId: number): GetCustomerOrdersResponse => ({
        data: {
          customer: {
            orders: {
              edges: [
                {
                  node: buildSfGqlOrderWith({ entityId }),
                  cursor: 'filtered',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'filtered',
                endCursor: 'filtered',
              },
            },
          },
        },
      });

      describe('as a B2C customer', () => {
        it('filters by status and date together', async () => {
          vi.setSystemTime(new Date('21 November 2022'));

          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetCustomerOrderStatuses', () =>
              HttpResponse.json(
                buildLegacyOrderStatusesResponseWith({
                  data: {
                    bcOrderStatuses: [
                      buildLegacyOrderStatusWith({
                        systemLabel: 'Pending',
                        customLabel: 'Pending',
                      }),
                    ],
                  },
                }),
              ),
            ),
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({
                  status: 'PENDING',
                  dateRange: { from: '2022-11-15', to: '2022-11-26' },
                }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
          await userEvent.click(screen.getByRole('option', { name: 'Pending' }));

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });

        it('filters by date range', async () => {
          vi.setSystemTime(new Date('21 November 2022'));

          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({
                  dateRange: { from: '2022-11-15', to: '2022-11-26' },
                }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });

        it('resolves custom status label to the OrderStatusValue enum before sending', async () => {
          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetCustomerOrderStatuses', () =>
              HttpResponse.json(
                buildLegacyOrderStatusesResponseWith({
                  data: {
                    bcOrderStatuses: [
                      buildLegacyOrderStatusWith({
                        systemLabel: 'Pending',
                        customLabel: 'Awaiting',
                      }),
                    ],
                  },
                }),
              ),
            ),
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({ status: 'PENDING' }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
          await userEvent.click(screen.getByRole('option', { name: 'Awaiting' }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });

        // OrdersFiltersInput.status is an enum on the customer path and [String!] on the
        // company path. Sending the display-facing system label 400s at coercion.
        it('sends the OrderStatusValue enum member when a status filter is applied', async () => {
          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetCustomerOrderStatuses', () =>
              HttpResponse.json(
                buildLegacyOrderStatusesResponseWith({
                  data: {
                    bcOrderStatuses: [
                      buildLegacyOrderStatusWith({
                        systemLabel: 'Awaiting Fulfillment',
                        customLabel: 'Being packed',
                      }),
                    ],
                  },
                }),
              ),
            ),
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({ status: 'AWAITING_FULFILLMENT' }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
          await userEvent.click(screen.getByRole('option', { name: 'Being packed' }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });
      });

      describe('as a B2B customer', () => {
        it('filters by status and date together', async () => {
          vi.setSystemTime(new Date('21 November 2022'));

          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

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
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({
                  status: 'PENDING',
                  dateRange: { from: '2022-11-15', to: '2022-11-26' },
                }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
          await userEvent.click(screen.getByRole('option', { name: 'Pending' }));

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });

        it('filters by date range', async () => {
          vi.setSystemTime(new Date('21 November 2022'));

          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({
                  dateRange: { from: '2022-11-15', to: '2022-11-26' },
                }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'From' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /15/ }));

          await userEvent.click(within(dialog).getByRole('textbox', { name: 'To' }));
          await userEvent.click(screen.getByRole('gridcell', { name: /26/ }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });

        it('resolves custom status label to the OrderStatusValue enum before sending', async () => {
          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetOrderStatuses', () =>
              HttpResponse.json(
                buildLegacyB2BOrderStatusesResponseWith({
                  data: {
                    orderStatuses: [
                      buildLegacyOrderStatusWith({
                        systemLabel: 'Pending',
                        customLabel: 'Awaiting',
                      }),
                    ],
                  },
                }),
              ),
            ),
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          when(getOrders)
            .calledWith(
              expect.objectContaining({
                filters: expect.objectContaining({ status: 'PENDING' }),
              }),
            )
            .thenReturn(filteredOrderResponse(66996));

          await userEvent.click(screen.getByRole('button', { name: /edit/ }));

          const dialog = await screen.findByRole('dialog', { name: 'Filters' });

          await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
          await userEvent.click(screen.getByRole('option', { name: 'Awaiting' }));

          await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

          await waitFor(() => {
            expect(screen.getByRole('row', { name: /66996/ })).toBeInTheDocument();
          });
        });

        // OrdersFiltersInput has only status and dateRange. companyIds was filtering a
        // customer-scoped list by the customer's own company — a no-op that 400s.
        it('never sends companyIds or companyName on the customer path', async () => {
          const getOrders = vi
            .fn()
            .mockReturnValue(buildSfGqlCustomerOrdersResponseWith('WHATEVER_VALUES'));

          server.use(
            graphql.query('GetCustomerOrders', ({ variables }) =>
              HttpResponse.json(getOrders(variables)),
            ),
          );

          renderWithProviders(<MyOrders />, { preloadedState: b2bStateWithFlag(flagOn) });

          await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

          expect(getOrders).toHaveBeenCalled();
          getOrders.mock.calls.forEach(([variables]) => {
            const filters = (variables as { filters?: Record<string, unknown> }).filters ?? {};
            expect(filters).not.toHaveProperty('companyIds');
            expect(filters).not.toHaveProperty('companyName');
          });
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
      ): GetCustomerOrdersResponse => ({
        data: {
          customer: {
            orders: {
              edges: orders.map((o) => ({
                node: buildSfGqlOrderWith(o),
                cursor: `cursor-${o.entityId}`,
              })),
              pageInfo,
            },
          },
        },
      });

      it('passes after cursor when navigating to the next page', async () => {
        const page1Response = buildPagedResponse([{ entityId: 1001 }, { entityId: 1002 }], {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-1001',
          endCursor: 'cursor-1002',
        });

        const getOrders = vi.fn().mockReturnValue(page1Response);

        // Page 2 when after cursor is sent
        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1002' }))
          .thenReturn(
            buildPagedResponse([{ entityId: 2001 }, { entityId: 2002 }], {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'cursor-2001',
              endCursor: 'cursor-2002',
            }),
          );

        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));
        expect(screen.getByRole('row', { name: /1001/ })).toBeInTheDocument();

        // Navigate to page 2
        await userEvent.click(screen.getByRole('button', { name: /next page/ }));

        await waitFor(() => {
          expect(screen.getByRole('row', { name: /2001/ })).toBeInTheDocument();
        });
      });

      it('passes before cursor when navigating to the previous page', async () => {
        const page1Response = buildPagedResponse([{ entityId: 1001 }], {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-1001',
          endCursor: 'cursor-1001',
        });

        const getOrders = vi.fn().mockReturnValue(page1Response);

        // Page 2
        when(getOrders)
          .calledWith(expect.objectContaining({ after: 'cursor-1001' }))
          .thenReturn(
            buildPagedResponse([{ entityId: 2001 }], {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'cursor-2001',
              endCursor: 'cursor-2001',
            }),
          );

        // Back to page 1 via before cursor
        when(getOrders)
          .calledWith(expect.objectContaining({ before: 'cursor-2001' }))
          .thenReturn(page1Response);

        server.use(
          graphql.query('GetCustomerOrders', ({ variables }) =>
            HttpResponse.json(getOrders(variables)),
          ),
        );

        renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        // Go to page 2
        await userEvent.click(screen.getByRole('button', { name: /next page/ }));
        await waitFor(() => {
          expect(screen.getByRole('row', { name: /2001/ })).toBeInTheDocument();
        });

        // Go back to page 1
        await userEvent.click(screen.getByRole('button', { name: /previous page/ }));
        await waitFor(() => {
          expect(screen.getByRole('row', { name: /1001/ })).toBeInTheDocument();
        });
      });

      it('hides total count and shows range-only pagination label', async () => {
        server.use(
          graphql.query('GetCustomerOrders', () =>
            HttpResponse.json(
              buildPagedResponse([{ entityId: 1001 }, { entityId: 1002 }, { entityId: 1003 }], {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: 'cursor-1001',
                endCursor: 'cursor-1003',
              }),
            ),
          ),
        );

        renderWithProviders(<MyOrders />, { preloadedState: b2cStateWithFlag(flagOn) });

        await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

        // With count=-1, pagination should not display "-1" as the total
        expect(screen.queryByText(/-1/)).not.toBeInTheDocument();
      });
    });
  });
});
