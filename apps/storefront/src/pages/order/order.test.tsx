import {
  buildCompanyStateWith,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  renderWithProviders,
  screen,
  waitFor,
} from 'tests/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompanyStatus, CustomerRole, LoginTypes, UserTypes } from '@/types';

import Order from './Order';
import * as ordersApi from './orders';

vi.mock('@/hooks/useMobile', () => ({
  useMobile: () => [false] as const,
}));

const legacyOrderEdges = [
  {
    node: {
      orderId: '1001',
      createdAt: 1_700_000_000,
      totalIncTax: 99,
      money: '',
      poNumber: 'PO-1001',
      status: 'Awaiting Fulfillment',
      firstName: 'Alex',
      lastName: 'Buyer',
      companyInfo: { companyName: 'Acme Co' },
    },
  },
  {
    node: {
      orderId: '1002',
      createdAt: 1_700_086_400,
      totalIncTax: 149.5,
      money: '',
      poNumber: 'PO-1002',
      status: 'Shipped',
      firstName: 'Jordan',
      lastName: 'Lee',
      companyInfo: { companyName: 'Beta Trading' },
    },
  },
  {
    node: {
      orderId: '1003',
      createdAt: 1_700_172_800,
      totalIncTax: 220,
      money: '',
      poNumber: '',
      status: 'Completed',
      firstName: 'Morgan',
      lastName: 'Chen',
      companyInfo: { companyName: 'Gamma Supply' },
    },
  },
  {
    node: {
      orderId: '1004',
      createdAt: 1_700_259_200,
      totalIncTax: 45,
      money: '',
      poNumber: 'PO-REF-9',
      status: 'Awaiting Payment',
      firstName: 'Riley',
      lastName: 'Patel',
      companyInfo: { companyName: 'Acme Co' },
    },
  },
  {
    node: {
      orderId: '1005',
      createdAt: 1_700_345_600,
      totalIncTax: 12,
      money: '',
      poNumber: 'PO-X',
      status: 'Cancelled',
      firstName: 'Sam',
      lastName: 'Rivera',
      companyInfo: { companyName: 'Delta Freight' },
    },
  },
  {
    node: {
      orderId: '1006',
      createdAt: 1_700_432_000,
      totalIncTax: 88,
      money: '',
      poNumber: '',
      status: 'Pending',
      firstName: 'Taylor',
      lastName: 'Wong',
      companyInfo: { companyName: 'Epsilon Retail' },
    },
  },
];

const listResponse = {
  edges: legacyOrderEdges,
  totalCount: legacyOrderEdges.length,
};

/** Matches each order `status` after `fetchLegacyOrders` unwraps `node`, for `getOrderStatusText` */
const orderStatusRows = [
  {
    systemLabel: 'Awaiting Fulfillment',
    customLabel: 'Awaiting fulfillment',
    statusCode: '10',
  },
  {
    systemLabel: 'Shipped',
    customLabel: 'Shipped',
    statusCode: '11',
  },
  {
    systemLabel: 'Completed',
    customLabel: 'Completed',
    statusCode: '12',
  },
  {
    systemLabel: 'Awaiting Payment',
    customLabel: 'Awaiting payment',
    statusCode: '13',
  },
  {
    systemLabel: 'Cancelled',
    customLabel: 'Order cancelled',
    statusCode: '14',
  },
  {
    systemLabel: 'Pending',
    customLabel: 'On hold pending review',
    statusCode: '15',
  },
];

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
  b2bFeatures: {
    masqueradeCompany: {
      id: 0,
      isAgenting: false,
      companyName: '',
      customerGroupId: 0,
    },
    _persist: { version: 1, rehydrated: true },
  },
};

describe('Orders list (UI)', () => {
  beforeEach(() => {
    vi.spyOn(ordersApi, 'getB2BAllOrders').mockResolvedValue(listResponse);
    vi.spyOn(ordersApi, 'getBCAllOrders').mockResolvedValue(listResponse);
    vi.spyOn(ordersApi, 'getOrderStatusType').mockResolvedValue(orderStatusRows);
    vi.spyOn(ordersApi, 'getBcOrderStatusType').mockResolvedValue(orderStatusRows);
    vi.spyOn(ordersApi, 'getCreatedByUserForOrders').mockResolvedValue({
      createdByUser: { results: [] },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows Company and Placed by columns on company orders for an approved B2B buyer', async () => {
    renderWithProviders(<Order isCompanyOrder />, {
      preloadedState: basePreloaded,
    });

    await waitFor(() => {
      expect(screen.getByTestId('tableHead-orderId')).toBeVisible();
    });
    expect(screen.getByTestId('tableHead-companyName')).toBeVisible();
    expect(screen.getByTestId('tableHead-placedBy')).toBeVisible();

    const placedByCells = screen.getAllByTestId('tableBody-placedBy');
    expect(placedByCells.map((cell) => cell.textContent?.trim())).toEqual([
      'Alex Buyer',
      'Jordan Lee',
      'Morgan Chen',
      'Riley Patel',
      'Sam Rivera',
      'Taylor Wong',
    ]);

    await waitFor(() => {
      const statusCells = screen.getAllByTestId('tableBody-status');
      expect(statusCells.map((cell) => cell.textContent?.trim())).toEqual([
        'Awaiting fulfillment',
        'Shipped',
        'Completed',
        'Awaiting payment',
        'Order cancelled',
        'On hold pending review',
      ]);
    });
  });

  it('shows Company but not Placed by on the non-company orders list for an approved B2B buyer', async () => {
    renderWithProviders(<Order isCompanyOrder={false} />, {
      preloadedState: basePreloaded,
    });

    await waitFor(() => {
      expect(screen.getByTestId('tableHead-orderId')).toBeVisible();
    });
    expect(screen.getByTestId('tableHead-companyName')).toBeVisible();
    expect(screen.queryByTestId('tableHead-placedBy')).not.toBeInTheDocument();
  });

  it('does not show Placed by for a super admin who is not agenting, on company orders', async () => {
    renderWithProviders(<Order isCompanyOrder />, {
      preloadedState: { ...basePreloaded, company: superAdminCompany },
    });

    await waitFor(() => {
      expect(screen.getByTestId('tableHead-orderId')).toBeVisible();
    });
    expect(screen.queryByTestId('tableHead-placedBy')).not.toBeInTheDocument();
  });

  it('does not show Company or Placed by for a BC shopper', async () => {
    renderWithProviders(<Order isCompanyOrder={false} />, {
      preloadedState: { ...basePreloaded, company: bcCustomerCompany },
    });

    await waitFor(() => {
      expect(screen.getByTestId('tableHead-orderId')).toBeVisible();
    });
    expect(screen.queryByTestId('tableHead-companyName')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tableHead-placedBy')).not.toBeInTheDocument();
  });

  it('shows Placed by for a super admin who is agenting, on company orders', async () => {
    renderWithProviders(<Order isCompanyOrder />, {
      preloadedState: {
        ...basePreloaded,
        company: superAdminCompany,
        b2bFeatures: {
          masqueradeCompany: {
            id: 1,
            isAgenting: true,
            companyName: 'Other',
            customerGroupId: 0,
          },
          _persist: { version: 1, rehydrated: true },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('tableHead-orderId')).toBeVisible();
    });
    expect(screen.getByTestId('tableHead-placedBy')).toBeVisible();
  });
});
