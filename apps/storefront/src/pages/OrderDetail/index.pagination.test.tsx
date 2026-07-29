import { Route, Routes } from 'react-router-dom';
import { set } from 'lodash-es';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';

import { AddressConfig } from '@/shared/service/b2b/graphql/address';
import {
  CustomerOrderShippingAddress,
  CustomerOrderStatues,
  CustomerOrderStatus,
  GetCustomerOrder,
  OrderProduct,
} from '@/shared/service/b2b/graphql/orders';
import { CustomerRole, MoneyFormat } from '@/types';

import OrderDetails from '.';

const { server } = startMockServer();

const buildOrderStatusWith = builder<CustomerOrderStatus>(() => ({
  statusCode: faker.number.int().toString(),
  systemLabel: faker.word.noun(),
  customLabel: faker.word.noun(),
}));

const buildCustomerOrderStatusesWith = builder<CustomerOrderStatues>(() => ({
  data: {
    bcOrderStatuses: [buildOrderStatusWith('WHATEVER_VALUES')],
  },
}));

const buildAddressConfigWith = builder<AddressConfig>(() => ({
  key: [faker.word.noun(), faker.word.noun()].join('_'),
  isEnabled: faker.helpers.arrayElement(['0', '1']),
}));

const buildAddressConfigResponseWith = builder(() => ({
  data: {
    addressConfig: [buildAddressConfigWith('WHATEVER_VALUES')],
  },
}));

const buildShippingAddressWith = builder<CustomerOrderShippingAddress>(() => ({
  id: faker.number.int(),
  zip: faker.location.zipCode(),
  city: faker.location.city(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  state: faker.location.state(),
  company: faker.company.name(),
  country: faker.location.country(),
  cost_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  order_id: faker.number.int(),
  street_1: faker.location.streetAddress(),
  street_2: faker.location.streetAddress(),
  base_cost: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  last_name: faker.person.lastName(),
  first_name: faker.person.firstName(),
  cost_ex_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  cost_inc_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  country_iso2: faker.location.countryCode(),
  items_shipped: faker.number.int(),
  shipping_method: faker.lorem.sentence(2),
  shipping_zone_id: faker.number.int(),
  cost_tax_class_id: faker.number.int(),
  handling_cost_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  base_handling_cost: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  shipping_zone_name: faker.location.country(),
  handling_cost_ex_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  handling_cost_inc_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  handling_cost_tax_class_id: 0,
  items_total: faker.number.int(),
}));

const buildProductWith = builder<OrderProduct>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.alphanumeric(10),
  quantity: faker.number.int({ min: 1, max: 10 }),
  price_ex_tax: faker.number.float({ min: 1, max: 200 }).toFixed(2),
  price_inc_tax: faker.number.float({ min: 1, max: 200 }).toFixed(2),
  base_price: faker.number.float({ min: 1, max: 200 }).toFixed(2),
  productUrl: faker.internet.url(),
  product_id: faker.number.int(),
  variant_id: faker.number.int(),
  imageUrl: faker.image.url(),
  product_options: [],
  order_address_id: faker.number.int(),
  quantity_shipped: 0,
  type: 'physical',
}));

const buildOrderNodeWith = builder(() => ({
  node: {
    orderId: faker.number.int().toString(),
  },
}));

const usd: MoneyFormat = {
  currency_location: 'left',
  currency_token: '$',
  decimal_token: '.',
  thousands_token: ',',
  decimal_places: 2,
  currency_exchange_rate: '1.0',
};

const buildCustomerOrderResponseWith = builder<GetCustomerOrder>(() => ({
  data: {
    customerOrder: {
      id: faker.number.int().toString(),
      poNumber: faker.number.int().toString(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateCreated: faker.date.recent().getTime(),
      totalTax: faker.number.float({ min: 0, max: 200 }),
      totalExTax: faker.number.float({ min: 0, max: 200 }),
      handlingCostExTax: faker.number.float({ min: 0, max: 200 }),
      subtotalExTax: faker.number.float({ min: 0, max: 200 }),
      shippingCostExTax: faker.number.float({ min: 0, max: 200 }),
      discountAmount: faker.number.float({ min: 0, max: 200 }),
      products: [],
      shippingAddress: [buildShippingAddressWith('WHATEVER_VALUES')],
      coupons: [],
      status: 'Pending',
      statusId: 7,
      paymentMethod: faker.lorem.sentence(3),
      shipments: false,
      billingAddress: {
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        phone: faker.phone.number(),
        company: faker.company.name(),
        street_1: faker.location.streetAddress(),
        street_2: faker.location.streetAddress(),
        zip: faker.location.zipCode(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
      },
      companyInfo: {
        companyId: null,
      },
      money: usd,
    },
  },
}));

const preloadedState = {
  company: buildCompanyStateWith({
    customer: {
      role: CustomerRole.B2C,
    },
  }),
  storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
};

const renderOrderDetailsRoute = () => (
  <Routes>
    <Route path="/orderDetail/:id" element={<OrderDetails />} />
    <Route path="/orders" element={<div>Orders list</div>} />
  </Routes>
);

beforeEach(() => {
  set(window, 'b2b.callbacks.dispatchEvent', vi.fn());
});

describe('legacy order detail pagination and reorder', () => {
  it('keeps the paginated-to order selected after adding its products to the cart', async () => {
    const firstOrderId = faker.number.int({ min: 100_000, max: 999_998 }).toString();
    const secondOrderId = (Number(firstOrderId) + 1).toString();
    const firstOrderAddress = buildShippingAddressWith('WHATEVER_VALUES');
    const secondOrderAddress = buildShippingAddressWith('WHATEVER_VALUES');
    const secondOrderProduct = buildProductWith({
      name: faker.commerce.productName(),
      order_address_id: secondOrderAddress.id,
    });
    const firstOrder = buildCustomerOrderResponseWith({
      data: {
        customerOrder: {
          id: firstOrderId,
          products: [
            buildProductWith({
              order_address_id: firstOrderAddress.id,
            }),
          ],
          shippingAddress: [firstOrderAddress],
        },
      },
    });
    const secondOrder = buildCustomerOrderResponseWith({
      data: {
        customerOrder: {
          id: secondOrderId,
          products: [secondOrderProduct],
          shippingAddress: [secondOrderAddress],
        },
      },
    });
    const cartId = faker.string.uuid();
    let secondOrderLoaded = false;

    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(
          buildCustomerOrderStatusesWith({
            data: {
              bcOrderStatuses: [
                buildOrderStatusWith({
                  statusCode: '7',
                  systemLabel: 'Pending',
                  customLabel: 'Pending',
                }),
              ],
            },
          }),
        ),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetCustomerOrder', ({ query }) => {
        const isSecondOrder = query.includes(`id: ${secondOrderId}`);
        secondOrderLoaded ||= isSecondOrder;

        return HttpResponse.json(isSecondOrder ? secondOrder : firstOrder);
      }),
      graphql.query('GetCustomerOrders', () =>
        HttpResponse.json({
          data: {
            customerOrders: {
              totalCount: 2,
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
              },
              edges: [
                buildOrderNodeWith({ node: { orderId: firstOrderId } }),
                buildOrderNodeWith({ node: { orderId: secondOrderId } }),
              ],
            },
          },
        }),
      ),
      graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
      graphql.mutation('createCartSimple', () =>
        HttpResponse.json({
          data: {
            cart: {
              createCart: {
                cart: {
                  entityId: cartId,
                },
              },
            },
          },
        }),
      ),
    );

    const view = renderWithProviders(renderOrderDetailsRoute(), {
      preloadedState,
      initialEntries: [
        '/orders',
        {
          pathname: `/orderDetail/${firstOrderId}`,
          state: {
            isCompanyOrder: false,
            currentIndex: 0,
            totalCount: 2,
            searchParams: {
              orderBy: '-createdAt',
              offset: 0,
            },
          },
        },
      ],
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));
    const pagination = await screen.findByRole('navigation', { name: 'Order 1 of 2' });
    const nextButton = within(pagination).getAllByRole('button')[1];
    await view.user.click(nextButton);

    expect(
      await screen.findByRole('heading', { name: new RegExp(`Order #${secondOrderId}`) }),
    ).toBeVisible();
    await waitFor(() => {
      expect(secondOrderLoaded).toBe(true);
    });

    await view.user.click(screen.getByRole('button', { name: 'Re-Order' }));
    const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });
    const productGroup = within(dialog).getByRole('group', { name: secondOrderProduct.name });
    await view.user.click(within(productGroup).getByRole('checkbox'));
    await view.user.click(within(dialog).getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => {
      expect(screen.getByText('Products are added to cart')).toBeVisible();
    });

    // Re-render the route tree to reproduce the refresh triggered by the storefront cart update.
    view.result.rerender(renderOrderDetailsRoute());

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: new RegExp(`Order #${secondOrderId}`) }),
      ).toBeVisible();
    });
    expect(screen.getByRole('navigation', { name: 'Order 2 of 2' })).toBeVisible();
  });
});
