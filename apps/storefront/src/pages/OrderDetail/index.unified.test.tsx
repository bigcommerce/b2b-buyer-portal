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
} from 'tests/test-utils';

import { AddressConfig } from '@/shared/service/b2b/graphql/address';
import { CustomerOrderStatues, CustomerOrderStatus } from '@/shared/service/b2b/graphql/orders';
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

describe('Order detail path with B2B-4613 unified SF GQL flag ON', () => {
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
});
