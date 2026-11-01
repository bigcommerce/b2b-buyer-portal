import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  faker,
  getUnixTime,
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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { when } from 'vitest-when';

import type { SiteOrderStatus } from '@/shared/service/bc/graphql/orders';
import type { Locales } from '@/store/slices/global';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import type { CompanyOrderNode, CustomerOrderNode } from '../order/orders';

import MyOrders from '.';

const { server } = startMockServer();

const siteOrderStatuses: SiteOrderStatus[] = [
  { id: 1, origin: 'Pending', translation: '' },
  { id: 2, origin: 'Shipped', translation: '' },
  { id: 7, origin: 'Waiting for money', translation: '' },
];

const siteOrderStatusesResponse = (statuses: SiteOrderStatus[]) => ({
  data: { site: { settings: { orders: { statuses } } } },
});

const buildCustomerOrderNodeWith = builder<CustomerOrderNode>(() => ({
  node: {
    orderId: faker.number.int().toString(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    totalIncTax: faker.number.float(),
    poNumber: faker.number.int().toString(),
    status: 'Pending',
  },
}));

const buildCompanyOrderNodeWith = builder<CompanyOrderNode>(() => ({
  node: {
    orderId: faker.number.int().toString(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    totalIncTax: faker.number.float(),
    poNumber: faker.number.int().toString(),
    status: 'Pending',
    companyInfo: { companyName: faker.company.name() },
  },
}));

const customerOrdersResponse = (edges: CustomerOrderNode[]) => ({
  data: {
    customerOrders: {
      totalCount: edges.length,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      edges,
    },
  },
});

const companyOrdersResponse = (edges: CompanyOrderNode[]) => ({
  data: {
    allOrders: {
      totalCount: edges.length,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      edges,
    },
  },
});

const b2cState = (featureFlags: Record<string, boolean>, locales: Locales = []) => ({
  company: buildCompanyStateWith({ customer: { role: CustomerRole.B2C } }),
  global: buildGlobalStateWith({ featureFlags, locales }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
});

const b2bState = (featureFlags: Record<string, boolean>) => ({
  company: buildCompanyStateWith({
    customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
    companyInfo: { status: CompanyStatus.APPROVED },
  }),
  global: buildGlobalStateWith({ featureFlags }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
});

const legacyStatusesResponse = {
  data: {
    bcOrderStatuses: [{ statusCode: '1', systemLabel: 'Pending', customLabel: 'Legacy pending' }],
    orderStatuses: [{ statusCode: '1', systemLabel: 'Pending', customLabel: 'Legacy pending' }],
  },
};

describe('when the display translated order statuses experiment is on', () => {
  const featureFlags = { 'LOCAL-3680.B2B_display_translated_order_statuses': true };
  const getLegacyStatuses = vi.fn();

  beforeEach(() => {
    getLegacyStatuses.mockClear();

    server.use(
      graphql.query('GetSiteOrderStatuses', () =>
        HttpResponse.json(siteOrderStatusesResponse(siteOrderStatuses)),
      ),
      graphql.query('GetCustomerOrderStatuses', () => {
        getLegacyStatuses();
        return HttpResponse.json(legacyStatusesResponse);
      }),
      graphql.query('GetOrderStatuses', () => {
        getLegacyStatuses();
        return HttpResponse.json(legacyStatusesResponse);
      }),
    );
  });

  describe('and a personal customer views their orders', () => {
    it('shows the status label from the site order statuses', async () => {
      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            customerOrdersResponse([
              buildCustomerOrderNodeWith({
                node: { orderId: '66996', status: 'Awaiting Payment' },
              }),
            ]),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2cState(featureFlags) });

      const row = await screen.findByRole('row', { name: /66996/ });

      await waitFor(() => {
        expect(within(row).getByRole('cell', { name: 'Waiting for money' })).toBeInTheDocument();
      });
      expect(getLegacyStatuses).not.toHaveBeenCalled();
    });

    it('filters orders by a status listed in the site order statuses', async () => {
      const getOrders = vi
        .fn()
        .mockReturnValue(customerOrdersResponse([buildCustomerOrderNodeWith('WHATEVER_VALUES')]));

      server.use(
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getOrders(query))),
      );

      when(getOrders)
        .calledWith(stringContainingAll('status: "Awaiting Payment"'))
        .thenReturn(
          customerOrdersResponse([buildCustomerOrderNodeWith({ node: { orderId: '66996' } })]),
        );

      renderWithProviders(<MyOrders />, { preloadedState: b2cState(featureFlags) });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: /edit/ }));

      const dialog = await screen.findByRole('dialog', { name: 'Filters' });

      await userEvent.click(within(dialog).getByRole('combobox', { name: 'Order status' }));

      expect(screen.getByRole('option', { name: 'Shipped' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Pending' })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('option', { name: 'Waiting for money' }));
      await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

      expect(await screen.findByRole('row', { name: /66996/ })).toBeInTheDocument();
    });
  });

  describe('and a personal customer views their orders on a French storefront', () => {
    const originalLocation = window.location;
    const locales: Locales = [
      { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
      { code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' },
    ];

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, href: 'https://store.example.com/fr/account.php' },
        writable: true,
      });

      server.use(
        graphql.query('GetCustomerOrders', () =>
          HttpResponse.json(
            customerOrdersResponse([
              buildCustomerOrderNodeWith({
                node: { orderId: '66996', status: 'Awaiting Payment' },
              }),
            ]),
          ),
        ),
      );
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    });

    it('shows the bundled French label when the status has no translation', async () => {
      server.use(
        graphql.query('GetSiteOrderStatuses', () =>
          HttpResponse.json(
            siteOrderStatusesResponse([{ id: 7, origin: 'Awaiting Payment', translation: '' }]),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2cState(featureFlags, locales) });

      const row = await screen.findByRole('row', { name: /66996/ });

      await waitFor(() => {
        expect(
          within(row).getByRole('cell', { name: 'En attente de paiement' }),
        ).toBeInTheDocument();
      });
    });

    it('shows the translation from the site order statuses over the bundled label', async () => {
      server.use(
        graphql.query('GetSiteOrderStatuses', () =>
          HttpResponse.json(
            siteOrderStatusesResponse([
              { id: 7, origin: 'Awaiting Payment', translation: 'Paiement en cours' },
            ]),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2cState(featureFlags, locales) });

      const row = await screen.findByRole('row', { name: /66996/ });

      await waitFor(() => {
        expect(within(row).getByRole('cell', { name: 'Paiement en cours' })).toBeInTheDocument();
      });
    });
  });

  describe('and a company customer views their orders', () => {
    it('shows the status label from the site order statuses', async () => {
      server.use(
        graphql.query('GetAllOrders', () =>
          HttpResponse.json(
            companyOrdersResponse([
              buildCompanyOrderNodeWith({ node: { orderId: '66996', status: 'Awaiting Payment' } }),
            ]),
          ),
        ),
      );

      renderWithProviders(<MyOrders />, { preloadedState: b2bState(featureFlags) });

      const row = await screen.findByRole('row', { name: /66996/ });

      await waitFor(() => {
        expect(within(row).getByRole('cell', { name: 'Waiting for money' })).toBeInTheDocument();
      });
      expect(getLegacyStatuses).not.toHaveBeenCalled();
    });
  });
});

describe('when the display translated order statuses experiment is off', () => {
  it('keeps using the legacy order status queries', async () => {
    const getSiteOrderStatuses = vi.fn();

    server.use(
      graphql.query('GetSiteOrderStatuses', () => {
        getSiteOrderStatuses();
        return HttpResponse.json(siteOrderStatusesResponse(siteOrderStatuses));
      }),
      graphql.query('GetCustomerOrderStatuses', () => HttpResponse.json(legacyStatusesResponse)),
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json(
          customerOrdersResponse([
            buildCustomerOrderNodeWith({ node: { orderId: '66996', status: 'Pending' } }),
          ]),
        ),
      ),
    );

    renderWithProviders(<MyOrders />, { preloadedState: b2cState({}) });

    const row = await screen.findByRole('row', { name: /66996/ });

    await waitFor(() => {
      expect(within(row).getByRole('cell', { name: 'Legacy pending' })).toBeInTheDocument();
    });
    expect(getSiteOrderStatuses).not.toHaveBeenCalled();
  });
});
