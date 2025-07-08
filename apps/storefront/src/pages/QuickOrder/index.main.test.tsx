// Does it make sense for someone without purchase permissions, shopping list disabled, and quote disabled to be able to access QuickOrder?

import Cookies from 'js-cookie';
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

import { SearchProductsResponse } from '@/shared/service/b2b/graphql/product';
import {
  OrderedProductNode,
  RecentlyOrderedProductsResponse,
} from '@/shared/service/b2b/graphql/quickOrder';
import { GetCart } from '@/shared/service/bc/graphql/cart';
import { CompanyStatus, UserTypes } from '@/types';
import { LineItem } from '@/utils/b3Product/b3Product';

import QuickOrder from '.';

const { server } = startMockServer();

const buildMoneyWith = builder(() => ({
  currencyCode: faker.finance.currencyCode(),
  value: faker.number.float(),
}));

const buildRecentlyOrderedProductNodeWith = builder<OrderedProductNode>(() => ({
  node: {
    id: faker.string.uuid(),
    createdAt: getUnixTime(faker.date.past().getTime()),
    updatedAt: getUnixTime(faker.date.recent()),
    productName: faker.commerce.productName(),
    productBrandName: faker.company.buzzNoun(),
    variantSku: faker.string.uuid(),
    productId: faker.number.int().toString(),
    variantId: faker.number.int().toString(),
    optionList: [],
    orderedTimes: faker.number.int().toString(),
    firstOrderedAt: getUnixTime(faker.date.past()),
    lastOrderedAt: getUnixTime(faker.date.recent()),
    lastOrderedItems: faker.number.int().toString(),
    sku: faker.string.uuid(),
    lastOrdered: getUnixTime(faker.date.recent()).toString(),
    imageUrl: faker.image.url(),
    basePrice: faker.commerce.price(),
    discount: faker.commerce.price(),
    tax: faker.commerce.price(),
    enteredInclusive: faker.datatype.boolean(),
    productUrl: faker.system.directoryPath(),
    optionSelections: [],
    baseSku: faker.string.uuid(),
  },
}));

type SearchProduct = SearchProductsResponse['data']['productsSearch'][number];
type SearchProductV3Option = SearchProduct['optionsV3'][number];
type SearchProductV3OptionValue = SearchProductV3Option['option_values'][number];

const buildSearchProductV3OptionValueWith = builder<SearchProductV3OptionValue>(() => ({
  id: faker.number.int(),
  label: faker.commerce.productAdjective(),
  sort_order: faker.number.int(),
  value_data: null,
  is_default: faker.datatype.boolean(),
}));

const buildSearchProductV3OptionWith = builder<SearchProductV3Option>(() => ({
  id: faker.number.int(),
  product_id: faker.number.int(),
  name: faker.commerce.productMaterial(),
  display_name: faker.commerce.productMaterial(),
  type: faker.helpers.arrayElement(['rectangles', 'swatch']),
  sort_order: faker.number.int(),
  option_values: bulk(buildSearchProductV3OptionValueWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  config: [],
}));

const buildVariantOptionsWith = builder(() => ({
  id: faker.number.int(),
  label: faker.commerce.productAdjective(),
  option_id: faker.number.int(),
  option_display_name: faker.commerce.productMaterial(),
}));

const buildVariantWith = builder<SearchProduct['variants'][number]>(() => ({
  variant_id: faker.number.int({ min: 1, max: 10000 }),
  product_id: faker.number.int(),
  sku: faker.string.uuid(),
  option_values: bulk(buildVariantOptionsWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  calculated_price: Number(faker.commerce.price()),
  image_url: faker.image.url(),
  has_price_list: faker.datatype.boolean(),
  bulk_prices: [],
  purchasing_disabled: faker.datatype.boolean(),
  cost_price: Number(faker.commerce.price()),
  inventory_level: faker.number.int(),
  bc_calculated_price: {
    as_entered: Number(faker.commerce.price()),
    tax_inclusive: Number(faker.commerce.price()),
    tax_exclusive: Number(faker.commerce.price()),
    entered_inclusive: faker.datatype.boolean(),
  },
}));

const buildSearchProductOptionsWith = builder(() => ({
  option_id: faker.number.int(),
  display_name: faker.commerce.productMaterial(),
  sort_order: faker.number.int(),
  is_required: faker.datatype.boolean(),
}));

const buildSearchProductWith = builder<SearchProduct>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.uuid(),
  costPrice: faker.commerce.price(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'simple', 'variant']),
  availability: faker.helpers.arrayElement(['available', 'unavailable']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: bulk(buildVariantWith, 'WHATEVER_VALUES').times(faker.number.int({ min: 0, max: 10 })),
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: bulk(buildSearchProductOptionsWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  optionsV3: bulk(buildSearchProductV3OptionWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  channelId: [],
  productUrl: faker.internet.url(),
  taxClassId: faker.number.int(),
  isPriceHidden: faker.datatype.boolean(),
}));

const buildGetRecentlyOrderedProductsWith = builder<RecentlyOrderedProductsResponse>(() => {
  const numberOfProducts = faker.number.int({ min: 2, max: 10 });

  return {
    data: {
      orderedProducts: {
        totalCount: numberOfProducts,
        edges: bulk(buildRecentlyOrderedProductNodeWith, 'WHATEVER_VALUES').times(numberOfProducts),
      },
    },
  };
});

const buildCartItemWith = builder<LineItem>(() => ({
  name: faker.commerce.productName(),
  quantity: faker.number.int(),
  productEntityId: faker.number.int(),
  variantEntityId: faker.number.int(),
  sku: faker.string.uuid(),
}));

const buildGetCartWith = builder<GetCart>(() => {
  const currencyCode = faker.finance.currencyCode();

  return {
    data: {
      site: {
        cart: {
          entityId: faker.string.uuid(),
          lineItems: {
            physicalItems: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
            digitalItems: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
            customItems: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
            giftCertificates: bulk(buildCartItemWith, 'WHATEVER_VALUES').times(
              faker.number.int({ min: 0, max: 10 }),
            ),
          },
          amount: buildMoneyWith({ currencyCode }),
          baseAmount: buildMoneyWith({ currencyCode }),
          discountedAmount: buildMoneyWith({ currencyCode }),
          discounts: [],
          currencyCode,
          isTaxIncluded: faker.datatype.boolean(),
          locale: faker.helpers.arrayElement(['en', 'fr', 'de', 'es']),
        },
      },
    },
  };
});

const approvedB2BCompany = buildCompanyStateWith({
  permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: { userType: UserTypes.MULTIPLE_B2C },
});

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

beforeEach(() => {
  /* @ts-expect-error This object is not complete, it only includes the properties required for this test file */
  window.b2b = { callbacks: { dispatchEvent: vi.fn() } };
});

afterEach(() => {
  // @ts-expect-error Removing the b2b object to avoid conflicts in other tests
  delete window.b2b;

  Cookies.remove('cartId');
});

describe('has recently ordered products', () => {
  it('displays a table with product information', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: {
        productName: 'Laugh Canister',
        sku: 'SCR-623',
      },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
        }),
      );

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    expect(await screen.findByText('1 products')).toBeInTheDocument();

    const table = screen.getByRole('table');

    const columnHeaders = within(table).getAllByRole('columnheader');

    expect(within(columnHeaders[0]).getByRole('checkbox')).toBeInTheDocument();
    expect(columnHeaders[1]).toHaveTextContent('Product');
    expect(columnHeaders[2]).toHaveTextContent('Price');
    expect(columnHeaders[3]).toHaveTextContent('Qty');
    expect(columnHeaders[4]).toHaveTextContent('Last ordered');
  });

  it('displays all the information associated with the products', async () => {
    vi.setSystemTime(new Date('22 July 2024'));

    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: {
        productName: 'Laugh Canister',
        sku: 'SCR-623',
        basePrice: '122.33',
        variantSku: 'VARIANT-123',
        lastOrderedAt: getUnixTime(new Date('22 July 2024')),
      },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(
        stringContainingAll(
          'first: 12',
          'offset: 0',
          'orderBy: "-lastOrderedAt"',
          'beginDateAt: "2024-04-23"',
          'endDateAt: "2024-07-22"',
        ),
      )
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
        }),
      );

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
              isPriceHidden: false,
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    expect(within(row).getByRole('cell', { name: /Laugh Canister/ })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: /VARIANT-123/ })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '$122.33' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '1' })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '22 July 2024' })).toBeInTheDocument();
  });

  it('can change sort order by clicking the table headers', async () => {
    const getRecentlyOrderedProducts = vi.fn();

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: {
        productName: 'Laugh Canister',
      },
    });

    const doorStationPanel = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Door Station Panel' },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 2, edges: [laughCanister, doorStationPanel] } },
        }),
      );

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('orderBy: "productName"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 2, edges: [doorStationPanel, laughCanister] } },
        }),
      );

    when(searchProducts)
      .calledWith(
        stringContainingAll(laughCanister.node.productId, doorStationPanel.node.productId),
      )
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
            }),
            buildSearchProductWith({
              id: Number(doorStationPanel.node.productId),
              name: doorStationPanel.node.productName,
              sku: doorStationPanel.node.sku,
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const before = await screen.findAllByRole('row');

    // before[0] is the header row, so we start from 1
    expect(before[1]).toHaveTextContent('Laugh Canister');
    expect(before[2]).toHaveTextContent('Door Station Panel');

    const productHeader = await screen.findByRole('columnheader', { name: /Product/ });

    await userEvent.click(within(productHeader).getByRole('button'));

    const after = await screen.findAllByRole('row');

    // after[0] is the header row, so we start from 1
    expect(after[1]).toHaveTextContent('Door Station Panel');
    expect(after[2]).toHaveTextContent('Laugh Canister');
  });

  it('can filter products by date-range and search', async () => {
    const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
      data: {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      },
    });

    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: {
        productName: 'Laugh Canister',
      },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(
        stringContainingAll(
          'first: 12',
          'offset: 0',
          'orderBy: "-lastOrderedAt"',
          'beginDateAt: "2024-04-15"',
          'endDateAt: "2024-05-14"',
          'q: "Laugh Canister"',
        ),
      )
      .thenReturn({
        data: {
          orderedProducts: {
            totalCount: 1,
            edges: [laughCanister],
          },
        },
      });

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const fromInput = screen.getByRole('textbox', { name: /From/ });
    const toInput = screen.getByRole('textbox', { name: /To/ });
    const searchInput = screen.getByPlaceholderText('Search');

    await userEvent.clear(fromInput);
    await userEvent.type(fromInput, '04/15/2024');
    await userEvent.clear(toInput);
    await userEvent.type(toInput, '05/14/2024');
    await userEvent.type(searchInput, 'Laugh Canister');

    expect(await screen.findByRole('row', { name: /Laugh Canister/ })).toBeInTheDocument();
  });

  it('recalculates product price when quantity is modified', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: {
        productName: 'Laugh Canister',
        basePrice: '122.33',
      },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn({
        data: {
          orderedProducts: {
            totalCount: 1,
            edges: [laughCanister],
          },
        },
      });

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
              isPriceHidden: false,
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    expect(within(row).getByRole('cell', { name: /Laugh Canister/ })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '$122.33' })).toBeInTheDocument();

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '2');

    expect(within(row).getByRole('cell', { name: '$244.66' })).toBeInTheDocument();
  });

  it('updates the subtotal when products are selected', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', basePrice: '122.33' },
    });

    const doorStationPanel = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Door Station Panel', basePrice: '33.45' },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 2, edges: [laughCanister, doorStationPanel] } },
        }),
      );

    when(searchProducts)
      .calledWith(
        stringContainingAll(laughCanister.node.productId, doorStationPanel.node.productId),
      )
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
            }),
            buildSearchProductWith({
              id: Number(doorStationPanel.node.productId),
              name: doorStationPanel.node.productName,
              sku: doorStationPanel.node.sku,
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const laughCanisterRow = await screen.findByRole('row', { name: /Laugh Canister/ });
    const doorStationPanelRow = await screen.findByRole('row', { name: /Door Station Panel/ });

    const input = within(laughCanisterRow).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '2');

    await userEvent.click(within(laughCanisterRow).getByRole('checkbox'));
    await userEvent.click(within(doorStationPanelRow).getByRole('checkbox'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Subtotal: $278.11' })).toBeInTheDocument();
    });
  });

  describe('when the user has permission to purchase but quote/shoppingList are disabled', () => {
    it('displays add to cart when -add selected to- is clicked', async () => {
      const getRecentlyOrderedProducts = vi.fn();
      const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

      const laughCanister = buildRecentlyOrderedProductNodeWith({
        node: { productName: 'Laugh Canister', basePrice: '122.33' },
      });

      when(getRecentlyOrderedProducts)
        .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
        .thenReturn(
          buildGetRecentlyOrderedProductsWith({
            data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
          }),
        );

      when(searchProducts)
        .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
        .thenReturn({
          data: {
            productsSearch: [
              buildSearchProductWith({
                id: Number(laughCanister.node.productId),
                name: laughCanister.node.productName,
                sku: laughCanister.node.sku,
              }),
            ],
          },
        });

      server.use(
        graphql.query('RecentlyOrderedProducts', ({ query }) =>
          HttpResponse.json(getRecentlyOrderedProducts(query)),
        ),
        graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      );

      renderWithProviders(<QuickOrder />, {
        preloadedState: {
          ...preloadedState,
          company: {
            ...preloadedState.company,
            permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
          },
        },
        initialGlobalContext: { productQuoteEnabled: false, shoppingListEnabled: false },
      });

      const row = await screen.findByRole('row', { name: /Laugh Canister/ });

      await userEvent.click(within(row).getByRole('checkbox'));

      const addButton = screen.getByRole('button', { name: 'Add selected to' });

      await userEvent.click(addButton);

      expect(screen.getByRole('menuitem', { name: /Add selected to cart/ })).toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: /Add selected to shopping list/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: /Add selected to quote/ }),
      ).not.toBeInTheDocument();
    });
  });

  it('adds a product to the cart', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const createCartSimple = vi.fn();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', basePrice: '122.33' },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
        }),
      );

    when(searchProducts)
      .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: Number(laughCanister.node.productId),
              name: laughCanister.node.productName,
              sku: laughCanister.node.sku,
              orderQuantityMaximum: 0,
              orderQuantityMinimum: 0,
              inventoryLevel: 100,
              variants: [
                buildVariantWith({
                  product_id: Number(laughCanister.node.productId),
                  variant_id: Number(laughCanister.node.variantId),
                  sku: laughCanister.node.variantSku,
                  purchasing_disabled: false,
                }),
                buildVariantWith({ product_id: Number(laughCanister.node.productId) }),
              ],
            }),
          ],
        },
      });

    when(createCartSimple)
      .calledWith({
        createCartInput: {
          lineItems: [
            {
              productEntityId: Number(laughCanister.node.productId),
              variantEntityId: Number(laughCanister.node.variantId),
              quantity: 1,
              selectedOptions: { multipleChoices: [], textFields: [] },
            },
          ],
        },
      })
      .thenDo(() => {
        const cart = buildGetCartWith({ data: { site: { cart: { entityId: '12345' } } } });

        getCart.mockReturnValue(cart);

        return { data: { cart: { createCart: { cart: cart.data.site.cart } } } };
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, {
      preloadedState,
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(screen.getByText('Products were added to cart')).toBeInTheDocument();
    });

    expect(Cookies.get('cartId')).toBe('12345');
    expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-cart-created', {
      cartId: '12345',
    });
  });

  describe('when the user has no permissions to purchase but shoppingList and quotes are enabled', () => {
    it('displays add to quote/shopping list when -add selected to- is clicked', async () => {
      const getRecentlyOrderedProducts = vi.fn();
      const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

      const laughCanister = buildRecentlyOrderedProductNodeWith({
        node: { productName: 'Laugh Canister', basePrice: '122.33' },
      });

      when(getRecentlyOrderedProducts)
        .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
        .thenReturn(
          buildGetRecentlyOrderedProductsWith({
            data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
          }),
        );

      when(searchProducts)
        .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
        .thenReturn({
          data: {
            productsSearch: [
              buildSearchProductWith({
                id: Number(laughCanister.node.productId),
                name: laughCanister.node.productName,
                sku: laughCanister.node.sku,
              }),
            ],
          },
        });

      server.use(
        graphql.query('RecentlyOrderedProducts', ({ query }) =>
          HttpResponse.json(getRecentlyOrderedProducts(query)),
        ),
        graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      );

      renderWithProviders(<QuickOrder />, {
        preloadedState: {
          company: {
            ...preloadedState.company,
            permissions: [{ code: 'purchase_enable', permissionLevel: 0 }],
          },
          storeInfo: storeInfoWithDateFormat,
        },
        initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
      });

      const row = await screen.findByRole('row', { name: /Laugh Canister/ });

      await userEvent.click(within(row).getByRole('checkbox'));

      const addButton = screen.getByRole('button', { name: 'Add selected to' });

      await userEvent.click(addButton);

      // { code: 'purchase_enable', permissionLevel: 0 }
      expect(
        screen.queryByRole('menuitem', { name: /Add selected to cart/ }),
      ).not.toBeInTheDocument();
      // shoppingListEnabled: true
      expect(
        screen.getByRole('menuitem', { name: /Add selected to shopping list/ }),
      ).toBeInTheDocument();
      // productQuoteEnabled: true
      expect(screen.getByRole('menuitem', { name: /Add selected to quote/ })).toBeInTheDocument();
    });
  });

  describe('when the user does not have permissions to purchase and shopping list/quote is disabled', () => {
    it('does not display the footer', async () => {
      const getRecentlyOrderedProducts = vi.fn();
      const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();

      const laughCanister = buildRecentlyOrderedProductNodeWith({
        node: { productName: 'Laugh Canister', basePrice: '122.33' },
      });
      when(getRecentlyOrderedProducts)
        .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
        .thenReturn(
          buildGetRecentlyOrderedProductsWith({
            data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
          }),
        );

      when(searchProducts)
        .calledWith(stringContainingAll(`productIds: [${laughCanister.node.productId}]`))
        .thenReturn({
          data: {
            productsSearch: [
              buildSearchProductWith({
                id: Number(laughCanister.node.productId),
                name: laughCanister.node.productName,
                sku: laughCanister.node.sku,
              }),
            ],
          },
        });

      server.use(
        graphql.query('RecentlyOrderedProducts', ({ query }) =>
          HttpResponse.json(getRecentlyOrderedProducts(query)),
        ),
        graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      );

      const preloadedState = {
        company: buildCompanyStateWith({
          ...approvedB2BCompany,
          permissions: [{ code: 'purchase_enable', permissionLevel: 0 }],
        }),
        storeInfo: storeInfoWithDateFormat,
      };

      renderWithProviders(<QuickOrder />, {
        preloadedState,
        initialGlobalContext: { productQuoteEnabled: false, shoppingListEnabled: false },
      });

      expect(screen.queryByRole('button', { name: 'Add selected to' })).not.toBeInTheDocument();
    });
  });

  describe('when no product is selected', () => {
    it('pressing the -add selected to- shows an error', async () => {
      const getRecentlyOrderedProducts = vi.fn();

      when(getRecentlyOrderedProducts)
        .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
        .thenReturn(
          buildGetRecentlyOrderedProductsWith({
            data: { orderedProducts: { totalCount: 0, edges: [] } },
          }),
        );

      server.use(
        graphql.query('RecentlyOrderedProducts', ({ query }) =>
          HttpResponse.json(getRecentlyOrderedProducts(query)),
        ),
      );

      renderWithProviders(<QuickOrder />, { preloadedState });

      const addButton = await screen.findByRole('button', { name: /Add selected to/ });

      await userEvent.click(addButton);

      expect(screen.getByText('Please select at least one item')).toBeInTheDocument();
    });
  });
});

describe('has no purchased products', () => {
  it('displays a -no products found- message', async () => {
    const getRecentlyOrderedProducts = vi.fn();

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 0, edges: [] } },
        }),
      );

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    expect(await screen.findByText('0 products')).toBeInTheDocument();
    expect(await screen.findByText('No products found')).toBeInTheDocument();
  });
});
