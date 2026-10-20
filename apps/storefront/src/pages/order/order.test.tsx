import {
  buildB2BFeaturesStateWith,
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildSfGqlMoneyWith,
  buildStoreInfoStateWith,
  bulk,
  faker,
  getUnixTime,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitFor,
  within,
} from 'tests/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type {
  GetCustomerOrdersResponse,
  Order as SfGqlOrder,
} from '@/shared/service/bc/graphql/orders';
import { CompanyStatus, CustomerRole, LoginTypes, UserTypes } from '@/types';

import Order from './Order';
import {
  CompanyOrderNode,
  CompanyOrderStatuses,
  CustomerOrderStatues,
  GetCompanyOrders,
  OrderStatus,
} from './orders';

vi.mock('@/hooks/useMobile', () => ({
  useMobile: () => [false] as const,
}));

const { server } = startMockServer();

function getBodyCellsForColumn(columnAccessibleName: string) {
  const headers = screen.getAllByRole('columnheader');
  const columnHeader = screen.getByRole('columnheader', { name: columnAccessibleName });
  const columnIndex = headers.indexOf(columnHeader);

  return screen
    .getAllByRole('row')
    .filter((row) => within(row).queryAllByRole('cell').length > 0)
    .map((row) => within(row).getAllByRole('cell')[columnIndex]);
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const buildOrderStatusWith = builder<OrderStatus>(() => ({
  statusCode: faker.number.int().toString(),
  systemLabel: faker.word.noun(),
  customLabel: faker.word.noun(),
}));

const buildCompanyOrderNodeWith = builder<CompanyOrderNode>(() => ({
  node: {
    orderId: faker.number.int({ min: 1000, max: 9999 }).toString(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    totalIncTax: faker.number.float({ min: 10, max: 1000 }),
    money: '',
    poNumber: faker.string.alphanumeric(6),
    status: faker.word.noun(),
    companyInfo: { companyName: faker.company.name() },
  },
}));

const buildGetAllOrdersWith = builder<GetCompanyOrders>(() => ({
  data: {
    allOrders: {
      totalCount: 3,
      edges: bulk(buildCompanyOrderNodeWith, 'WHATEVER_VALUES').times(3),
    },
  },
}));

const buildCompanyOrderStatusesWith = builder<CompanyOrderStatuses>(() => ({
  data: {
    orderStatuses: bulk(buildOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

const buildBcOrderStatusesWith = builder<CustomerOrderStatues>(() => ({
  data: {
    bcOrderStatuses: bulk(buildOrderStatusWith, 'WHATEVER_VALUES').times(3),
  },
}));

// ---------------------------------------------------------------------------
// Preloaded states
// ---------------------------------------------------------------------------

const defaultCompanyState = buildCompanyStateWith('WHATEVER_VALUES');

const approvedB2bBuyerCompany = buildCompanyStateWith({
  permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
  companyInfo: { id: '42', status: CompanyStatus.APPROVED, companyName: 'Co' },
  customer: {
    userType: UserTypes.MULTIPLE_B2C,
    role: CustomerRole.SENIOR_BUYER,
    loginType: LoginTypes.GENERAL_LOGIN,
  },
  pagesSubsidiariesPermission: {
    ...defaultCompanyState.pagesSubsidiariesPermission,
    order: true,
  },
  companyHierarchyInfo: {
    ...defaultCompanyState.companyHierarchyInfo,
    isEnabledCompanyHierarchy: false,
  },
});

const superAdminCompany = buildCompanyStateWith({
  ...approvedB2bBuyerCompany,
  customer: {
    ...approvedB2bBuyerCompany.customer,
    role: CustomerRole.SUPER_ADMIN,
  },
});

const bcCustomerCompany = buildCompanyStateWith({
  companyInfo: { id: '1', status: CompanyStatus.DEFAULT, companyName: '' },
  customer: {
    userType: UserTypes.B2C,
    role: CustomerRole.ADMIN,
    loginType: LoginTypes.GENERAL_LOGIN,
  },
});

const basePreloaded = {
  company: approvedB2bBuyerCompany,
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
  global: buildGlobalStateWith({
    featureFlags: {
      'B2B-4613.buyer_portal_unified_sf_gql_orders': false,
    },
  }),
  b2bFeatures: buildB2BFeaturesStateWith({
    masqueradeCompany: { id: 0, isAgenting: false, companyName: '', customerGroupId: 0 },
  }),
};

const agentingPreloaded = {
  ...basePreloaded,
  company: superAdminCompany,
  b2bFeatures: buildB2BFeaturesStateWith({
    masqueradeCompany: { id: 1, isAgenting: true, companyName: 'Other', customerGroupId: 0 },
  }),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Orders list (UI)', () => {
  beforeEach(() => {
    server.use(
      // B2B order statuses (used when isB2BUser = true)
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json(buildCompanyOrderStatusesWith('WHATEVER_VALUES')),
      ),
      // BC order statuses (used when isB2BUser = false)
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildBcOrderStatusesWith('WHATEVER_VALUES')),
      ),
      // B2B orders — legacy path (GetAllOrders operation name)
      graphql.query('GetAllOrders', () =>
        HttpResponse.json(buildGetAllOrdersWith('WHATEVER_VALUES')),
      ),
      // BC orders — legacy path (GetCustomerOrders operation name, distinct from SF GQL path
      // because the flag is OFF for all tests in this file)
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json({
          data: {
            customerOrders: {
              totalCount: 3,
              edges: bulk(buildCompanyOrderNodeWith, 'WHATEVER_VALUES').times(3),
            },
          },
        }),
      ),
      // Created-by lookup — only triggered for isB2BUser && isCompanyOrder
      graphql.query('GetOrdersCreatedByUser', () =>
        HttpResponse.json({ data: { createdByUser: { results: [] } } }),
      ),
    );
  });

  it('shows Company and Placed by columns on company orders for an approved B2B buyer', async () => {
    const orderStatuses = [
      buildOrderStatusWith({
        systemLabel: 'Awaiting Fulfillment',
        customLabel: 'Awaiting fulfillment',
      }),
      buildOrderStatusWith({ systemLabel: 'Shipped', customLabel: 'Shipped' }),
      buildOrderStatusWith({ systemLabel: 'Completed', customLabel: 'Completed' }),
      buildOrderStatusWith({ systemLabel: 'Awaiting Payment', customLabel: 'Awaiting payment' }),
      buildOrderStatusWith({ systemLabel: 'Cancelled', customLabel: 'Order cancelled' }),
      buildOrderStatusWith({ systemLabel: 'Pending', customLabel: 'On hold pending review' }),
    ];

    server.use(
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json({ data: { orderStatuses } } satisfies CompanyOrderStatuses),
      ),
      graphql.query('GetAllOrders', () =>
        HttpResponse.json({
          data: {
            allOrders: {
              totalCount: 6,
              edges: [
                buildCompanyOrderNodeWith({
                  node: {
                    orderId: '1001',
                    firstName: 'Alex',
                    lastName: 'Buyer',
                    status: 'Awaiting Fulfillment',
                  },
                }),
                buildCompanyOrderNodeWith({
                  node: {
                    orderId: '1002',
                    firstName: 'Jordan',
                    lastName: 'Lee',
                    status: 'Shipped',
                  },
                }),
                buildCompanyOrderNodeWith({
                  node: {
                    orderId: '1003',
                    firstName: 'Morgan',
                    lastName: 'Chen',
                    status: 'Completed',
                  },
                }),
                buildCompanyOrderNodeWith({
                  node: {
                    orderId: '1004',
                    firstName: 'Riley',
                    lastName: 'Patel',
                    status: 'Awaiting Payment',
                  },
                }),
                buildCompanyOrderNodeWith({
                  node: {
                    orderId: '1005',
                    firstName: 'Sam',
                    lastName: 'Rivera',
                    status: 'Cancelled',
                  },
                }),
                buildCompanyOrderNodeWith({
                  node: {
                    orderId: '1006',
                    firstName: 'Taylor',
                    lastName: 'Wong',
                    status: 'Pending',
                  },
                }),
              ],
            },
          },
        }),
      ),
    );

    renderWithProviders(<Order isCompanyOrder />, { preloadedState: basePreloaded });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    });

    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Placed by' })).toBeVisible();

    expect(getBodyCellsForColumn('Placed by').map((cell) => cell.textContent?.trim())).toEqual([
      'Alex Buyer',
      'Jordan Lee',
      'Morgan Chen',
      'Riley Patel',
      'Sam Rivera',
      'Taylor Wong',
    ]);

    await waitFor(() => {
      expect(getBodyCellsForColumn('Order status').map((cell) => cell.textContent?.trim())).toEqual(
        [
          'Awaiting fulfillment',
          'Shipped',
          'Completed',
          'Awaiting payment',
          'Order cancelled',
          'On hold pending review',
        ],
      );
    });
  });

  it('shows the GetOrderStatuses custom label on the legacy list when translated statuses is on but unified orders is off', async () => {
    const csvText = faker.lorem.words(3);
    const customLabel = faker.lorem.words(2);

    server.use(
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json({
          data: {
            orderStatuses: [buildOrderStatusWith({ systemLabel: 'Shipped', customLabel })],
          },
        } satisfies CompanyOrderStatuses),
      ),
      graphql.query('GetAllOrders', () =>
        HttpResponse.json({
          data: {
            allOrders: {
              totalCount: 1,
              edges: [
                buildCompanyOrderNodeWith({
                  node: { status: 'Shipped' },
                }),
              ],
            },
          },
        }),
      ),
    );

    renderWithProviders(<Order isCompanyOrder />, {
      preloadedState: {
        ...basePreloaded,
        global: buildGlobalStateWith({
          featureFlags: {
            'B2B-4613.buyer_portal_unified_sf_gql_orders': false,
            'LOCAL-3680.B2B_display_translated_order_statuses': true,
          },
        }),
        lang: {
          translations: { 'orders.status.shipped': csvText },
          fetchedPages: ['global'],
          translationVersion: 1,
          _persist: { version: -1, rehydrated: true },
        },
      },
    });

    await waitFor(() => {
      expect(getBodyCellsForColumn('Order status').map((cell) => cell.textContent?.trim())).toEqual(
        [customLabel],
      );
    });
    expect(screen.queryByText(csvText)).not.toBeInTheDocument();
  });

  it('shows Company but not Placed by on the non-company orders list for an approved B2B buyer', async () => {
    renderWithProviders(<Order isCompanyOrder={false} />, { preloadedState: basePreloaded });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    });

    expect(screen.getByRole('columnheader', { name: 'Company' })).toBeVisible();
    expect(screen.queryByRole('columnheader', { name: 'Placed by' })).not.toBeInTheDocument();
  });

  it('does not show Placed by for a super admin who is not agenting, on company orders', async () => {
    renderWithProviders(<Order isCompanyOrder />, {
      preloadedState: { ...basePreloaded, company: superAdminCompany },
    });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    });

    expect(screen.queryByRole('columnheader', { name: 'Placed by' })).not.toBeInTheDocument();
  });

  it('does not show Company or Placed by for a BC shopper', async () => {
    renderWithProviders(<Order isCompanyOrder={false} />, {
      preloadedState: { ...basePreloaded, company: bcCustomerCompany },
    });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    });

    expect(screen.queryByRole('columnheader', { name: 'Company' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Placed by' })).not.toBeInTheDocument();
  });

  it('shows Placed by for a super admin who is agenting, on company orders', async () => {
    renderWithProviders(<Order isCompanyOrder />, { preloadedState: agentingPreloaded });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    });

    expect(screen.getByRole('columnheader', { name: 'Placed by' })).toBeVisible();
  });

  it('does not show Placed by for a super admin who is agenting, on My Orders', async () => {
    // isCompanyOrder is false, which is sufficient to hide placedBy regardless of agenting status.
    renderWithProviders(<Order isCompanyOrder={false} />, { preloadedState: agentingPreloaded });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    });

    expect(screen.queryByRole('columnheader', { name: 'Placed by' })).not.toBeInTheDocument();
  });
});

describe('Orders list status labels (unified SF GQL orders)', () => {
  const buildSfGqlOrderWith = builder<SfGqlOrder>(() => ({
    entityId: faker.number.int({ min: 1000, max: 99999 }),
    orderedAt: { utc: faker.date.past().toISOString() },
    updatedAt: { utc: faker.date.past().toISOString() },
    status: { value: 'SHIPPED', label: faker.lorem.words(2) },
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
    shippingCostTotal: buildSfGqlMoneyWith({ value: 0 }),
    handlingCostTotal: buildSfGqlMoneyWith({ value: 0 }),
    wrappingCostTotal: buildSfGqlMoneyWith({ value: 0 }),
    taxTotal: buildSfGqlMoneyWith({ value: 0 }),
    totalIncTax: buildSfGqlMoneyWith({ value: 100 }),
    isTaxIncluded: false,
    taxes: [],
    discounts: {
      couponDiscounts: [],
      nonCouponDiscountTotal: buildSfGqlMoneyWith({ value: 0 }),
      totalDiscount: null,
    },
    customerMessage: null,
    totalProductQuantity: 1,
    consignments: null,
    reference: null,
    poNumber: faker.string.alphanumeric(6),
    company: { entityId: faker.number.int({ min: 1, max: 999 }), name: faker.company.name() },
    placedBy: null,
    history: [],
    invoice: null,
  }));

  const buildCustomerOrdersResponseWith = (orders: SfGqlOrder[]): GetCustomerOrdersResponse => ({
    data: {
      customer: {
        orders: {
          edges: orders.map((node) => ({ node, cursor: faker.string.alphanumeric(20) })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: faker.string.alphanumeric(20),
            endCursor: faker.string.alphanumeric(20),
          },
        },
      },
    },
  });

  const unifiedPreloaded = {
    ...basePreloaded,
    global: buildGlobalStateWith({
      featureFlags: {
        'B2B-4613.buyer_portal_unified_sf_gql_orders': true,
        'LOCAL-3680.B2B_display_translated_order_statuses': true,
      },
    }),
  };

  const withCsv = (translations: Record<string, string>) => ({
    translations,
    fetchedPages: ['global'],
    translationVersion: 1,
    _persist: { version: -1, rehydrated: true },
  });

  const mockStatuses = (statuses: OrderStatus[]) =>
    server.use(
      graphql.query('GetOrderStatuses', () =>
        HttpResponse.json({ data: { orderStatuses: statuses } } satisfies CompanyOrderStatuses),
      ),
    );

  it('shows the merchant CSV translation in the default language', async () => {
    const csvText = faker.lorem.words(3);
    const order = buildSfGqlOrderWith({
      status: { value: 'SHIPPED', label: faker.lorem.words(2) },
    });

    server.use(
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(buildCustomerOrdersResponseWith([order])),
      ),
    );

    renderWithProviders(<Order />, {
      preloadedState: { ...unifiedPreloaded, lang: withCsv({ 'orders.status.shipped': csvText }) },
    });

    expect(await screen.findByText(csvText)).toBeInTheDocument();
    expect(screen.queryByText(order.status.label)).not.toBeInTheDocument();
  });

  it('shows the status custom label instead of the translation when the translated statuses flag is off', async () => {
    const csvText = faker.lorem.words(3);
    const customLabel = faker.lorem.words(2);
    const order = buildSfGqlOrderWith({
      status: { value: 'SHIPPED', label: faker.lorem.words(2) },
    });

    mockStatuses([buildOrderStatusWith({ systemLabel: 'Shipped', customLabel })]);
    server.use(
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(buildCustomerOrdersResponseWith([order])),
      ),
    );

    renderWithProviders(<Order />, {
      preloadedState: {
        ...unifiedPreloaded,
        global: buildGlobalStateWith({
          featureFlags: {
            'B2B-4613.buyer_portal_unified_sf_gql_orders': true,
            'LOCAL-3680.B2B_display_translated_order_statuses': false,
          },
        }),
        lang: withCsv({ 'orders.status.shipped': csvText }),
      },
    });

    expect(await screen.findByText(customLabel)).toBeInTheDocument();
    expect(screen.queryByText(csvText)).not.toBeInTheDocument();
    expect(screen.queryByText(order.status.label)).not.toBeInTheDocument();
  });

  it('shows the backend status label in the default language when there is no CSV translation', async () => {
    const label = faker.lorem.words(2);
    const order = buildSfGqlOrderWith({ status: { value: 'SHIPPED', label } });

    server.use(
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(buildCustomerOrdersResponseWith([order])),
      ),
    );

    renderWithProviders(<Order />, { preloadedState: unifiedPreloaded });

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('shows the backend status label in an additional language even when a CSV translation exists', async () => {
    const label = faker.lorem.words(2);
    const csvText = faker.lorem.words(3);
    const order = buildSfGqlOrderWith({ status: { value: 'SHIPPED', label } });

    server.use(
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(buildCustomerOrdersResponseWith([order])),
      ),
    );

    renderWithProviders(<Order />, {
      preloadedState: {
        ...unifiedPreloaded,
        global: buildGlobalStateWith({
          featureFlags: {
            'B2B-4613.buyer_portal_unified_sf_gql_orders': true,
            'LOCAL-3680.B2B_display_translated_order_statuses': true,
          },
          locales: [
            { code: 'en', isDefault: true, fullPath: 'http://not-the-current-host.test/' },
            { code: 'fr', isDefault: false, fullPath: `${window.location.origin}/` },
          ],
        }),
        lang: withCsv({ 'orders.status.shipped': csvText }),
      },
    });

    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.queryByText(csvText)).not.toBeInTheDocument();
  });

  it('applies the resolved label to legacy fallback rows when the flag is on', async () => {
    const csvText = faker.lorem.words(3);
    const legacyOrderId = faker.number.int({ min: 100000, max: 999999 }).toString();
    const user = userEvent.setup();

    server.use(
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(
          buildCustomerOrdersResponseWith([
            buildSfGqlOrderWith({ status: { value: 'SHIPPED', label: faker.lorem.words(2) } }),
          ]),
        ),
      ),
      graphql.query('GetAllOrders', () =>
        HttpResponse.json({
          data: {
            allOrders: {
              totalCount: 1,
              edges: [
                buildCompanyOrderNodeWith({
                  node: { orderId: legacyOrderId, status: 'Shipped' },
                }),
              ],
            },
          },
        }),
      ),
    );

    renderWithProviders(<Order />, {
      preloadedState: { ...unifiedPreloaded, lang: withCsv({ 'orders.status.shipped': csvText }) },
    });

    await screen.findByText(csvText);

    // Searching routes the list through the legacy GetAllOrders query.
    await user.type(screen.getByRole('textbox'), faker.string.alpha(5));
    await user.keyboard('{Enter}');

    await screen.findByText(legacyOrderId);

    expect(getBodyCellsForColumn('Order status').map((cell) => cell.textContent?.trim())).toEqual([
      csvText,
    ]);
  });

  it('shows the system status label on legacy fallback rows when there is no CSV translation', async () => {
    const sfGqlLabel = faker.lorem.words(2);
    const legacyOrderId = faker.number.int({ min: 100000, max: 999999 }).toString();
    const user = userEvent.setup();

    server.use(
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(
          buildCustomerOrdersResponseWith([
            buildSfGqlOrderWith({
              status: { value: 'MANUAL_VERIFICATION_REQUIRED', label: sfGqlLabel },
            }),
          ]),
        ),
      ),
      graphql.query('GetAllOrders', () =>
        HttpResponse.json({
          data: {
            allOrders: {
              totalCount: 1,
              edges: [
                buildCompanyOrderNodeWith({
                  node: { orderId: legacyOrderId, status: 'Manual Verification Required' },
                }),
              ],
            },
          },
        }),
      ),
    );

    renderWithProviders(<Order />, {
      preloadedState: { ...unifiedPreloaded, lang: withCsv({}) },
    });

    await screen.findByText(sfGqlLabel);

    // Searching routes the list through the legacy GetAllOrders query.
    await user.type(screen.getByRole('textbox'), faker.string.alpha(5));
    await user.keyboard('{Enter}');

    await screen.findByText(legacyOrderId);

    expect(getBodyCellsForColumn('Order status').map((cell) => cell.textContent?.trim())).toEqual([
      'Manual Verification Required',
    ]);
  });

  it('lists translated status labels in the filter and sends the status enum when one is selected', async () => {
    const csvText = faker.lorem.words(3);
    const getOrders = vi.fn();

    mockStatuses([
      buildOrderStatusWith({
        statusCode: '9',
        systemLabel: 'Shipped',
        customLabel: faker.lorem.words(2),
      }),
    ]);
    server.use(
      graphql.query('GetCustomerOrders', ({ variables }) => {
        getOrders(variables);
        return HttpResponse.json(
          buildCustomerOrdersResponseWith([buildSfGqlOrderWith('WHATEVER_VALUES')]),
        );
      }),
    );

    renderWithProviders(<Order />, {
      preloadedState: { ...unifiedPreloaded, lang: withCsv({ 'orders.status.shipped': csvText }) },
    });

    await userEvent.click(await screen.findByRole('button', { name: /edit/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Filters' });

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
    await userEvent.click(await screen.findByRole('option', { name: csvText }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ status: 'SHIPPED' }) }),
      );
    });
  });

  it('sends the selected status when another status has a custom label equal to its system label', async () => {
    const shippedText = faker.lorem.words(3);
    const completedText = faker.lorem.words(3);
    const getOrders = vi.fn();

    mockStatuses([
      buildOrderStatusWith({
        statusCode: '2',
        systemLabel: 'Shipped',
        customLabel: 'Completed',
      }),
      buildOrderStatusWith({
        statusCode: '10',
        systemLabel: 'Completed',
        customLabel: faker.lorem.words(2),
      }),
    ]);
    server.use(
      graphql.query('GetCustomerOrders', ({ variables }) => {
        getOrders(variables);
        return HttpResponse.json(
          buildCustomerOrdersResponseWith([buildSfGqlOrderWith('WHATEVER_VALUES')]),
        );
      }),
    );

    renderWithProviders(<Order />, {
      preloadedState: {
        ...unifiedPreloaded,
        lang: withCsv({
          'orders.status.shipped': shippedText,
          'orders.status.completed': completedText,
        }),
      },
    });

    await userEvent.click(await screen.findByRole('button', { name: /edit/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Filters' });

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));
    await userEvent.click(await screen.findByRole('option', { name: completedText }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ status: 'COMPLETED' }) }),
      );
    });
  });
});
