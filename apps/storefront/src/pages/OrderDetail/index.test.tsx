import { useParams } from 'react-router-dom';
import { set } from 'lodash-es';
import {
  buildCompanyStateWith,
  builder,
  buildStoreInfoStateWith,
  bulk,
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
import { when } from 'vitest-when';

import { AddressConfig } from '@/shared/service/b2b/graphql/address';
import {
  CustomerOrderNode,
  CustomerOrderShippingAddress,
  CustomerOrderStatues,
  CustomerOrderStatus,
  GetCustomerOrder,
  GetCustomerOrders,
  OrderProduct,
  Shipment,
} from '@/shared/service/b2b/graphql/orders';
import { CustomerRole, MoneyFormat } from '@/types';

import { DigitalDownloadElementsResponse } from './components/getDigitalDownloadElements';
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
  const numberOfAddressConfigs = faker.number.int({ min: 1, max: 5 });

  return {
    data: {
      addressConfig: bulk(buildAddressConfigWith, 'WHATEVER_VALUES').times(numberOfAddressConfigs),
    },
  };
});

const euro: MoneyFormat = {
  currency_location: 'left',
  currency_token: '€',
  decimal_token: ',',
  thousands_token: '.',
  decimal_places: 2,
  currency_exchange_rate: '0.85',
};

const pound: MoneyFormat = {
  currency_location: 'left',
  currency_token: '£',
  decimal_token: '.',
  thousands_token: ',',
  decimal_places: 2,
  currency_exchange_rate: '0.75',
};

const usd: MoneyFormat = {
  currency_location: 'left',
  currency_token: '$',
  decimal_token: '.',
  thousands_token: ',',
  decimal_places: 2,
  currency_exchange_rate: '1.0',
};

const buildProductOptionWith = builder<OrderProduct['product_options'][number]>(() => ({
  id: faker.number.int(),
  product_option_id: faker.number.int(),
  option_id: faker.number.int(),
  display_name: faker.word.noun(),
  display_value: faker.word.noun(),
  value: faker.word.noun(),
}));

const buildProductWith = builder<OrderProduct>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.number.int().toString(),
  quantity: faker.number.int(),
  price_ex_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  price_inc_tax: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  base_price: faker.number.float({ min: 0, max: 200 }).toFixed(2),
  productUrl: faker.internet.url(),
  product_id: faker.number.int(),
  variant_id: faker.number.int(),
  imageUrl: faker.image.url(),
  product_options: bulk(buildProductOptionWith, 'WHATEVER_VALUES').times(3),
  order_address_id: faker.number.int(),
  quantity_shipped: faker.number.int(),
  type: faker.helpers.arrayElement(['physical', 'digital']),
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

const buildCustomerOrderResponseWith = builder<GetCustomerOrder>(() => ({
  data: {
    customerOrder: {
      id: faker.number.int().toString(),
      poNumber: faker.helpers.maybe(() => faker.number.int().toString()),
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
      status: faker.word.noun(),
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
      money: faker.helpers.arrayElement([euro, pound, usd]),
    },
  },
}));

const buildCustomerOrderNodeWith = builder<CustomerOrderNode>(() => ({
  node: {
    orderId: faker.number.int().toString(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: getUnixTime(faker.date.past()),
    updatedAt: getUnixTime(faker.date.recent()),
    isArchived: faker.datatype.boolean(),
    isInvoiceOrder: faker.helpers.arrayElement(['A_1', 'A_0']),
    totalIncTax: faker.number.float(),
    currencyCode: faker.finance.currencyCode(),
    usdIncTax: faker.number.float(),
    items: faker.number.int(),
    userId: faker.number.int(),
    poNumber: faker.number.int().toString(),
    referenceNumber: faker.number.int().toString(),
    status: faker.word.noun(),
    customStatus: faker.word.noun(),
    statusCode: faker.number.int(),
    ipStatus: faker.helpers.arrayElement(['A_0', 'A_1', 'A_2']),
    flag: faker.helpers.arrayElement(['A_0', 'A_1', 'A_2', 'A_3']),
    billingName: faker.person.fullName(),
    merchantEmail: faker.internet.email(),
  },
}));

const buildDigitalProductNodeWith = builder<DigitalDownloadElementsResponse>(() => ({
  data: {
    site: {
      order: {
        consignments: {
          downloads: [
            {
              lineItems: {
                edges: [
                  {
                    node: {
                      downloadFileUrls: [faker.internet.url(), faker.internet.url()],
                      downloadPageUrl: faker.internet.url(),
                      name: faker.commerce.productName(),
                      productEntityId: faker.number.int(),
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
}));

const buildGetCustomerOrdersWith = builder<GetCustomerOrders>(() => {
  const numberOfOrders = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      customerOrders: {
        totalCount: faker.number.int({ min: numberOfOrders, max: 100 }),
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildCustomerOrderNodeWith, 'WHATEVER_VALUES').times(numberOfOrders),
      },
    },
  };
});

const buildShipmentWith = builder<Shipment>(() => ({
  id: faker.number.int(),
  items: [
    {
      quantity: 55,
      order_product_id: 577,
    },
  ],
  date_created: faker.date.recent().toJSON(),
  shipping_method: faker.lorem.sentence(2),
  shipping_provider_display_name: faker.company.name(),
  order_address_id: faker.number.int(),
  tracking_link: faker.internet.url(),
  tracking_number: faker.number.int().toString(),
  generated_tracking_link: faker.internet.url(),
}));

const buildCustomerShoppingListNodeWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    updatedAt: getUnixTime(faker.date.recent()),
    products: {
      totalCount: faker.number.int({ min: 0, max: 10 }),
    },
  },
}));

const buildCustomerShoppingListResponseWith = builder(() => {
  const totalCount = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      customerShoppingLists: {
        totalCount,
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildCustomerShoppingListNodeWith, 'WHATEVER_VALUES').times(totalCount),
      },
    },
  };
});

beforeEach(() => {
  set(window, 'b2b.callbacks.dispatchEvent', vi.fn());
});

describe('when a personal customer visits an order', () => {
  const preloadedState = {
    company: buildCompanyStateWith({
      customer: {
        role: CustomerRole.B2C,
      },
    }),
    storeInfo: buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } }),
  };

  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: faker.number.int().toString() });
  });

  it('renders the order header', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '6696' });

    server.use(
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
      graphql.query('GetCustomerOrder', () =>
        HttpResponse.json(
          buildCustomerOrderResponseWith({
            data: {
              customerOrder: {
                status: 'Pending',
                poNumber: '',
              },
            },
          }),
        ),
      ),
    );

    renderWithProviders(<OrderDetails />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(await screen.findByRole('heading', { name: /Order #6696/ })).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('can navigate back to the orders listing page', async () => {
    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetCustomerOrder', () =>
        HttpResponse.json(buildCustomerOrderResponseWith('WHATEVER_VALUES')),
      ),
    );

    const { navigation } = renderWithProviders(<OrderDetails />, {
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

    await userEvent.click(screen.getByText('Back to orders'));

    expect(navigation).toHaveBeenCalledWith('/orders');
  });

  it('renders the order details', async () => {
    const mikeWazowskiAddress = buildShippingAddressWith({
      first_name: 'Mike',
      last_name: 'Wazowski',
      company: 'Monsters Inc.',
      street_1: '1200 Scare Floor',
      zip: '48123',
      city: 'Monstropolis',
      state: 'Monstana',
      country: 'USA',
    });

    const screamCanister = buildProductWith({
      order_address_id: mikeWazowskiAddress.id,
      name: 'Scream Canister',
      sku: 'MI-SCREAM-001',
      quantity: 443,
      quantity_shipped: 0,
      price_ex_tax: '333.00',
      type: 'physical',
      product_options: [
        buildProductOptionWith({
          display_name: 'Size',
          display_value: 'Large',
        }),
        buildProductOptionWith({
          display_name: 'Color',
          display_value: 'Red',
        }),
      ],
    });

    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetCustomerOrder', () =>
        HttpResponse.json(
          buildCustomerOrderResponseWith({
            data: {
              customerOrder: {
                money: euro,
                shippingAddress: [mikeWazowskiAddress],
                products: [screamCanister],
              },
            },
          }),
        ),
      ),
    );

    renderWithProviders(<OrderDetails />, {
      preloadedState,
      initialGlobalContext: { shoppingListEnabled: true },
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    const heading = await screen.findByRole('heading', { name: 'Mike Wazowski – Monsters Inc.' });
    const addressInformation = screen.getByRole('heading', {
      name: '1200 Scare Floor, Monstropolis, Monstana 48123, USA',
    });

    expect(heading).toBeInTheDocument();
    expect(addressInformation).toBeInTheDocument();

    expect(screen.getByText('Not shipped yet')).toBeInTheDocument();

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Qty')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();

    expect(screen.getByText('Scream Canister')).toBeInTheDocument();
    expect(screen.getByText('MI-SCREAM-001')).toBeInTheDocument();
    expect(screen.getByText('Size: Large')).toBeInTheDocument();
    expect(screen.getByText('Color: Red')).toBeInTheDocument();
    expect(screen.getByText('€333,00')).toBeInTheDocument();
    expect(screen.getByText('443')).toBeInTheDocument();
    expect(screen.getByText('€147.519,00')).toBeInTheDocument();
  });

  it('renders multiple addresses', async () => {
    const mikeWazowskiAddress = buildShippingAddressWith({
      first_name: 'Mike',
      last_name: 'Wazowski',
      company: 'Monsters Inc.',
      street_1: '1200 Scare Floor',
      zip: '48123',
      city: 'Monstropolis',
      state: 'Monstana',
      country: 'USA',
    });

    const jamesSullivanAddress = buildShippingAddressWith({
      first_name: 'James',
      last_name: 'Sullivan',
      company: 'Monsters Inc.',
      street_1: '44 Boo Lane',
      zip: '48123',
      city: 'Salem',
      state: 'Monstana',
      country: 'USA',
    });

    const physicalProduct1 = buildProductWith({
      order_address_id: mikeWazowskiAddress.id,
      type: 'physical',
    });

    const physicalProduct2 = buildProductWith({
      order_address_id: jamesSullivanAddress.id,
      type: 'physical',
    });

    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetCustomerOrder', () =>
        HttpResponse.json(
          buildCustomerOrderResponseWith({
            data: {
              customerOrder: {
                shippingAddress: [mikeWazowskiAddress, jamesSullivanAddress],
                products: [physicalProduct1, physicalProduct2],
              },
            },
          }),
        ),
      ),
    );

    renderWithProviders(<OrderDetails />, {
      preloadedState,
      initialGlobalContext: { shoppingListEnabled: true },
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(
      await screen.findByRole('heading', { name: 'Mike Wazowski – Monsters Inc.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '1200 Scare Floor, Monstropolis, Monstana 48123, USA',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'James Sullivan – Monsters Inc.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '44 Boo Lane, Salem, Monstana 48123, USA',
      }),
    ).toBeInTheDocument();
  });

  describe('when the order is not fully shipped', () => {
    it('renders a -not shipped products- section', async () => {
      const address = buildShippingAddressWith('WHATEVER_VALUES');

      const screamCanister = buildProductWith({
        order_address_id: address.id,
        name: 'Scream Canister',
        quantity: 1,
        quantity_shipped: 0,
        type: 'physical',
      });

      const laughCanister = buildProductWith({
        order_address_id: address.id,
        name: 'Laugh Canister',
        quantity: 1,
        quantity_shipped: 0,
        type: 'physical',
      });

      const doorStationPanel = buildProductWith({
        order_address_id: address.id,
        name: 'Door Station Panel',
        quantity: 1,
        quantity_shipped: 0,
        type: 'physical',
      });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  money: euro,
                  shippingAddress: [address],
                  products: [screamCanister, laughCanister, doorStationPanel],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(await screen.findByText('Not shipped yet')).toBeInTheDocument();

      expect(screen.getByText('Scream Canister')).toBeInTheDocument();
      expect(screen.getByText('Laugh Canister')).toBeInTheDocument();
      expect(screen.getByText('Door Station Panel')).toBeInTheDocument();
    });
  });

  describe('when part of the order is shipped', () => {
    it('renders a -shipped products- section', async () => {
      const address = buildShippingAddressWith('WHATEVER_VALUES');

      const screamCanister = buildProductWith({
        id: 577,
        order_address_id: address.id,
        name: 'Scream Canister',
        sku: 'MI-SCREAM-001',
        price_ex_tax: '333.00',
        quantity: 55,
        quantity_shipped: 55,
        product_options: [],
        type: 'physical',
      });

      const laughCanister = buildProductWith({
        id: 499,
        order_address_id: address.id,
        name: 'Laugh Canister',
        sku: 'MI-LAUGH-002',
        price_ex_tax: '123.00',
        quantity: 21,
        quantity_shipped: 21,
        product_options: [],
        type: 'physical',
      });

      const dhlShipmentOfAllLaughCanistersToAddress1 = buildShipmentWith({
        id: 1,
        date_created: '21 May 2022',
        shipping_method: 'Free Shipping',
        shipping_provider_display_name: 'DHL',
        order_address_id: address.id,
        items: [
          {
            quantity: laughCanister.quantity_shipped,
            order_product_id: laughCanister.id,
          },
        ],
      });

      const uspsShipmentOfAllScreamCanistersToAddress1 = buildShipmentWith({
        id: 2,
        date_created: '12 June 2022',
        shipping_method: 'Express Shipping',
        shipping_provider_display_name: 'USPS',
        order_address_id: address.id,
        items: [
          {
            quantity: screamCanister.quantity_shipped,
            order_product_id: screamCanister.id,
          },
        ],
      });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  money: euro,
                  shipments: [
                    dhlShipmentOfAllLaughCanistersToAddress1,
                    uspsShipmentOfAllScreamCanistersToAddress1,
                  ],
                  shippingAddress: [address, buildShippingAddressWith('WHATEVER_VALUES')],
                  products: [screamCanister, laughCanister],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(await screen.findByText('Shipment 1 –')).toBeInTheDocument();
      expect(screen.getByText('shipped on May, 21, by DHL, Free Shipping')).toBeInTheDocument();

      expect(screen.getByText('Scream Canister')).toBeInTheDocument();
      expect(screen.getByText('MI-SCREAM-001')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText('€333,00')).toBeInTheDocument();

      expect(await screen.findByText('Shipment 2 –')).toBeInTheDocument();
      expect(
        screen.getByText('shipped on June, 12, by USPS, Express Shipping'),
      ).toBeInTheDocument();

      expect(screen.getByText('Laugh Canister')).toBeInTheDocument();
      expect(screen.getByText('MI-LAUGH-002')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
      expect(screen.getByText('€123,00')).toBeInTheDocument();
    });
  });

  describe('when the order contains digital products', () => {
    it('renders a -digital products- section', async () => {
      const digitalProduct = buildProductWith({
        name: 'Scare Floor Operations Manual (eBook)',
        sku: 'MI-EBOOK-101',
        price_ex_tax: '22.34',
        quantity: 112,
        product_options: [
          buildProductOptionWith({
            display_name: 'Format',
            display_value: 'ePub',
          }),
        ],
        type: 'digital',
      });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  money: euro,
                  products: [digitalProduct],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByText('Digital products')).toBeInTheDocument();

      expect(screen.getByText('Scare Floor Operations Manual (eBook)')).toBeInTheDocument();
      expect(screen.getByText('MI-EBOOK-101')).toBeInTheDocument();

      expect(screen.getByText('€22,34')).toBeInTheDocument();
      expect(screen.getByText('112')).toBeInTheDocument();
      expect(screen.getByText('€2.502,08')).toBeInTheDocument();
      expect(screen.getByText('Format: ePub')).toBeInTheDocument();
    });

    it('displays the view files link for digital products in an order', async () => {
      const digitalProduct = buildProductWith({
        name: 'Digital Product',
        sku: 'DIGI-001',
        price_ex_tax: '10.00',
        quantity: 1,
        product_options: [],
        type: 'digital',
        product_id: 1234,
      });

      const digitalNode = {
        name: '',
        downloadPageUrl: '',
        downloadFileUrls: ['cat.com', 'meow.com'],
        productEntityId: 1234,
      };

      const digitalDownloadElements = buildDigitalProductNodeWith({
        data: {
          site: {
            order: {
              consignments: {
                downloads: [
                  {
                    lineItems: {
                      edges: [{ node: { ...digitalNode } }],
                    },
                  },
                ],
              },
            },
          },
        },
      });

      server.use(
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  money: euro,
                  products: [digitalProduct],
                },
              },
            }),
          ),
        ),
        graphql.query('GetDigitalDownloadLinks', () => HttpResponse.json(digitalDownloadElements)),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByText('Digital products')).toBeInTheDocument();
      expect(await screen.findByText('View files')).toBeInTheDocument();
      await userEvent.click(await screen.findByText('View files'));

      // validate if digital files dialog is opened and renders a download button for each url
      expect(screen.getByText('Files to download')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: 'Download' })).toHaveLength(2);
      });
    });

    it('does not render the view files link for physical products and digital products with no file in an order', async () => {
      const address = buildShippingAddressWith('WHATEVER_VALUES');
      const physicalProduct = buildProductWith({
        id: 123,
        order_address_id: address.id,
        name: 'Phone',
        price_ex_tax: '100.00',
        quantity: 2,
        quantity_shipped: 2,
        type: 'physical',
      });
      const digitalProduct = buildProductWith({
        name: 'How to meow',
        price_ex_tax: '10.00',
        quantity: 1,
        product_options: [],
        type: 'digital',
      });
      const shipmentOfAllPhysicalProduct = buildShipmentWith({
        id: 2,
        shipping_method: 'Test Shipping',
        order_address_id: address.id,
        items: [
          {
            quantity: physicalProduct.quantity_shipped,
            order_product_id: physicalProduct.id,
          },
        ],
      });

      server.use(
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  money: euro,
                  products: [physicalProduct, digitalProduct],
                  shippingAddress: [address, buildShippingAddressWith('WHATEVER_VALUES')],
                  shipments: [shipmentOfAllPhysicalProduct],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(await screen.findByText('Phone')).toBeInTheDocument();
      expect(await screen.findByText('How to meow')).toBeInTheDocument();
      expect(screen.queryByText('View files')).not.toBeInTheDocument();
    });
  });

  it('renders the order summary', async () => {
    server.use(
      graphql.query('GetCustomerOrderStatuses', () =>
        HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
      ),
      graphql.query('AddressConfig', () =>
        HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetCustomerOrder', () =>
        HttpResponse.json(
          buildCustomerOrderResponseWith({
            data: {
              customerOrder: {
                dateCreated: new Date('4 May 2025').getTime(),
                firstName: 'Mike',
                lastName: 'Wazowski',
                money: euro,
                totalTax: 13.5,
                totalExTax: 100,
                handlingCostExTax: 22.2,
                discountAmount: 37.93,
                subtotalExTax: 102,
                shippingCostExTax: 332,
              },
            },
          }),
        ),
      ),
    );

    renderWithProviders(<OrderDetails />, {
      preloadedState,
      initialGlobalContext: { shoppingListEnabled: true },
    });

    await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();

    expect(screen.getByText('Purchased by Mike Wazowski on 4 May 2025.')).toBeInTheDocument();

    const tax = screen.getByRole('group', { name: 'Tax' });
    expect(tax).toHaveTextContent('Tax €13,50');

    const discountAmount = screen.getByRole('group', { name: 'Discount amount' });
    expect(discountAmount).toHaveTextContent('Discount amount -€37,93');

    const subTotal = screen.getByRole('group', { name: 'Sub total' });
    expect(subTotal).toHaveTextContent('Sub total €102,00');

    const shipping = screen.getByRole('group', { name: 'Shipping' });
    expect(shipping).toHaveTextContent('Shipping €332,00');

    const handlingFee = screen.getByRole('group', { name: 'Handling Fee' });
    expect(handlingFee).toHaveTextContent('Handling Fee €22,20');

    const grandTotal = screen.getByRole('group', { name: 'Grand total' });
    expect(grandTotal).toHaveTextContent('Grand total €100,00');

    expect(screen.getByRole('button', { name: 'Re-Order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' })).toBeInTheDocument();
  });

  describe('when there is no order history', () => {
    it('does not render the order history section', async () => {
      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  orderHistoryEvent: [],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.queryByRole('heading', { name: 'History' })).not.toBeInTheDocument();
    });
  });

  describe('when there are order history events', () => {
    it('renders the order history section', async () => {
      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  orderHistoryEvent: [
                    {
                      id: 1,
                      eventType: 1,
                      status: 'Pending',
                      createdAt: getUnixTime(new Date('1 May 2025 03:44')),
                    },
                    {
                      id: 2,
                      eventType: 2,
                      status: 'Shipped',
                      createdAt: getUnixTime(new Date('4 May 2025 07:22')),
                    },
                  ],
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();

      const table = screen.getByRole('table');

      const columnHeaders = within(table).getAllByRole('columnheader');

      expect(columnHeaders[0]).toHaveTextContent('Date');
      expect(columnHeaders[1]).toHaveTextContent('Status');

      const pendingRow = within(within(table).getByRole('row', { name: /Pending/ }));

      expect(pendingRow.getByRole('cell', { name: 'Pending' })).toBeInTheDocument();
      expect(pendingRow.getByRole('cell', { name: 'May 1 2025 @ 3:44 AM' })).toBeInTheDocument();

      const shippedRow = within(within(table).getByRole('row', { name: /Shipped/ }));

      expect(shippedRow.getByRole('cell', { name: 'Shipped' })).toBeInTheDocument();
      expect(shippedRow.getByRole('cell', { name: 'May 4 2025 @ 7:22 AM' })).toBeInTheDocument();
    });
  });

  describe('when the order was paid in full', () => {
    it('renders the payment details section', async () => {
      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  dateCreated: new Date('4 May 2025').getTime(),
                  poNumber: '',
                  paymentMethod: 'Monopoly Money',
                  billingAddress: {
                    first_name: 'James',
                    last_name: 'Sullivan',
                    company: 'Monsters Inc.',
                    street_1: '1200 Scare Floor',
                    zip: '48123',
                    city: 'Monstropolis',
                    state: 'Monstana',
                    country: 'USA',
                  },
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'Payment' })).toBeInTheDocument();

      expect(screen.getByText('Paid in full on 4 May 2025')).toBeInTheDocument();
      expect(screen.getByText('Payment by Monopoly Money')).toBeInTheDocument();
      expect(screen.getByText('James Sullivan')).toBeInTheDocument();
      expect(screen.getByText('1200 Scare Floor')).toBeInTheDocument();
      expect(screen.getByText('Monstropolis, Monstana 48123, USA')).toBeInTheDocument();
    });
  });

  describe('when it is a Purchase Order (includes poNumber)', () => {
    it('renders the poNumber in the header', async () => {
      vi.mocked(useParams).mockReturnValue({ id: '6696' });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  poNumber: '3405',
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'Order #6696, 3405' })).toBeInTheDocument();
    });

    it('renders the payment details section', async () => {
      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: {
                customerOrder: {
                  poNumber: '3405',
                  dateCreated: new Date('4 May 2025').getTime(),
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      expect(screen.getByRole('heading', { name: 'Payment' })).toBeInTheDocument();

      expect(screen.getByText('PO Submitted on 4 May 2025')).toBeInTheDocument();
    });
  });

  describe('when they have navigated from MyOrders', () => {
    it('shows the next/prev buttons to navigate through orders', async () => {
      vi.mocked(useParams).mockReturnValue({ id: '1' });

      const getAllOrders = vi.fn();
      const getCustomerOrderResponse = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', (query) =>
          HttpResponse.json(getCustomerOrderResponse(query)),
        ),
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
      );

      when(getCustomerOrderResponse)
        .calledWith(stringContainingAll('id: "1"'))
        .thenReturn(buildCustomerOrderResponseWith({ data: { customerOrder: { id: '1' } } }));

      when(getCustomerOrderResponse)
        .calledWith(stringContainingAll('id: "2"'))
        .thenReturn(buildCustomerOrderResponseWith({ data: { customerOrder: { id: '2' } } }));

      when(getCustomerOrderResponse)
        .calledWith(stringContainingAll('id: "3"'))
        .thenReturn(buildCustomerOrderResponseWith({ data: { customerOrder: { id: '3' } } }));

      when(getAllOrders)
        .calledWith(
          stringContainingAll(
            'beginDateAt: 1672531200000',
            'endDateAt: 1680307200000',
            'first: 3',
            'offset: 0',
            'orderBy: "-createdAt"',
          ),
        )
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                edges: [
                  buildCustomerOrderNodeWith({ node: { orderId: '1' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '2' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '3' } }),
                ],
                totalCount: 10,
              },
            },
          }),
        );

      when(getAllOrders)
        .calledWith(
          stringContainingAll(
            'beginDateAt: 1672531200000',
            'endDateAt: 1680307200000',
            'first: 3',
            'offset: 1',
            'orderBy: "-createdAt"',
          ),
        )
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                edges: [
                  buildCustomerOrderNodeWith({ node: { orderId: '2' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '3' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '4' } }),
                ],
                totalCount: 10,
              },
            },
          }),
        );

      when(getAllOrders)
        .calledWith(
          stringContainingAll(
            'beginDateAt: 1672531200000',
            'endDateAt: 1680307200000',
            'first: 3',
            'offset: 2',
            'orderBy: "-createdAt"',
          ),
        )
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                edges: [
                  buildCustomerOrderNodeWith({ node: { orderId: '3' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '4' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '5' } }),
                ],
                totalCount: 10,
              },
            },
          }),
        );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [
          {
            state: {
              isCompanyOrder: false,
              currentIndex: 0,
              totalCount: 10,
              beginDateAt: new Date('2023-01-01').getTime(),
              endDateAt: new Date('2023-04-01').getTime(),
              searchParams: {
                offset: 5,
              },
            },
          },
        ],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const navigation = await screen.findByRole('navigation', { name: 'Order 1 of 10' });

      expect(screen.getByRole('heading', { name: 'Order #1,' })).toBeInTheDocument();

      const [prev, next] = within(navigation).getAllByRole('button');

      await userEvent.click(next);

      expect(await screen.findByRole('heading', { name: 'Order #2,' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Order 2 of 10' })).toBeInTheDocument();

      await userEvent.click(next);

      expect(await screen.findByRole('heading', { name: 'Order #3,' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Order 3 of 10' })).toBeInTheDocument();

      await userEvent.click(prev);

      expect(await screen.findByRole('heading', { name: 'Order #2,' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Order 2 of 10' })).toBeInTheDocument();
    });

    it('honours the orderBy parameter', async () => {
      vi.mocked(useParams).mockReturnValue({ id: '1' });

      const getAllOrders = vi.fn();
      const getCustomerOrderResponse = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', (query) =>
          HttpResponse.json(getCustomerOrderResponse(query)),
        ),
        graphql.query('GetCustomerOrders', ({ query }) => HttpResponse.json(getAllOrders(query))),
      );

      when(getCustomerOrderResponse)
        .calledWith(stringContainingAll('id: "1"'))
        .thenReturn(buildCustomerOrderResponseWith({ data: { customerOrder: { id: '1' } } }));

      when(getAllOrders)
        .calledWith(
          stringContainingAll(
            'beginDateAt: 1672531200000',
            'endDateAt: 1680307200000',
            'first: 3',
            'offset: 0',
            'orderBy: "status"',
          ),
        )
        .thenReturn(
          buildGetCustomerOrdersWith({
            data: {
              customerOrders: {
                edges: [
                  buildCustomerOrderNodeWith({ node: { orderId: '1' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '2' } }),
                  buildCustomerOrderNodeWith({ node: { orderId: '3' } }),
                ],
                totalCount: 10,
              },
            },
          }),
        );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialEntries: [
          {
            state: {
              isCompanyOrder: false,
              currentIndex: 0,
              totalCount: 10,
              beginDateAt: new Date('2023-01-01').getTime(),
              endDateAt: new Date('2023-04-01').getTime(),
              searchParams: {
                orderBy: 'status',
                offset: 5,
              },
            },
          },
        ],
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      const navigation = await screen.findByRole('navigation', { name: 'Order 1 of 10' });

      expect(screen.getByRole('heading', { name: 'Order #1,' })).toBeInTheDocument();

      const [prev, next] = within(navigation).getAllByRole('button');

      await waitFor(() => {
        expect(next).toBeEnabled();
      });

      expect(prev).toBeDisabled();
    });
  });

  describe('when the customer wants to re-order', () => {
    it('can re-order a single product', async () => {
      const screamCanister = buildProductWith({ name: 'Scream Canister', quantity: 2 });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 1,
        product_options: [buildProductOptionWith({ product_option_id: 22, value: 'bar' })],
      });

      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 1,
                productEntityId: laughCanister.product_id,
                variantEntityId: laughCanister.variant_id,
                selectedOptions: {
                  multipleChoices: [],
                  textFields: [{ optionEntityId: 22, text: 'bar' }],
                },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      expect(
        within(dialog).getByText('Select products and quantity for reorder'),
      ).toBeInTheDocument();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeInTheDocument();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('can adjust the quantity of a product', async () => {
      const screamCanister = buildProductWith({
        name: 'Scream Canister',
        quantity: 1,
        product_options: [],
      });

      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister] } },
            }),
          ),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 2,
                productEntityId: screamCanister.product_id,
                variantEntityId: screamCanister.variant_id,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const dialog = await screen.findByRole('dialog', { name: 'Re-Order' });

      expect(
        within(dialog).getByText('Select products and quantity for reorder'),
      ).toBeInTheDocument();

      const productGroup = within(dialog).getByRole('group', { name: 'Scream Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.type(within(productGroup).getByRole('spinbutton'), '2', {
        initialSelectionStart: 0,
        initialSelectionEnd: 1,
      });

      await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeInTheDocument();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('can re-order all products in one go', async () => {
      const screamCanister = buildProductWith({
        name: 'Scream Canister',
        quantity: 2,
        product_options: [],
      });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 1,
        product_options: [],
      });

      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 2,
                productEntityId: screamCanister.product_id,
                variantEntityId: screamCanister.variant_id,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
              {
                quantity: 1,
                productEntityId: laughCanister.product_id,
                variantEntityId: laughCanister.variant_id,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const checkboxes = await screen.findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeInTheDocument();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('shows a warning if no product is selected', async () => {
      const screamCanister = buildProductWith({ name: 'Scream Canister', quantity: 2 });
      const laughCanister = buildProductWith({ name: 'Laugh Canister', quantity: 1 });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Please select at least one item')).toBeInTheDocument();
      });
    });
  });

  describe('when the customer wants to add to a shopping list', () => {
    it('can add a single product to an existing shopping list', async () => {
      const screamCanister = buildProductWith({ name: 'Scream Canister', quantity: 2 });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 2,
        product_id: 123,
        variant_id: 456,
        product_options: [buildProductOptionWith({ product_option_id: 22, value: 'bar' })],
      });

      const addItemsToCustomerShoppingList = vi.fn();

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(
            buildCustomerShoppingListResponseWith({
              data: { customerShoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ variables })),
        ),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 2,
                  optionList: expect.arrayContaining([
                    expect.objectContaining({
                      optionId: 'attribute[22]',
                      optionValue: 'bar',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      expect(
        within(dialog).getByText('Select products and quantity to add to shopping list'),
      ).toBeInTheDocument();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(await screen.findByRole('button', { name: 'Add to shopping list' }));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
      });
    });

    it('can add a product to a new shopping list', async () => {
      const screamCanister = buildProductWith({ name: 'Scream Canister', quantity: 2 });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 2,
        product_id: 123,
        variant_id: 456,
        product_options: [buildProductOptionWith({ product_option_id: 22, value: 'bar' })],
      });

      const addItemsToCustomerShoppingList = vi.fn();
      const getCustomerShoppingLists = vi.fn().mockReturnValue(
        buildCustomerShoppingListResponseWith({
          data: { customerShoppingLists: { totalCount: 0, edges: [] } },
        }),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 2,
                  optionList: expect.arrayContaining([
                    expect.objectContaining({
                      optionId: 'attribute[22]',
                      optionValue: 'bar',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      const createCustomerShoppingList = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
        graphql.query('CustomerShoppingLists', ({ query }) =>
          HttpResponse.json(getCustomerShoppingLists(query)),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ variables })),
        ),
        graphql.mutation('CreateCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(createCustomerShoppingList(variables)),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.click(within(dialog).getByRole('button', { name: 'Add to shopping list' }));

      const createNewButton = await screen.findByRole('button', { name: 'Create new' });

      await userEvent.click(createNewButton);

      expect(await screen.findByRole('heading', { name: 'Create new' })).toBeInTheDocument();

      const nameInput = screen.getByRole('textbox', { name: 'Name' });
      const descriptionInput = screen.getByRole('textbox', { name: 'Description' });

      await userEvent.type(nameInput, 'New Shopping List');
      await userEvent.type(descriptionInput, 'This is a new shopping list');

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'New Shopping List' },
      });

      when(createCustomerShoppingList)
        .calledWith({
          shoppingListData: {
            name: 'New Shopping List',
            description: 'This is a new shopping list',
            channelId: 1,
          },
        })
        .thenResolve({});

      when(getCustomerShoppingLists, { times: 1 })
        .calledWith(stringContainingAll('first: 50', 'channelId: 1'))
        .thenReturn(
          buildCustomerShoppingListResponseWith({
            data: { customerShoppingLists: { totalCount: 0, edges: [shoppingList] } },
          }),
        );

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await userEvent.click(await screen.findByText('New Shopping List'));

      await userEvent.click(screen.getByRole('button', { name: 'OK' }));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
      });
    });

    it('can adjust the quantity of a product', async () => {
      const screamCanister = buildProductWith({ name: 'Scream Canister', quantity: 2 });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 1,
        product_id: 123,
        variant_id: 456,
        product_options: [buildProductOptionWith({ product_option_id: 22, value: 'bar' })],
      });

      const addItemsToCustomerShoppingList = vi.fn();

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(
            buildCustomerShoppingListResponseWith({
              data: { customerShoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ variables })),
        ),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 2,
                  optionList: expect.arrayContaining([
                    expect.objectContaining({
                      optionId: 'attribute[22]',
                      optionValue: 'bar',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      expect(
        within(dialog).getByText('Select products and quantity to add to shopping list'),
      ).toBeInTheDocument();

      const productGroup = within(dialog).getByRole('group', { name: 'Laugh Canister' });

      await userEvent.click(within(productGroup).getByRole('checkbox'));

      await userEvent.type(within(productGroup).getByRole('spinbutton'), '2', {
        initialSelectionStart: 0,
        initialSelectionEnd: 1,
      });

      await userEvent.click(await screen.findByRole('button', { name: 'Add to shopping list' }));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
      });
    });

    it('can add all the products in one go', async () => {
      const screamCanister = buildProductWith({
        name: 'Scream Canister',
        quantity: 2,
        product_id: 789,
        variant_id: 1011,
        product_options: [],
      });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 1,
        product_id: 123,
        variant_id: 456,
        product_options: [],
      });

      const addItemsToCustomerShoppingList = vi.fn();

      const shoppingList = buildCustomerShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(
            buildCustomerShoppingListResponseWith({
              data: { customerShoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json({ data: { productsSearch: [] } })),
        graphql.mutation('AddItemsToCustomerShoppingList', ({ query, variables }) =>
          HttpResponse.json(addItemsToCustomerShoppingList({ query, variables })),
        ),
      );

      when(addItemsToCustomerShoppingList)
        .calledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              shoppingListId: 992,
              items: expect.arrayContaining([
                expect.objectContaining({
                  productId: 123,
                  variantId: 456,
                  quantity: 1,
                  optionList: [],
                }),
                expect.objectContaining({
                  productId: 789,
                  variantId: 1011,
                  quantity: 2,
                  optionList: [],
                }),
              ]),
            }),
          }),
        )
        .thenReturn({
          data: {
            customerShoppingListsItemsCreate: {
              shoppingListsItems: [],
            },
          },
        });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, {
        preloadedState,
        initialGlobalContext: { shoppingListEnabled: true },
      });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'ADD TO SHOPPING LIST' }));

      const dialog = await screen.findByRole('dialog', { name: 'Add to shopping list' });

      const checkboxes = await within(dialog).findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(await screen.findByRole('button', { name: 'Add to shopping list' }));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
      });
    });

    it('can add all products in one go', async () => {
      const screamCanister = buildProductWith({
        name: 'Scream Canister',
        quantity: 2,
        product_options: [],
      });
      const laughCanister = buildProductWith({
        name: 'Laugh Canister',
        quantity: 1,
        product_options: [],
      });

      const createCartSimple = vi.fn();

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
        graphql.query('getCart', () => HttpResponse.json({ data: { site: { cart: null } } })),
        graphql.mutation('createCartSimple', ({ variables }) =>
          HttpResponse.json(createCartSimple(variables)),
        ),
      );

      when(createCartSimple)
        .calledWith({
          createCartInput: {
            lineItems: [
              {
                quantity: 2,
                productEntityId: screamCanister.product_id,
                variantEntityId: screamCanister.variant_id,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
              {
                quantity: 1,
                productEntityId: laughCanister.product_id,
                variantEntityId: laughCanister.variant_id,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
            ],
          },
        })
        .thenReturn({ data: { cart: { createCart: { cart: { entityId: 'foo-bar' } } } } });

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      const checkboxes = await screen.findAllByRole('checkbox');

      await userEvent.click(checkboxes[0]); // Select all checkbox

      await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Products are added to cart')).toBeInTheDocument();
      });

      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
        cartId: 'foo-bar',
      });
    });

    it('shows a warning if no product is selected', async () => {
      const screamCanister = buildProductWith({ name: 'Scream Canister', quantity: 2 });
      const laughCanister = buildProductWith({ name: 'Laugh Canister', quantity: 1 });

      server.use(
        graphql.query('GetCustomerOrderStatuses', () =>
          HttpResponse.json(buildCustomerOrderStatusesWith('WHATEVER_VALUES')),
        ),
        graphql.query('AddressConfig', () =>
          HttpResponse.json(buildAddressConfigResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetCustomerOrder', () =>
          HttpResponse.json(
            buildCustomerOrderResponseWith({
              data: { customerOrder: { products: [screamCanister, laughCanister] } },
            }),
          ),
        ),
      );

      renderWithProviders(<OrderDetails />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryAllByRole('progressbar'));

      await userEvent.click(screen.getByRole('button', { name: 'Re-Order' }));

      await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }));

      await waitFor(() => {
        expect(screen.getByText('Please select at least one item')).toBeInTheDocument();
      });
    });
  });
});
