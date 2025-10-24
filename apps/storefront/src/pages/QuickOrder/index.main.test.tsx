// Does it make sense for someone without purchase permissions, shopping list disabled, and quote disabled to be able to access QuickOrder?

import Cookies from 'js-cookie';
import { set } from 'lodash-es';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  buildStoreInfoStateWith,
  bulk,
  faker,
  fireEvent,
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

import { PriceProductsResponse } from '@/shared/service/b2b/graphql/global';
import {
  SearchProductsResponse,
  ValidateProductResponse,
} from '@/shared/service/b2b/graphql/product';
import {
  OptionList,
  OrderedProductNode,
  RecentlyOrderedProductsResponse,
} from '@/shared/service/b2b/graphql/quickOrder';
import { GetCart } from '@/shared/service/bc/graphql/cart';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { LineItem } from '@/utils/b3Product/b3Product';

import QuickOrder from '.';

const { server } = startMockServer();

const buildMoneyWith = builder(() => ({
  currencyCode: faker.finance.currencyCode(),
  value: faker.number.float(),
}));

const buildRecentlyOrderedProductNodeOptionListWith = builder<OptionList>(() => ({
  id: faker.number.int(),
  option_id: faker.number.int(),
  order_product_id: faker.number.int(),
  product_option_id: faker.number.int(),
  display_name: faker.commerce.productName(),
  display_name_customer: faker.commerce.productName(),
  display_name_merchant: faker.commerce.productName(),
  display_value: faker.commerce.productAdjective(),
  display_value_customer: faker.commerce.productAdjective(),
  display_value_merchant: faker.commerce.productAdjective(),
  value: faker.commerce.productMaterial(),
  type: faker.commerce.productDescription(),
  name: faker.commerce.productName(),
  display_style: '',
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

type ValidateProduct = ValidateProductResponse['data']['validateProduct'];

interface VariantInfo {
  isStock: '1' | '0';
  stock: number;
  calculatedPrice: string;
  productId: string;
  variantId: string;
  baseSku: string;
  productName: string;
  categories: string[];
  option: unknown[];
  isVisible: '1' | '0';
  minQuantity: number;
  maxQuantity: number;
  modifiers: unknown[];
  purchasingDisabled: '1' | '0';
  variantSku: string;
  imageUrl: string;
}

interface VariantInfoResponse {
  data: {
    variantSku: VariantInfo[];
  };
}

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
  available_to_sell: faker.number.int(),
  unlimited_backorder: faker.datatype.boolean(),
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
  availableToSell: faker.number.int(),
  unlimitedBackorder: faker.datatype.boolean(),
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

const buildPrice = builder(() => ({
  asEntered: Number(faker.commerce.price()),
  enteredInclusive: faker.datatype.boolean(),
  taxExclusive: Number(faker.commerce.price()),
  taxInclusive: Number(faker.commerce.price()),
}));

const buildProductPriceWith = builder(() => ({
  productId: faker.number.int(),
  variantId: faker.number.int(),
  options: [],
  referenceRequest: {
    productId: faker.number.int(),
    variantId: faker.number.int(),
    options: null,
  },
  retailPrice: null,
  salePrice: null,
  minimumAdvertisedPrice: null,
  saved: null,
  price: buildPrice('WHATEVER_VALUES'),
  calculatedPrice: buildPrice('WHATEVER_VALUES'),
  priceRange: {
    minimum: buildPrice('WHATEVER_VALUES'),
    maximum: buildPrice('WHATEVER_VALUES'),
  },
  retailPriceRange: null,
  bulkPricing: [],
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

const buildValidateProductWith = builder<ValidateProduct>(() => ({
  responseType: faker.helpers.arrayElement(['ERROR', 'WARNING', 'SUCCESS']),
  message: faker.lorem.sentence(),
}));

const approvedB2BCompany = buildCompanyStateWith({
  permissions: [{ code: 'purchase_enable', permissionLevel: 1 }],
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: { userType: UserTypes.MULTIPLE_B2C },
});

const buildVariantInfoWith = builder<VariantInfo>(() => ({
  isStock: faker.helpers.arrayElement(['0', '1']),
  stock: faker.number.int(),
  calculatedPrice: faker.commerce.price(),
  productId: faker.number.int().toString(),
  variantId: faker.number.int().toString(),
  baseSku: faker.string.uuid(),
  productName: faker.commerce.productName(),
  categories: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () =>
    faker.number.int().toString(),
  ),
  imageUrl: faker.image.url(),
  option: [],
  isVisible: faker.helpers.arrayElement(['0', '1']),
  minQuantity: faker.number.int(),
  maxQuantity: faker.number.int(),
  modifiers: [],
  purchasingDisabled: faker.helpers.arrayElement(['0', '1']),
  variantSku: faker.string.uuid(),
}));

const buildVariantInfoResponseWith = builder<VariantInfoResponse>(() => ({
  data: {
    variantSku: [],
  },
}));

const buildCSVProductWith = builder(() => ({
  id: faker.string.uuid(),
  products: {
    baseSku: faker.string.uuid(),
    calculatedPrice: faker.number.int(),
    categories: [],
    imageUrl: faker.image.url(),
    isStock: '1',
    isVisible: '1',
    maxQuantity: 0,
    minQuantity: 0,
    modifiers: [],
    option: [],
    productId: faker.number.int().toString(),
    productName: faker.commerce.productName(),
    purchasingDisabled: false,
    stock: 0,
    variantId: faker.number.int(),
    variantSku: faker.string.uuid(),
  },
  sku: faker.string.uuid(),
  qty: faker.number.int({ min: 1, max: 10 }).toString(),
  row: faker.number.int(),
}));

interface CSVErrorProduct {
  products: {
    name: string;
    variantSku: string;
  };
  qty: string;
  error: string;
  sku: string;
  row: number;
}

const buildCSVErrorProductWith = builder<CSVErrorProduct>(() => ({
  products: {
    name: faker.commerce.productName(),
    variantSku: faker.string.uuid(),
  },
  qty: faker.number.int({ min: 1, max: 10 }).toString(),
  error: faker.lorem.sentence(),
  sku: faker.string.uuid(),
  row: faker.number.int({ min: 0, max: 100 }),
}));

const buildCSVUploadWith = builder(() => ({
  result: {
    errorFile: '',
    errorProduct: [] as CSVErrorProduct[],
    validProduct: bulk(buildCSVProductWith, 'WHATEVER_VALUES').times(
      faker.number.int({ min: 1, max: 5 }),
    ),
    stockErrorFile: '',
    stockErrorSkus: [] as string[],
  },
}));

const buildAddCartLineItemsResponseWith = builder(() => ({
  data: {
    cart: {
      addCartLineItems: {
        cart: {
          entityId: faker.string.uuid(),
        },
      },
    },
  },
  errors: undefined as Array<{ message: string }> | undefined,
}));

const storeInfoWithDateFormat = buildStoreInfoStateWith({ timeFormat: { display: 'j F Y' } });

const preloadedState = { company: approvedB2BCompany, storeInfo: storeInfoWithDateFormat };

beforeEach(() => {
  set(window, 'b2b.callbacks.dispatchEvent', vi.fn());
});

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
    .calledWith(stringContainingAll(laughCanister.node.productId, doorStationPanel.node.productId))
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
    .calledWith(stringContainingAll(laughCanister.node.productId, doorStationPanel.node.productId))
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

  renderWithProviders(<QuickOrder />, { preloadedState });

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

describe('when product purchasing_disabled', () => {
  it('displays an error message when trying to add to cart', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', variantSku: 'VARIANT-123' },
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
                  purchasing_disabled: true, // This variant is not purchasable
                }),
                buildVariantWith({ product_id: Number(laughCanister.node.productId) }),
              ],
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(buildGetCartWith({ data: { site: { cart: null } } })),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('SKU VARIANT-123 cannot be purchased in online store.'),
      ).toBeInTheDocument();
    });
  });

  describe('when purchasable out of stock is enabled', () => {
    it('can add the product to the cart', async () => {
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
                    purchasing_disabled: true, // This variant is not purchasable
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
        preloadedState: {
          ...preloadedState,
          global: buildGlobalStateWith({
            blockPendingQuoteNonPurchasableOOS: { isEnableProduct: true },
          }),
        },
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
  });
});

describe('when the product does not have enough stock', () => {
  it('displays an error message when trying to add to cart (variant)', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', variantSku: 'VARIANT-123' },
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
              inventoryTracking: 'variant',
              variants: [
                buildVariantWith({
                  product_id: Number(laughCanister.node.productId),
                  variant_id: Number(laughCanister.node.variantId),
                  sku: laughCanister.node.variantSku,
                  purchasing_disabled: false,
                  inventory_level: 2, // This variant is out of stock
                }),
                buildVariantWith({ product_id: Number(laughCanister.node.productId) }),
              ],
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(buildGetCartWith({ data: { site: { cart: null } } })),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '10');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('VARIANT-123 does not have enough stock, please change the quantity'),
      ).toBeInTheDocument();
    });
  });

  it('displays an error message when trying to add to cart (product)', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', variantSku: 'VARIANT-123' },
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
              inventoryLevel: 2, // This product is out of stock
              inventoryTracking: 'product',
              variants: [
                buildVariantWith({
                  product_id: Number(laughCanister.node.productId),
                  variant_id: Number(laughCanister.node.variantId),
                  sku: laughCanister.node.variantSku,
                  purchasing_disabled: false,
                  inventory_level: 100,
                }),
                buildVariantWith({ product_id: Number(laughCanister.node.productId) }),
              ],
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(buildGetCartWith({ data: { site: { cart: null } } })),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '10');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('VARIANT-123 does not have enough stock, please change the quantity'),
      ).toBeInTheDocument();
    });
  });
});

describe('when the quantity is not within the min/max', () => {
  it('adds to the cart when adding 1 item with 5 already in the cart, min of 5 and max of 10', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister' },
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
              sku: 'SKU-123',
              orderQuantityMaximum: 10,
              orderQuantityMinimum: 5,
              inventoryTracking: 'none',
              variants: [
                buildVariantWith({
                  product_id: Number(laughCanister.node.productId),
                  variant_id: Number(laughCanister.node.variantId),
                  sku: laughCanister.node.variantSku,
                  purchasing_disabled: false,
                }),
              ],
            }),
          ],
        },
      });

    const addCartLineItemsTwo = vi.fn();

    when(addCartLineItemsTwo)
      .calledWith({
        addCartLineItemsInput: {
          cartEntityId: 'foo-bar-ca-fe-ca-fe',
          data: {
            lineItems: [
              {
                quantity: 1,
                productEntityId: Number(laughCanister.node.productId),
                variantEntityId: Number(laughCanister.node.variantId),
                selectedOptions: {
                  multipleChoices: [],
                  textFields: [],
                },
              },
            ],
          },
        },
      })
      .thenReturn({});

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(
          buildGetCartWith({
            data: {
              site: {
                cart: {
                  entityId: 'foo-bar-ca-fe-ca-fe',
                  lineItems: {
                    physicalItems: [
                      buildCartItemWith({
                        productEntityId: Number(laughCanister.node.productId),
                        variantEntityId: Number(laughCanister.node.variantId),
                        sku: laughCanister.node.sku,
                        quantity: 5, // Cart already has 5 items
                      }),
                    ],
                  },
                },
              },
            },
          }),
        ),
      ),
      graphql.mutation('addCartLineItemsTwo', ({ variables }) =>
        HttpResponse.json(addCartLineItemsTwo(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(screen.getByText('Products were added to cart')).toBeInTheDocument();
    });
  });

  it('displays an error message when trying to add 1 item to the cart with min of 5', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister' },
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
              sku: 'SKU-123',
              orderQuantityMaximum: 0,
              orderQuantityMinimum: 5,
              inventoryTracking: 'none',
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(buildGetCartWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('You need to purchase a minimum of 5 of the SKU-123 per order.'),
      ).toBeInTheDocument();
    });
  });

  it('displays an error message when trying to add 10 items to the cart with max of 5', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister' },
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
              sku: 'SKU-123',
              orderQuantityMaximum: 5,
              orderQuantityMinimum: 0,
              inventoryTracking: 'none',
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(buildGetCartWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '10');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('You need to purchase a maximum of 5 of the SKU-123 per order.'),
      ).toBeInTheDocument();
    });
  });

  it('displays an error message when adding 4 items with 8 already in the cart and max of 10', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', variantSku: 'VARIANT-123' },
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
              sku: 'SKU-123',
              orderQuantityMaximum: 10,
              orderQuantityMinimum: 0,
              inventoryTracking: 'none',
              variants: [
                buildVariantWith({
                  product_id: Number(laughCanister.node.productId),
                  variant_id: Number(laughCanister.node.variantId),
                  sku: laughCanister.node.variantSku,
                  purchasing_disabled: false,
                }),
              ],
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(
          buildGetCartWith({
            data: {
              site: {
                cart: {
                  entityId: 'foo-bar-ca-fe-ca-fe',
                  lineItems: {
                    physicalItems: [
                      buildCartItemWith({
                        productEntityId: Number(laughCanister.node.productId),
                        variantEntityId: Number(laughCanister.node.variantId),
                        sku: laughCanister.node.sku,
                        quantity: 8, // Cart already has 8 items
                      }),
                    ],
                  },
                },
              },
            },
          }),
        ),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '4');

    await userEvent.click(within(row).getByRole('checkbox'));

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('You need to purchase a maximum of 10 of the VARIANT-123 per order.'),
      ).toBeInTheDocument();
    });
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

describe('when adding to quote', () => {
  it('click add to quote and it gets added to draft quote', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister' },
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
              sku: 'SKU-123',
              orderQuantityMaximum: 5,
              orderQuantityMinimum: 0,
              inventoryTracking: 'none',
              variants: [buildVariantWith({ sku: laughCanister.node.variantSku })],
            }),
          ],
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(buildGetCartWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<QuickOrder />, {
      preloadedState,
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '4');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to quote/ }));

    expect(await screen.findByText('Products were added to your quote')).toBeInTheDocument();
  });

  it('calls validateProducts query when feature flag is enabled', async () => {
    const featureFlags = {
      'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
    };

    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister' },
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
              sku: 'SKU-123',
              orderQuantityMaximum: 5,
              orderQuantityMinimum: 0,
              inventoryTracking: 'none',
              variants: [buildVariantWith({ sku: laughCanister.node.variantSku })],
            }),
          ],
        },
      });

    const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();
    when(validateProduct)
      .calledWith(
        expect.objectContaining({
          productId: Number(laughCanister.node.productId),
          variantId: Number(laughCanister.node.variantId),
          quantity: 4,
          productOptions: [],
        }),
      )
      .thenReturn({
        data: {
          validateProduct: buildValidateProductWith({ responseType: 'SUCCESS', message: '' }),
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(buildGetCartWith('WHATEVER_VALUES'))),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, {
      preloadedState: {
        ...preloadedState,
        global: buildGlobalStateWith({ featureFlags }),
      },
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '4');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to quote/ }));

    expect(validateProduct).toHaveBeenCalled();
    expect(await screen.findByText('Products were added to your quote')).toBeInTheDocument();
  });
});

describe('When backend validation feature flag is on', () => {
  const featureFlags = {
    'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
  };

  const backendValidationEnabledState = {
    ...preloadedState,
    company: {
      ...preloadedState.company,
      customer: {
        ...preloadedState.company.customer,
        role: CustomerRole.SENIOR_BUYER, // Override to Senior Buyer (value 1)
      },
    },
    global: buildGlobalStateWith({ featureFlags }),
  };

  it('displays an error message when adding to cart fails', async () => {
    const preloadedStateWithFeatureFlag = {
      ...preloadedState,
      global: buildGlobalStateWith({
        featureFlags: {
          'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
        },
      }),
    };
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', variantSku: 'VARIANT-123' },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
        }),
      );

    const variant = buildVariantWith({
      product_id: Number(laughCanister.node.productId),
      variant_id: Number(laughCanister.node.variantId),
      sku: laughCanister.node.variantSku,
      purchasing_disabled: false,
      inventory_level: 100,
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
              orderQuantityMaximum: 0,
              orderQuantityMinimum: 0,
              inventoryLevel: 2, // This product is out of stock
              inventoryTracking: 'product',
              variants: [variant],
            }),
          ],
        },
      });

    const createCartSimple = vi.fn();

    when(createCartSimple)
      .calledWith({
        createCartInput: {
          lineItems: [
            {
              productEntityId: variant.product_id,
              variantEntityId: variant.variant_id,
              quantity: 10,
              selectedOptions: { multipleChoices: [], textFields: [] },
            },
          ],
        },
      })
      .thenReturn({
        data: {
          cart: {
            createCart: null,
          },
        },
        errors: [
          {
            message: 'VARIANT-123 does not have enough stock, please change the quantity',
          },
        ],
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(buildGetCartWith({ data: { site: { cart: null } } })),
      ),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: preloadedStateWithFeatureFlag });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '10');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('VARIANT-123 does not have enough stock, please change the quantity'),
      ).toBeInTheDocument();
    });
  });

  it('displays out-of-stock error when adding to cart searched product', async () => {
    const preloadedStateWithFeatureFlag = {
      ...preloadedState,
      global: buildGlobalStateWith({
        featureFlags: {
          'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
        },
      }),
    };

    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));
    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 0, edges: [] } },
        }),
      );

    const variant = buildVariantWith({
      purchasing_disabled: false,
      inventory_level: 0,
      bc_calculated_price: {
        tax_exclusive: 123,
      },
    });

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Out of Stock Product"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Out of Stock Product',
              sku: 'OOS-123',
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 0,
              inventoryLevel: 0,
              optionsV3: [],
              isPriceHidden: false,
              variants: [variant],
            }),
          ],
        },
      });

    when(getPriceProducts)
      .calledWith({
        storeHash: 'store-hash',
        channelId: 1,
        currencyCode: 'USD',
        items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
        customerGroupId: 0,
      })
      .thenReturn({
        data: {
          priceProducts: [
            buildProductPriceWith({
              productId: variant.product_id,
              variantId: variant.variant_id,
              price: buildPrice({
                asEntered: 123.0,
                enteredInclusive: true,
                taxExclusive: 123.0,
                taxInclusive: 123.0,
              }),
              calculatedPrice: buildPrice({
                asEntered: 123.0,
                enteredInclusive: true,
                taxExclusive: 123.0,
                taxInclusive: 123.0,
              }),
            }),
          ],
        },
      });

    const createCartSimple = vi.fn();
    when(createCartSimple)
      .calledWith({
        createCartInput: {
          lineItems: [
            {
              productEntityId: variant.product_id,
              variantEntityId: variant.variant_id,
              quantity: 1,
              selectedOptions: { multipleChoices: [], textFields: [] },
            },
          ],
        },
      })
      .thenReturn({
        data: {
          cart: {
            createCart: null,
          },
        },
        errors: [
          {
            message: 'Product "Out of Stock Product" is out of stock.',
          },
        ],
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: preloadedStateWithFeatureFlag });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Quick order pad')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchInput, 'Out of Stock Product');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quick order pad' });

    expect(within(dialog).getByText('Out of Stock Product')).toBeInTheDocument();
    expect(within(dialog).getByText('OOS-123')).toBeInTheDocument();

    const addToCartButton = within(dialog).getByRole('button', { name: 'Add to cart' });
    await userEvent.click(addToCartButton);

    const errorMessage = await screen.findByText('Product "Out of Stock Product" is out of stock.');
    expect(errorMessage).toBeInTheDocument();

    expect(Cookies.get('cartId')).toBeUndefined();
  });

  it('displays an error message when trying to add to an existing cart and fails', async () => {
    const preloadedStateWithFeatureFlag = {
      ...preloadedState,
      global: buildGlobalStateWith({
        featureFlags: {
          'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
        },
      }),
    };
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: { productName: 'Laugh Canister', variantSku: 'VARIANT-123' },
    });

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 1, edges: [laughCanister] } },
        }),
      );

    const variant = buildVariantWith({
      product_id: Number(laughCanister.node.productId),
      variant_id: Number(laughCanister.node.variantId),
      sku: laughCanister.node.variantSku,
      purchasing_disabled: false,
      inventory_level: 100,
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
              orderQuantityMaximum: 0,
              orderQuantityMinimum: 0,
              inventoryLevel: 2,
              inventoryTracking: 'product',
              variants: [variant],
            }),
          ],
        },
      });

    const addCartLineItemsTwo = vi.fn();

    when(addCartLineItemsTwo)
      .calledWith({
        addCartLineItemsInput: {
          cartEntityId: 'foo-bar-ca-fe-ca-fe',
          data: {
            lineItems: [
              {
                productEntityId: variant.product_id,
                variantEntityId: variant.variant_id,
                quantity: 10,
                selectedOptions: { multipleChoices: [], textFields: [] },
              },
            ],
          },
        },
      })
      .thenReturn({
        data: {
          cart: {
            addCartLineItems: null,
          },
        },
        errors: [
          {
            message: 'VARIANT-123 does not have enough stock, please change the quantity',
          },
        ],
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () =>
        HttpResponse.json(
          buildGetCartWith({
            data: {
              site: {
                cart: {
                  entityId: 'foo-bar-ca-fe-ca-fe',
                  lineItems: {
                    physicalItems: [
                      buildCartItemWith({
                        productEntityId: Number(laughCanister.node.productId),
                        variantEntityId: Number(laughCanister.node.variantId),
                        sku: laughCanister.node.sku,
                        quantity: 1,
                      }),
                    ],
                  },
                },
              },
            },
          }),
        ),
      ),
      graphql.mutation('addCartLineItemsTwo', ({ variables }) =>
        HttpResponse.json(addCartLineItemsTwo(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: preloadedStateWithFeatureFlag });

    const row = await screen.findByRole('row', { name: /Laugh Canister/ });

    await userEvent.click(within(row).getByRole('checkbox'));

    const input = within(row).getByRole('spinbutton');

    await userEvent.clear(input);
    await userEvent.type(input, '10');

    const addButton = screen.getByRole('button', { name: 'Add selected to' });

    await userEvent.click(addButton);

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await waitFor(() => {
      expect(
        screen.getByText('VARIANT-123 does not have enough stock, please change the quantity'),
      ).toBeInTheDocument();
    });
  });

  it('displays an error message when searching for a product and adding to cart with wrong min quantity', async () => {
    const preloadedStateWithFeatureFlag = {
      ...preloadedState,
      global: buildGlobalStateWith({
        featureFlags: {
          'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
        },
      }),
    };

    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));
    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 0, edges: [] } },
        }),
      );

    const variant = buildVariantWith({
      purchasing_disabled: false,
      inventory_level: 100,
    });

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Min Quantity Product"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Min Quantity Product',
              sku: 'MIN-QTY-123',
              orderQuantityMinimum: 5,
              orderQuantityMaximum: 0,
              inventoryLevel: 100,
              optionsV3: [],
              isPriceHidden: false,
              variants: [variant],
            }),
          ],
        },
      });

    when(getPriceProducts)
      .calledWith({
        storeHash: 'store-hash',
        channelId: 1,
        currencyCode: 'USD',
        items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
        customerGroupId: 0,
      })
      .thenReturn({
        data: {
          priceProducts: [
            buildProductPriceWith({
              productId: variant.product_id,
              variantId: variant.variant_id,
              price: buildPrice({
                asEntered: 50.0,
                enteredInclusive: true,
                taxExclusive: 50.0,
                taxInclusive: 50.0,
              }),
              calculatedPrice: buildPrice({
                asEntered: 50.0,
                enteredInclusive: true,
                taxExclusive: 50.0,
                taxInclusive: 50.0,
              }),
            }),
          ],
        },
      });

    const createCartSimple = vi.fn();
    when(createCartSimple)
      .calledWith({
        createCartInput: {
          lineItems: [
            {
              productEntityId: variant.product_id,
              variantEntityId: variant.variant_id,
              quantity: 1,
              selectedOptions: { multipleChoices: [], textFields: [] },
            },
          ],
        },
      })
      .thenReturn({
        data: {
          cart: {
            createCart: null,
          },
        },
        errors: [
          {
            message: 'You need to purchase a minimum of 5 of the MIN-QTY-123 per order.',
          },
        ],
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: preloadedStateWithFeatureFlag });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Quick order pad')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchInput, 'Min Quantity Product');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quick order pad' });

    expect(within(dialog).getByText('Min Quantity Product')).toBeInTheDocument();
    expect(within(dialog).getByText('MIN-QTY-123')).toBeInTheDocument();

    const addToCartButton = within(dialog).getByRole('button', { name: 'Add to cart' });
    await userEvent.click(addToCartButton);

    const errorMessage = await screen.findByText(
      'You need to purchase a minimum of 5 of the MIN-QTY-123 per order.',
    );
    expect(errorMessage).toBeInTheDocument();

    expect(Cookies.get('cartId')).toBeUndefined();
  });

  it('displays an error message when searching for a product and adding to cart with wrong max quantity', async () => {
    const preloadedStateWithFeatureFlag = {
      ...preloadedState,
      global: buildGlobalStateWith({
        featureFlags: {
          'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
        },
      }),
    };

    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));
    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getRecentlyOrderedProducts)
      .calledWith(stringContainingAll('first: 12', 'offset: 0', 'orderBy: "-lastOrderedAt"'))
      .thenReturn(
        buildGetRecentlyOrderedProductsWith({
          data: { orderedProducts: { totalCount: 0, edges: [] } },
        }),
      );

    const variant = buildVariantWith({
      purchasing_disabled: false,
      inventory_level: 100,
    });

    when(searchProducts)
      .calledWith(stringContainingAll('search: "Max Quantity Product"', 'currencyCode: "USD"'))
      .thenReturn({
        data: {
          productsSearch: [
            buildSearchProductWith({
              id: variant.product_id,
              name: 'Max Quantity Product',
              sku: 'MAX-QTY-123',
              orderQuantityMinimum: 0,
              orderQuantityMaximum: 3,
              inventoryLevel: 100,
              optionsV3: [],
              isPriceHidden: false,
              variants: [variant],
            }),
          ],
        },
      });

    when(getPriceProducts)
      .calledWith({
        storeHash: 'store-hash',
        channelId: 1,
        currencyCode: 'USD',
        items: [{ productId: variant.product_id, variantId: variant.variant_id, options: [] }],
        customerGroupId: 0,
      })
      .thenReturn({
        data: {
          priceProducts: [
            buildProductPriceWith({
              productId: variant.product_id,
              variantId: variant.variant_id,
              price: buildPrice({
                asEntered: 25.0,
                enteredInclusive: true,
                taxExclusive: 25.0,
                taxInclusive: 25.0,
              }),
              calculatedPrice: buildPrice({
                asEntered: 25.0,
                enteredInclusive: true,
                taxExclusive: 25.0,
                taxInclusive: 25.0,
              }),
            }),
          ],
        },
      });

    const createCartSimple = vi.fn().mockReturnValue({
      data: {
        cart: {
          createCart: null,
        },
      },
      errors: [
        {
          message: 'You need to purchase a maximum of 3 of the MAX-QTY-123 per order.',
        },
      ],
    });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.query('priceProducts', ({ variables }) =>
        HttpResponse.json(getPriceProducts(variables)),
      ),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: preloadedStateWithFeatureFlag });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Quick order pad')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search products');
    await userEvent.type(searchInput, 'Max Quantity Product');
    await userEvent.click(screen.getByRole('button', { name: 'Search product' }));

    const dialog = await screen.findByRole('dialog', { name: 'Quick order pad' });

    expect(within(dialog).getByText('Max Quantity Product')).toBeInTheDocument();
    expect(within(dialog).getByText('MAX-QTY-123')).toBeInTheDocument();

    const quantityInput = within(dialog).getByRole('spinbutton');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '5');

    const addToCartButton = within(dialog).getByRole('button', { name: 'Add to cart' });
    await userEvent.click(addToCartButton);

    const errorMessage = await screen.findByText(
      'You need to purchase a maximum of 3 of the MAX-QTY-123 per order.',
    );
    expect(errorMessage).toBeInTheDocument();

    expect(Cookies.get('cartId')).toBeUndefined();
  });

  it('quick add displays an error message when trying to add out of stock product to new cart', async () => {
    const getVariantInfoBySkus = vi.fn();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));
    const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

    const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
      data: {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      },
    });

    const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

    const variantInfo = buildVariantInfoWith({
      productId: '123',
      variantId: '456',
      variantSku: 'OOS-123',
      option: [],
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["OOS-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    when(validateProduct)
      .calledWith(
        expect.objectContaining({
          productId: 123,
          variantId: 456,
          quantity: 2,
          productOptions: [],
        }),
      )
      .thenReturn({
        data: {
          validateProduct: buildValidateProductWith({
            responseType: 'ERROR',
            message: 'SKU OOS-123 is out of stock',
          }),
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const skuInputs = screen.getAllByLabelText(/SKU#/);
    const qtyInputs = screen.getAllByLabelText(/Qty/);
    const skuInput = skuInputs[0];
    const qtyInput = qtyInputs[0];

    await userEvent.type(skuInput, 'OOS-123');
    await userEvent.type(qtyInput, '2');

    const addButton = screen.getByRole('button', { name: /Add products to cart/i });
    await userEvent.click(addButton);

    const error = await screen.findByText('SKU OOS-123 is out of stock');
    expect(error).toBeInTheDocument();
  });

  it('quick add displays an error message when trying to add out of stock product to existing cart', async () => {
    const getVariantInfoBySkus = vi.fn();
    const validateProduct = vi.fn<(...arg: unknown[]) => ValidateProductResponse>();

    const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
      data: {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      },
    });

    const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

    const existingCart = buildGetCartWith({
      data: {
        site: {
          cart: {
            entityId: '12345',
            lineItems: {
              physicalItems: [buildCartItemWith({ sku: 'EXISTING-SKU', quantity: 1 })],
              digitalItems: [],
              customItems: [],
              giftCertificates: [],
            },
          },
        },
      },
    });

    const variantInfo = buildVariantInfoWith({
      productId: '123',
      variantId: '456',
      variantSku: 'OOS-123',
      option: [],
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["OOS-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    when(validateProduct)
      .calledWith(
        expect.objectContaining({
          productId: 123,
          variantId: 456,
          quantity: 3,
          productOptions: [],
        }),
      )
      .thenReturn({
        data: {
          validateProduct: buildValidateProductWith({
            responseType: 'ERROR',
            message: 'Product OOS-123 has insufficient stock',
          }),
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () => HttpResponse.json(existingCart)),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const skuInputs = screen.getAllByLabelText(/SKU#/);
    const qtyInputs = screen.getAllByLabelText(/Qty/);
    const skuInput = skuInputs[0];
    const qtyInput = qtyInputs[0];

    await userEvent.type(skuInput, 'OOS-123');
    await userEvent.type(qtyInput, '3');

    const addButton = screen.getByRole('button', { name: /Add products to cart/i });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Product OOS-123 has insufficient stock')).toBeInTheDocument();
    });
  });

  it('quick add displays an error message when trying to add non-existent SKU', async () => {
    const getVariantInfoBySkus = vi.fn();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
      data: {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      },
    });

    const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["NON-EXISTENT-SKU"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [] } }));

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const skuInputs = screen.getAllByLabelText(/SKU#/);
    const qtyInputs = screen.getAllByLabelText(/Qty/);
    const skuInput = skuInputs[0];
    const qtyInput = qtyInputs[0];

    await userEvent.type(skuInput, 'NON-EXISTENT-SKU');
    await userEvent.type(qtyInput, '1');

    const addButton = screen.getByRole('button', { name: /Add products to cart/i });
    await userEvent.click(addButton);

    const error = await screen.findByText(
      'SKU NON-EXISTENT-SKU were not found, please check entered values',
    );
    expect(error).toBeInTheDocument();
  });

  it('quick add shows not-found SKU error after adding valid products to cart', async () => {
    const getVariantInfoBySkus = vi.fn();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
      data: {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      },
    });

    const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

    const validVariant = buildVariantInfoWith({
      variantSku: 'VALID-SKU',
      productId: '123',
      variantId: '456',
      minQuantity: 0,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 100,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["VALID-SKU","NOT-FOUND-SKU"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [validVariant] } }));

    const validateProduct = vi.fn().mockReturnValue({
      data: {
        validateProduct: buildValidateProductWith({
          responseType: 'SUCCESS',
          message: '',
        }),
      },
    });

    const createCartSimple = vi.fn();

    when(createCartSimple)
      .calledWith(
        expect.objectContaining({
          createCartInput: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                productEntityId: Number(validVariant.productId),
                variantEntityId: Number(validVariant.variantId),
              }),
            ]),
          }),
        }),
      )
      .thenReturn({
        data: {
          cart: { createCart: { cart: { entityId: 'test-cart-id' } } },
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const skuInputs = screen.getAllByLabelText(/SKU#/);
    const qtyInputs = screen.getAllByLabelText(/Qty/);

    await userEvent.type(skuInputs[0], 'VALID-SKU');
    await userEvent.type(qtyInputs[0], '2');

    await userEvent.type(skuInputs[1], 'NOT-FOUND-SKU');
    await userEvent.type(qtyInputs[1], '3');

    const addButton = screen.getByRole('button', { name: /Add products to cart/i });
    await userEvent.click(addButton);

    expect(await screen.findByText('Products were added to cart')).toBeInTheDocument();

    expect(
      await screen.findByText('SKU NOT-FOUND-SKU were not found, please check entered values'),
    ).toBeInTheDocument();
  });

  it('quick add shows not-found SKU error with validation errors for mixed scenario', async () => {
    const getVariantInfoBySkus = vi.fn();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
      data: {
        orderedProducts: {
          totalCount: 0,
          edges: [],
        },
      },
    });

    const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

    const validVariant = buildVariantInfoWith({
      variantSku: 'VALID-SKU',
      productId: '123',
      variantId: '456',
      minQuantity: 0,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 100,
    });

    const outOfStockVariant = buildVariantInfoWith({
      variantSku: 'OUT-OF-STOCK-SKU',
      productId: '789',
      variantId: '012',
      minQuantity: 0,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 5,
    });

    when(getVariantInfoBySkus)
      .calledWith(
        expect.stringContaining('variantSkus: ["VALID-SKU","OUT-OF-STOCK-SKU","NOT-FOUND-SKU"]'),
      )
      .thenDo(() =>
        buildVariantInfoResponseWith({ data: { variantSku: [validVariant, outOfStockVariant] } }),
      );

    const validateProduct = vi.fn();

    when(validateProduct)
      .calledWith(
        expect.objectContaining({
          productId: Number(validVariant.productId),
        }),
      )
      .thenReturn({
        data: {
          validateProduct: buildValidateProductWith({
            responseType: 'SUCCESS',
            message: '',
          }),
        },
      });

    when(validateProduct)
      .calledWith(
        expect.objectContaining({
          productId: Number(outOfStockVariant.productId),
        }),
      )
      .thenReturn({
        data: {
          validateProduct: buildValidateProductWith({
            responseType: 'ERROR',
            message: 'OUT-OF-STOCK-SKU does not have enough stock, please change the quantity',
          }),
        },
      });

    const createCartSimple = vi.fn();

    when(createCartSimple)
      .calledWith(
        expect.objectContaining({
          createCartInput: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                quantity: 2,
                productEntityId: Number(validVariant.productId),
                variantEntityId: Number(validVariant.variantId),
              }),
            ]),
          }),
        }),
      )
      .thenReturn({
        data: {
          cart: { createCart: { cart: { entityId: 'test-cart-id' } } },
        },
      });

    server.use(
      graphql.query('RecentlyOrderedProducts', ({ query }) =>
        HttpResponse.json(getRecentlyOrderedProducts(query)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('ValidateProduct', ({ variables }) =>
        HttpResponse.json(validateProduct(variables)),
      ),
      graphql.query('getCart', () => HttpResponse.json(getCart())),
      graphql.mutation('createCartSimple', ({ variables }) =>
        HttpResponse.json(createCartSimple(variables)),
      ),
    );

    renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const skuInputs = screen.getAllByLabelText(/SKU#/);
    const qtyInputs = screen.getAllByLabelText(/Qty/);

    await userEvent.type(skuInputs[0], 'VALID-SKU');
    await userEvent.type(qtyInputs[0], '2');

    await userEvent.type(skuInputs[1], 'OUT-OF-STOCK-SKU');
    await userEvent.type(qtyInputs[1], '10');

    await userEvent.type(skuInputs[2], 'NOT-FOUND-SKU');
    await userEvent.type(qtyInputs[2], '3');

    const addButton = screen.getByRole('button', { name: /Add products to cart/i });
    await userEvent.click(addButton);

    expect(
      await screen.findByText(
        'OUT-OF-STOCK-SKU does not have enough stock, please change the quantity',
      ),
    ).toBeInTheDocument();

    expect(await screen.findByText('Products were added to cart')).toBeInTheDocument();

    expect(
      await screen.findByText('SKU NOT-FOUND-SKU were not found, please check entered values'),
    ).toBeInTheDocument();
  });

  it('adds a product to the cart succesfully', async () => {
    const getRecentlyOrderedProducts = vi.fn();
    const searchProducts = vi.fn<(...arg: unknown[]) => SearchProductsResponse>();
    const getCart = vi.fn().mockReturnValue(buildGetCartWith({ data: { site: { cart: null } } }));

    const createCartSimple = vi.fn();

    const laughCanister = buildRecentlyOrderedProductNodeWith({
      node: {
        productName: 'Laugh Canister',
        basePrice: '122.33',
        optionList: [
          buildRecentlyOrderedProductNodeOptionListWith({ product_option_id: 111, value: '8' }),
        ],
        optionSelections: [
          {
            option_id: 111,
            value_id: 8,
          },
        ],
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
              orderQuantityMaximum: 10,
              orderQuantityMinimum: 5,
              inventoryLevel: 100,
              variants: [
                buildVariantWith({
                  product_id: Number(laughCanister.node.productId),
                  variant_id: Number(laughCanister.node.variantId),
                  sku: laughCanister.node.variantSku,
                  purchasing_disabled: false,
                }),
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
              selectedOptions: {
                multipleChoices: [{ optionEntityId: 111, optionValueEntityId: 8 }],
                textFields: [],
              },
            },
          ],
        },
      })
      .thenReturn({
        data: {
          cart: {
            createCart: {
              cart: {
                entityId: '12345',
              },
            },
          },
        },
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

    renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

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

  describe('CSV bulk upload with backend validation', () => {
    it('handles successful CSV upload and adds products to cart', async () => {
      const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
        data: { orderedProducts: { totalCount: 0, edges: [] } },
      });

      const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

      const csvUpload = vi.fn().mockReturnValue({
        data: {
          productUpload: buildCSVUploadWith({
            result: {
              validProduct: [
                buildCSVProductWith({
                  products: {
                    productName: 'Test Product 1',
                    variantSku: 'TEST-SKU-123',
                  },
                  qty: '2',
                  row: 1,
                  sku: 'TEST-SKU-123',
                }),
              ],
              errorProduct: [],
              stockErrorFile: '',
              stockErrorSkus: [],
            },
          }),
        },
      });

      const getCart = vi.fn().mockReturnValue(buildGetCartWith({}));
      const createCartSimple = vi.fn().mockReturnValue({
        data: { cart: { createCart: { cart: { entityId: '12345' } } } },
      });

      server.use(
        graphql.query('RecentlyOrderedProducts', () =>
          HttpResponse.json(getRecentlyOrderedProducts()),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
        graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
        graphql.query('getCart', () => HttpResponse.json(getCart())),
        graphql.mutation('createCartSimple', () => HttpResponse.json(createCartSimple())),
        graphql.mutation('addCartLineItemsTwo', () =>
          HttpResponse.json(
            buildAddCartLineItemsResponseWith({
              data: {
                cart: {
                  addCartLineItems: {
                    cart: {
                      entityId: '12345',
                    },
                  },
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
      await userEvent.click(bulkUploadButton);

      const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

      const csvContent = 'variant_sku,qty\nTEST-SKU-123,2';
      const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

      const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
      if (!dropzoneInput) {
        throw new Error('File input not found');
      }

      await userEvent.upload(dropzoneInput, [file]);

      await waitFor(() => {
        expect(csvUpload).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('TEST-SKU-123')).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /Add 1 products to cart/i });
      await userEvent.click(addToCartButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Products were added to cart/i)).toBeInTheDocument();
        },
        { timeout: 8000 },
      );
    });

    it(
      'handles successful CSV upload and creates new cart when no existing cart',
      { timeout: 10000 },
      async () => {
        const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
          data: { orderedProducts: { totalCount: 0, edges: [] } },
        });

        const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

        const csvUpload = vi.fn().mockReturnValue({
          data: {
            productUpload: buildCSVUploadWith({
              result: {
                validProduct: [
                  buildCSVProductWith({
                    products: {
                      productName: 'New Cart Product',
                      variantSku: 'NEW-CART-SKU-123',
                    },
                    qty: '3',
                    row: 1,
                    sku: 'NEW-CART-SKU-123',
                  }),
                ],
                errorProduct: [],
                stockErrorFile: '',
                stockErrorSkus: [],
              },
            }),
          },
        });

        const getCart = vi.fn().mockReturnValue({
          data: { site: { cart: null } },
        });

        const createCartSimple = vi.fn().mockReturnValue({
          data: { cart: { createCart: { cart: { entityId: '67890' } } } },
        });

        const addCartLineItemsTwo = vi.fn().mockReturnValue(
          buildAddCartLineItemsResponseWith({
            data: {
              cart: {
                addCartLineItems: {
                  cart: { entityId: '67890' },
                },
              },
            },
            errors: undefined,
          }),
        );

        server.use(
          graphql.query('RecentlyOrderedProducts', () =>
            HttpResponse.json(getRecentlyOrderedProducts()),
          ),
          graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
          graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
          graphql.query('getCart', () => HttpResponse.json(getCart())),
          graphql.mutation('createCartSimple', () => HttpResponse.json(createCartSimple())),
          graphql.mutation('addCartLineItemsTwo', () => HttpResponse.json(addCartLineItemsTwo())),
        );

        renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

        await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

        const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
        await userEvent.click(bulkUploadButton);

        const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

        const csvContent = 'variant_sku,qty\nNEW-CART-SKU-123,3';
        const file = new File([csvContent], 'new-cart.csv', { type: 'text/csv' });

        const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
        if (!dropzoneInput) {
          throw new Error('File input not found');
        }

        await userEvent.upload(dropzoneInput, [file]);

        await waitFor(() => {
          expect(screen.getByText('NEW-CART-SKU-123')).toBeInTheDocument();
        });

        const addToCartButton = screen.getByRole('button', { name: /Add 1 products to cart/i });
        await userEvent.click(addToCartButton);

        await waitFor(
          () => {
            expect(screen.getByText(/Products were added to cart/i)).toBeInTheDocument();
          },
          { timeout: 8000 },
        );

        await waitFor(
          () => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
          },
          { timeout: 8000 },
        );

        expect(createCartSimple).toHaveBeenCalled();
      },
    );

    it('displays error when new cart creation fails', async () => {
      const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
        data: { orderedProducts: { totalCount: 0, edges: [] } },
      });

      const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

      const csvUpload = vi.fn().mockReturnValue({
        data: {
          productUpload: buildCSVUploadWith({
            result: {
              validProduct: [
                buildCSVProductWith({
                  products: {
                    productName: 'Failed Cart Product',
                    variantSku: 'FAIL-CART-SKU-123',
                  },
                  qty: '2',
                  row: 1,
                  sku: 'FAIL-CART-SKU-123',
                }),
              ],
              errorProduct: [],
              stockErrorFile: '',
              stockErrorSkus: [],
            },
          }),
        },
      });

      // Mock getCart to return null (no existing cart)
      const getCart = vi.fn().mockReturnValue({
        data: { site: { cart: null } },
      });

      const createCartSimple = vi.fn().mockReturnValue({
        data: null,
        errors: [{ message: 'Failed to create cart due to server error' }],
      });

      server.use(
        graphql.query('RecentlyOrderedProducts', () =>
          HttpResponse.json(getRecentlyOrderedProducts()),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
        graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
        graphql.query('getCart', () => HttpResponse.json(getCart())),
        graphql.mutation('createCartSimple', () => HttpResponse.json(createCartSimple())),
      );

      renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
      await userEvent.click(bulkUploadButton);

      const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

      const csvContent = 'variant_sku,qty\nFAIL-CART-SKU-123,2';
      const file = new File([csvContent], 'fail-cart.csv', { type: 'text/csv' });

      const dropzoneInput = dialog.querySelector<HTMLInputElement>('input[type="file"]');
      if (!dropzoneInput) {
        throw new Error('File input not found');
      }

      await userEvent.upload(dropzoneInput, [file]);

      await waitFor(() => {
        expect(screen.getByText('FAIL-CART-SKU-123')).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /Add 1 products to cart/i });
      await userEvent.click(addToCartButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create cart due to server error/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays CSV upload errors in the modal when products have validation errors', async () => {
      const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
        data: { orderedProducts: { totalCount: 0, edges: [] } },
      });

      const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

      const csvUpload = vi.fn().mockReturnValue({
        data: {
          productUpload: buildCSVUploadWith({
            result: {
              validProduct: [
                buildCSVProductWith({
                  products: {
                    productName: 'Valid Product',
                    variantSku: 'VALID-SKU-123',
                  },
                  qty: '1',
                  row: 1,
                  sku: 'VALID-SKU-123',
                }),
              ],
              errorProduct: [
                buildCSVErrorProductWith({
                  products: {
                    name: 'Invalid Product',
                    variantSku: 'INVALID-SKU-456',
                  },
                  qty: '1',
                  error: 'Product not found',
                  sku: 'INVALID-SKU-456',
                  row: 2,
                }),
              ],
              stockErrorFile: 'https://example.com/errors.csv',
              stockErrorSkus: ['INVALID-SKU-456'],
            },
          }),
        },
      });

      server.use(
        graphql.query('RecentlyOrderedProducts', () =>
          HttpResponse.json(getRecentlyOrderedProducts()),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
        graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
        graphql.query('getCart', () => HttpResponse.json(buildGetCartWith({}))),
        graphql.mutation('addCartLineItemsTwo', () =>
          HttpResponse.json(
            buildAddCartLineItemsResponseWith({
              data: {
                cart: {
                  addCartLineItems: {
                    cart: {
                      entityId: '12345',
                    },
                  },
                },
              },
            }),
          ),
        ),
      );

      renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
      await userEvent.click(bulkUploadButton);

      const file = new File(['variant_sku,qty\nVALID-SKU-123,1\nINVALID-SKU-456,1'], 'test.csv', {
        type: 'text/csv',
      });
      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      await userEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Valid (1)')).toBeInTheDocument();
      });

      expect(screen.getByText('Product not found')).toBeInTheDocument();

      expect(screen.getByText('Download error results')).toBeInTheDocument();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays out of stock error when cart API returns stock error', async () => {
      const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
        data: { orderedProducts: { totalCount: 0, edges: [] } },
      });

      const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

      const csvUpload = vi.fn().mockReturnValue({
        data: {
          productUpload: buildCSVUploadWith({
            result: {
              validProduct: [
                buildCSVProductWith({
                  products: {
                    productName: 'Out of Stock Product',
                    variantSku: 'OOS-SKU-123',
                  },
                  qty: '5',
                  row: 1,
                  sku: 'OOS-SKU-123',
                }),
              ],
              errorProduct: [],
              stockErrorFile: 'https://example.com/stock-errors.csv',
              stockErrorSkus: [],
            },
          }),
        },
      });

      const getCart = vi.fn().mockReturnValue(buildGetCartWith({}));

      const addCartLineItemsTwo = vi.fn().mockReturnValue({
        data: {
          cart: {
            addCartLineItems: null,
          },
        },
        errors: [
          {
            message:
              "Not enough stock: Item (OOS-SKU-123) out of stock is out of stock and can't be added to the cart.",
            path: ['cart', 'addCartLineItems'],
            locations: [{ line: 3, column: 7 }],
          },
        ],
      });

      server.use(
        graphql.query('RecentlyOrderedProducts', () =>
          HttpResponse.json(getRecentlyOrderedProducts()),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
        graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
        graphql.query('getCart', () => HttpResponse.json(getCart())),
        graphql.mutation('createCartSimple', () =>
          HttpResponse.json({
            data: { cart: { createCart: { cart: { entityId: '12345' } } } },
          }),
        ),
        graphql.mutation('addCartLineItemsTwo', () => HttpResponse.json(addCartLineItemsTwo())),
      );

      renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
      await userEvent.click(bulkUploadButton);

      const file = new File(['variant_sku,qty\nOOS-SKU-123,5'], 'test.csv', { type: 'text/csv' });
      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      await userEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('OOS-SKU-123')).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /Add 1 products to cart/i });
      await userEvent.click(addToCartButton);

      await waitFor(() => {
        expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays quantity limit error when cart API returns min quantity error', async () => {
      const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
        data: { orderedProducts: { totalCount: 0, edges: [] } },
      });

      const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

      const csvUpload = vi.fn().mockReturnValue({
        data: {
          productUpload: buildCSVUploadWith({
            result: {
              validProduct: [
                buildCSVProductWith({
                  products: {
                    productName: 'Min Quantity Product',
                    variantSku: 'MIN-QTY-SKU-123',
                  },
                  qty: '1',
                  row: 1,
                  sku: 'MIN-QTY-SKU-123',
                }),
              ],
              errorProduct: [],
              stockErrorFile: '',
              stockErrorSkus: [],
            },
          }),
        },
      });

      const getCart = vi.fn().mockReturnValue(buildGetCartWith({}));

      const addCartLineItemsTwo = vi.fn().mockReturnValue({
        data: {
          cart: {
            addCartLineItems: null,
          },
        },
        errors: [
          {
            message: 'You need to purchase a minimum of 5 of the MIN-QTY-SKU-123 per order.',
            path: ['cart', 'addCartLineItems'],
            locations: [{ line: 3, column: 7 }],
          },
        ],
      });

      server.use(
        graphql.query('RecentlyOrderedProducts', () =>
          HttpResponse.json(getRecentlyOrderedProducts()),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
        graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
        graphql.query('getCart', () => HttpResponse.json(getCart())),
        graphql.mutation('createCartSimple', () =>
          HttpResponse.json({
            data: { cart: { createCart: { cart: { entityId: '12345' } } } },
          }),
        ),
        graphql.mutation('addCartLineItemsTwo', () => HttpResponse.json(addCartLineItemsTwo())),
      );

      renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
      await userEvent.click(bulkUploadButton);

      const file = new File(['variant_sku,qty\nMIN-QTY-SKU-123,1'], 'test.csv', {
        type: 'text/csv',
      });
      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      await userEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('MIN-QTY-SKU-123')).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /Add 1 products to cart/i });
      await userEvent.click(addToCartButton);

      await waitFor(() => {
        expect(
          screen.getByText('You need to purchase a minimum of 5 of the MIN-QTY-SKU-123 per order.'),
        ).toBeInTheDocument();
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays generic error message for other cart API errors', async () => {
      const getRecentlyOrderedProducts = vi.fn().mockReturnValue({
        data: { orderedProducts: { totalCount: 0, edges: [] } },
      });

      const searchProducts = vi.fn().mockReturnValue({ data: { productsSearch: [] } });

      const csvUpload = vi.fn().mockReturnValue({
        data: {
          productUpload: buildCSVUploadWith({
            result: {
              validProduct: [
                buildCSVProductWith({
                  products: {
                    productName: 'Error Product',
                    variantSku: 'ERROR-SKU-123',
                  },
                  qty: '1',
                  row: 1,
                  sku: 'ERROR-SKU-123',
                }),
              ],
              errorProduct: [],
              stockErrorFile: 'https://example.com/errors.csv',
              stockErrorSkus: [],
            },
          }),
        },
      });

      const getCart = vi.fn().mockReturnValue(buildGetCartWith({}));

      const addCartLineItemsTwo = vi.fn().mockReturnValue({
        data: {
          cart: {
            addCartLineItems: null,
          },
        },
        errors: [
          {
            message: 'Product is discontinued and cannot be purchased',
            path: ['cart', 'addCartLineItems'],
            locations: [{ line: 3, column: 7 }],
          },
        ],
      });

      server.use(
        graphql.query('RecentlyOrderedProducts', () =>
          HttpResponse.json(getRecentlyOrderedProducts()),
        ),
        graphql.query('SearchProducts', () => HttpResponse.json(searchProducts())),
        graphql.mutation('ProductUpload', () => HttpResponse.json(csvUpload())),
        graphql.query('getCart', () => HttpResponse.json(getCart())),
        graphql.mutation('createCartSimple', () =>
          HttpResponse.json({
            data: { cart: { createCart: { cart: { entityId: '12345' } } } },
          }),
        ),
        graphql.mutation('addCartLineItemsTwo', () => HttpResponse.json(addCartLineItemsTwo())),
      );

      renderWithProviders(<QuickOrder />, { preloadedState: backendValidationEnabledState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const bulkUploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
      await userEvent.click(bulkUploadButton);

      const file = new File(['variant_sku,qty\nERROR-SKU-123,1'], 'test.csv', { type: 'text/csv' });
      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      await userEvent.click(uploadButton);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('ERROR-SKU-123')).toBeInTheDocument();
      });

      const addToCartButton = screen.getByRole('button', { name: /Add 1 products to cart/i });
      await userEvent.click(addToCartButton);

      await waitFor(() => {
        expect(
          screen.getByText('Product is discontinued and cannot be purchased'),
        ).toBeInTheDocument();
      });
    });
  });
});
