import {
  buildB2BFeaturesStateWith,
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  bulk,
  faker,
  getUnixTime,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
  within,
} from 'tests/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { SiteOrderStatus } from '@/shared/service/bc/graphql/orders';
import { CompanyStatus, CustomerRole, LoginTypes, UserTypes } from '@/types';

import Order from './Order';
import { CompanyOrderNode, GetCompanyOrders } from './orders';

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

const buildOrderStatusWith = builder<SiteOrderStatus>(() => ({
  origin: faker.word.noun(),
  translation: faker.word.noun(),
  value: 'SHIPPED',
}));

const buildSiteOrderStatusesResponse = (orderStatuses: SiteOrderStatus[]) => ({
  data: { site: { settings: { orderStatuses } } },
});

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
      graphql.query('GetSiteOrderStatuses', () =>
        HttpResponse.json(
          buildSiteOrderStatusesResponse(bulk(buildOrderStatusWith, 'WHATEVER_VALUES').times(3)),
        ),
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
        origin: 'Awaiting Fulfillment',
        translation: 'Awaiting Fulfillment',
        value: 'AWAITING_FULFILLMENT',
      }),
      buildOrderStatusWith({ origin: 'Shipped', translation: 'Shipped', value: 'SHIPPED' }),
      buildOrderStatusWith({ origin: 'Completed', translation: 'Completed', value: 'COMPLETED' }),
      buildOrderStatusWith({
        origin: 'Awaiting Payment',
        translation: 'Awaiting Payment',
        value: 'AWAITING_PAYMENT',
      }),
      buildOrderStatusWith({ origin: 'Cancelled', translation: 'Cancelled', value: 'CANCELLED' }),
      buildOrderStatusWith({ origin: 'Pending', translation: 'Pending', value: 'PENDING' }),
    ];

    server.use(
      graphql.query('GetSiteOrderStatuses', () =>
        HttpResponse.json(buildSiteOrderStatusesResponse(orderStatuses)),
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

    renderWithProviders(<Order isCompanyOrder />, {
      preloadedState: {
        ...basePreloaded,
        lang: {
          translations: {
            'orders.status.awaitingFulfillment': 'Awaiting fulfillment',
            'orders.status.awaitingPayment': 'Awaiting payment',
            'orders.status.cancelled': 'Order cancelled',
            'orders.status.pending': 'On hold pending review',
          },
          fetchedPages: [],
          translationVersion: 0,
          _persist: { version: -1, rehydrated: true },
        },
      },
    });

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
