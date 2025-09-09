import { useParams } from 'react-router-dom';
import {
  buildCompanyStateWith,
  builder,
  bulk,
  faker,
  graphql,
  http,
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
import { SearchProductsResponse } from '@/shared/service/b2b/graphql/product';
import { CustomerShoppingListB2B } from '@/shared/service/b2b/graphql/shoppingList';
import { GetCart } from '@/shared/service/bc/graphql/cart';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import ShoppingListDetailsContent from '.';

vitest.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: vitest.fn(),
}));

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

const { server } = startMockServer();

type ShoppingListProductEdge =
  CustomerShoppingListB2B['data']['shoppingList']['products']['edges'][number];

const buildShoppingListProductEdgeWith = builder<ShoppingListProductEdge>(() => ({
  node: {
    id: faker.number.int().toString(),
    createdAt: faker.date.past().getTime(),
    updatedAt: faker.date.recent().getTime(),
    productId: faker.number.int(),
    variantId: faker.number.int(),
    quantity: faker.number.int({ min: 1, max: 10 }),
    productName: faker.commerce.productName(),
    optionList: JSON.stringify([
      { option_id: faker.number.int().toString(), option_value: faker.word.sample() },
    ]),
    itemId: faker.number.int(),
    baseSku: faker.string.alphanumeric(5),
    variantSku: faker.string.alphanumeric(5),
    basePrice: faker.commerce.price(),
    discount: faker.commerce.price(),
    tax: faker.commerce.price(),
    enteredInclusive: faker.datatype.boolean(),
    productUrl: faker.internet.url(),
    primaryImage: faker.image.url(),
    productNote: faker.lorem.sentence(),
  },
}));

const buildShoppingListGraphQLResponseWith = builder<CustomerShoppingListB2B>(() => {
  const shoppingListProductEdges = bulk(buildShoppingListProductEdgeWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 1, max: 12 }),
  );

  return {
    data: {
      shoppingList: {
        id: faker.number.int().toString(),
        createdAt: faker.date.past().getTime(),
        updatedAt: faker.date.recent().getTime(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        status: faker.helpers.arrayElement([0, 20, 30, 40, 50]),
        reason: faker.lorem.sentence(),
        customerInfo: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          userId: faker.number.int(),
          email: faker.internet.email(),
          role: faker.string.alpha(),
        },
        isOwner: faker.datatype.boolean(),
        grandTotal: faker.commerce.price(),
        totalDiscount: faker.commerce.price(),
        totalTax: faker.commerce.price(),
        isShowGrandTotal: faker.datatype.boolean(),
        channelId: faker.number.int().toString(),
        channelName: faker.company.name(),
        approvedFlag: faker.datatype.boolean(),
        companyInfo: {
          companyId: faker.number.int().toString(),
          companyName: faker.company.name(),
          companyAddress: faker.location.streetAddress(),
          companyCountry: faker.location.country(),
          companyState: faker.location.state(),
          companyCity: faker.location.city(),
          companyZipCode: faker.location.zipCode(),
          phoneNumber: faker.phone.number(),
          bcId: faker.number.int().toString(),
        },
        products: {
          totalCount: faker.number.int({ min: shoppingListProductEdges.length }),
          edges: shoppingListProductEdges,
        },
      },
    },
  };
});

const b2bCompanyWithShoppingListPermissions = buildCompanyStateWith({
  companyInfo: { status: CompanyStatus.APPROVED },
  customer: { userType: UserTypes.MULTIPLE_B2C, role: CustomerRole.SENIOR_BUYER },
  permissions: [
    { code: 'create_shopping_list', permissionLevel: 1 },
    { code: 'approve_draft_shopping_list', permissionLevel: 1 },
    { code: 'purchase_enable', permissionLevel: 1 },
  ],
});

type SearchB2BProduct = SearchProductsResponse['data']['productsSearch'][number];
type SearchB2BProductV3Option = SearchB2BProduct['optionsV3'][number];
type SearchB2BProductV3OptionValue = SearchB2BProductV3Option['option_values'][number];
type SearchB2BProductVariants = SearchB2BProduct['variants'][number];

const buildSearchB2BProductV3OptionValueWith = builder<SearchB2BProductV3OptionValue>(() => ({
  id: faker.number.int(),
  label: faker.commerce.productAdjective(),
  sort_order: faker.number.int(),
  value_data: null,
  is_default: faker.datatype.boolean(),
}));

const buildSearchB2BProductV3OptionWith = builder<SearchB2BProductV3Option>(() => ({
  id: faker.number.int(),
  product_id: faker.number.int(),
  name: faker.commerce.productMaterial(),
  display_name: faker.commerce.productMaterial(),
  type: faker.helpers.arrayElement(['rectangles', 'swatch']),
  sort_order: faker.number.int(),
  option_values: bulk(buildSearchB2BProductV3OptionValueWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  config: [],
}));

const buildSearchB2BProductVariantWith = builder<SearchB2BProductVariants>(() => ({
  variant_id: faker.number.int({ min: 1, max: 10000 }),
  product_id: faker.number.int(),
  sku: faker.number.int().toString(),
  option_values: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    id: faker.number.int(),
    label: faker.commerce.productAdjective(),
    option_id: faker.number.int(),
    option_display_name: faker.commerce.productMaterial(),
  })),
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

const buildSearchB2BProductWith = builder<SearchB2BProduct>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.number.int().toString(),
  costPrice: faker.commerce.price(),
  inventoryLevel: faker.number.int(),
  inventoryTracking: faker.helpers.arrayElement(['none', 'simple', 'variant']),
  availability: faker.helpers.arrayElement(['available', 'unavailable']),
  orderQuantityMinimum: faker.number.int(),
  orderQuantityMaximum: faker.number.int(),
  variants: bulk(buildSearchB2BProductVariantWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  currencyCode: faker.finance.currencyCode(),
  imageUrl: faker.image.url(),
  modifiers: [],
  options: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
    option_id: faker.number.int(),
    display_name: faker.commerce.productMaterial(),
    sort_order: faker.number.int(),
    is_required: faker.datatype.boolean(),
  })),
  optionsV3: bulk(buildSearchB2BProductV3OptionWith, 'WHATEVER_VALUES').times(
    faker.number.int({ min: 0, max: 10 }),
  ),
  channelId: [],
  productUrl: faker.internet.url(),
  taxClassId: faker.number.int(),
  isPriceHidden: faker.datatype.boolean(),
}));

const buildSearchProductsResponseWith = builder<SearchProductsResponse>(() => ({
  data: {
    productsSearch: bulk(buildSearchB2BProductWith, 'WHATEVER_VALUES').times(
      faker.number.int({ min: 0, max: 12 }),
    ),
  },
}));

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
    variantSku: bulk(buildVariantInfoWith, 'WHATEVER_VALUES').times(
      faker.number.int({ min: 1, max: 5 }),
    ),
  },
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

it('displays a summary of products within the shopping list', async () => {
  vitest.mocked(useParams).mockReturnValue({ id: '272989' });

  const lovelySocks = buildShoppingListProductEdgeWith({ node: { productName: 'Lovely socks' } });
  const fancyHat = buildShoppingListProductEdgeWith({ node: { productName: 'Fancy hat' } });

  const shoppingListResponse = buildShoppingListGraphQLResponseWith({
    data: {
      shoppingList: {
        grandTotal: '500',
        totalTax: '40',
        products: { totalCount: 2, edges: [lovelySocks, fancyHat] },
      },
    },
  });

  server.use(
    graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
    graphql.query('SearchProducts', () =>
      HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
    ),
  );

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: { company: b2bCompanyWithShoppingListPermissions },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('2 products')).toBeInTheDocument();

  // This is a workaround for the fact that the total price is not immediately available.
  // The price is set after a useEffect and can fail during tests.
  await waitFor(() => {
    expect(screen.getByText('$460.00')).toBeInTheDocument();
  });

  expect(screen.getByRole('row', { name: /Lovely socks/ })).toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Fancy hat/ })).toBeInTheDocument();
});

it('displays the details of each product', async () => {
  vitest.mocked(useParams).mockReturnValue({ id: '272989' });

  const lovelySocksProductEdge = buildShoppingListProductEdgeWith({
    node: {
      productName: 'Lovely socks',
      productId: 73737,
      variantSku: 'LVLY-SK-123',
      productNote: 'Decorative wool socks',
      primaryImage: 'https://example.com/socks.jpg',
      basePrice: '49.00',
      tax: '0.00',
      discount: '0.00',
      quantity: 2,
      optionList: JSON.stringify([
        { valueLabel: 'color', valueText: 'red' },
        { valueLabel: 'size', valueText: 'large' },
      ]),
    },
  });

  const shoppingListResponse = buildShoppingListGraphQLResponseWith({
    data: { shoppingList: { products: { totalCount: 1, edges: [lovelySocksProductEdge] } } },
  });

  const lovelySocksSearchProduct = buildSearchB2BProductWith({
    id: lovelySocksProductEdge.node.productId,
    name: lovelySocksProductEdge.node.productName,
    isPriceHidden: false,
    optionsV3: [
      buildSearchB2BProductV3OptionWith({
        display_name: 'Size',
        option_values: [
          buildSearchB2BProductV3OptionValueWith({ label: 'large', is_default: true }),
        ],
      }),
    ],
  });

  const searchProductsQuerySpy = vi.fn();
  server.use(
    graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
    graphql.query('SearchProducts', ({ query }) => {
      searchProductsQuerySpy(query);

      return HttpResponse.json(
        buildSearchProductsResponseWith({ data: { productsSearch: [lovelySocksSearchProduct] } }),
      );
    }),
  );

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: { company: b2bCompanyWithShoppingListPermissions },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(searchProductsQuerySpy).toHaveBeenCalledWith(
    expect.stringContaining('productIds: [73737]'),
  );

  const row = screen.getByRole('row', { name: /Lovely socks/ });

  expect(within(row).getByRole('img')).toHaveAttribute('src', 'https://example.com/socks.jpg');
  expect(within(row).getByText('Lovely socks')).toBeInTheDocument();
  expect(within(row).getByText('Size: large')).toBeInTheDocument();
  expect(within(row).getByText('LVLY-SK-123')).toBeInTheDocument();
  expect(within(row).getByText('Decorative wool socks')).toBeInTheDocument();
  expect(within(row).getByRole('cell', { name: '$49.00' })).toBeInTheDocument();
  expect(within(row).getByRole('cell', { name: '2' })).toBeInTheDocument();
  expect(within(row).getByRole('cell', { name: '$98.00' })).toBeInTheDocument();
});

describe('when the user clicks on a product name', () => {
  it('navigates to the product details page', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    // crude spy to intercept the window.location.href setter
    const hrefSpy = vitest.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue(
      Object.defineProperty({ ...window.location }, 'href', { set: hrefSpy }),
    );

    const lovelySocksProductEdge = buildShoppingListProductEdgeWith({
      node: {
        productName: 'Lovely socks',
        productId: 73737,
        productUrl: '/products/73737/lovely-socks',
      },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: { shoppingList: { products: { totalCount: 1, edges: [lovelySocksProductEdge] } } },
    });

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const row = screen.getByRole('row', { name: /Lovely socks/ });

    await userEvent.click(within(row).getByText('Lovely socks'));

    expect(hrefSpy).toHaveBeenCalledWith(`${window.location.origin}/products/73737/lovely-socks`);
  });
});

it('shows "Add to list" panel for draft shopping lists', async () => {
  vitest.mocked(useParams).mockReturnValue({ id: '272989' });

  const draftStatusCode = 30;
  const shoppingListResponse = buildShoppingListGraphQLResponseWith({
    data: {
      shoppingList: {
        name: 'Shopping List 1',
        status: draftStatusCode,
      },
    },
  });

  server.use(
    graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
    graphql.query('SearchProducts', () =>
      HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
    ),
  );

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: { company: b2bCompanyWithShoppingListPermissions },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('Shopping List 1')).toBeInTheDocument();
  expect(screen.getByText(/add to list/i)).toBeInTheDocument();
});

it('hides "Add to list" panel from b2b users for rejected shopping lists', async () => {
  vitest.mocked(useParams).mockReturnValue({ id: '272989' });

  const rejectedStatusCode = 50;
  const shoppingListResponse = buildShoppingListGraphQLResponseWith({
    data: {
      shoppingList: {
        name: 'Shopping List 1',
        status: rejectedStatusCode,
      },
    },
  });

  server.use(
    graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
    graphql.query('SearchProducts', () =>
      HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
    ),
  );

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: { company: b2bCompanyWithShoppingListPermissions },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('Shopping List 1')).toBeInTheDocument();
  expect(screen.queryByText(/add to list/i)).not.toBeInTheDocument();
});

// Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
// For now we treat Deleted as Rejected so that the shopping lists that were previously rejected remain the same behavior
it('hides "Add to list" panel from b2b users for deleted shopping lists', async () => {
  vitest.mocked(useParams).mockReturnValue({ id: '272989' });

  const deletedStatusCode = 20;
  const shoppingListResponse = buildShoppingListGraphQLResponseWith({
    data: {
      shoppingList: {
        name: 'Shopping List 1',
        status: deletedStatusCode,
      },
    },
  });

  server.use(
    graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
    graphql.query('SearchProducts', () =>
      HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
    ),
  );

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: { company: b2bCompanyWithShoppingListPermissions },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('Shopping List 1')).toBeInTheDocument();
  expect(screen.queryByText(/add to list/i)).not.toBeInTheDocument();
});

describe('when user approves a shopping list', () => {
  it('fires a request to update shopping list status to approved', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    const readyForApprovalStatusCode = 40;
    const approvedStatusCode = 0;
    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: { shoppingList: { name: 'Shopping List 1', status: readyForApprovalStatusCode } },
    });

    const updateB2BShoppingListVariablesSpy = vi.fn();

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
      ),
      graphql.mutation('UpdateB2BShoppingList', ({ variables }) => {
        updateB2BShoppingListVariablesSpy(variables);

        return HttpResponse.json({
          data: {
            shoppingListsUpdate: {
              ...shoppingListResponse.data.shoppingList,
              status: approvedStatusCode,
            },
          },
        });
      }),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Shopping List 1')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /approve/i }));

    expect(updateB2BShoppingListVariablesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 272989,
        shoppingListData: expect.objectContaining({ status: approvedStatusCode }),
      }),
    );
  });
});

describe('when user rejects a shopping list', () => {
  it('fires a request to update shopping list status to rejected', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    const readyForApprovalStatusCode = 40;
    const rejectedStatusCode = 50;
    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: { name: 'Shopping List 1', status: readyForApprovalStatusCode },
      },
    });

    const updateB2BShoppingListVariablesSpy = vi.fn();

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
      ),
      graphql.mutation('UpdateB2BShoppingList', ({ variables }) => {
        updateB2BShoppingListVariablesSpy(variables);

        return HttpResponse.json({
          data: {
            shoppingListsUpdate: {
              ...shoppingListResponse.data.shoppingList,
              status: rejectedStatusCode,
            },
          },
        });
      }),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Shopping List 1')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /reject/i }));

    expect(updateB2BShoppingListVariablesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 272989,
        shoppingListData: expect.objectContaining({ status: rejectedStatusCode }),
      }),
    );
  });
});

describe("when a product's quantity is increased", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays an updated total amount for that product', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    const twoLovelySocks = buildShoppingListProductEdgeWith({
      node: { productName: 'Lovely socks', quantity: 2, basePrice: '49.00' },
    });

    const threeLovelySocks = buildShoppingListProductEdgeWith({
      node: { ...twoLovelySocks.node, quantity: 3 },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: { shoppingList: { status: 0, products: { totalCount: 1, edges: [twoLovelySocks] } } },
    });

    const getShoppingList = vi.fn().mockReturnValueOnce(shoppingListResponse);

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(getShoppingList())),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
      ),
      graphql.mutation('B2BUpdateShoppingListItems', () =>
        HttpResponse.json({
          data: { shoppingListsItemsUpdate: { shoppingListsItem: threeLovelySocks.node } },
        }),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const rowOfLovelySocks = screen.getByRole('row', { name: /Lovely socks/ });
    expect(within(rowOfLovelySocks).getByRole('cell', { name: '$98.00' })).toBeInTheDocument();

    getShoppingList.mockReturnValueOnce(
      buildShoppingListGraphQLResponseWith({
        data: {
          shoppingList: { status: 0, products: { totalCount: 1, edges: [threeLovelySocks] } },
        },
      }),
    );

    const quantityInput = within(rowOfLovelySocks).getByRole('spinbutton');

    await userEvent.type(quantityInput, '3', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });

    expect(within(rowOfLovelySocks).getByRole('cell', { name: '$147.00' })).toBeInTheDocument();
  });

  it('should keep checkbox selection even after the product Qty update', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const twoLovelyBoots = buildShoppingListProductEdgeWith({
      node: { productName: 'Lovely boots', quantity: 2, basePrice: '49.00' },
    });

    const threeLovelyBoots = buildShoppingListProductEdgeWith({
      node: { ...twoLovelyBoots.node, quantity: 3 },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: { shoppingList: { status: 0, products: { totalCount: 1, edges: [twoLovelyBoots] } } },
    });

    const getShoppingList = vi.fn().mockReturnValueOnce(shoppingListResponse);

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(getShoppingList())),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
      ),
      graphql.mutation('B2BUpdateShoppingListItems', () =>
        HttpResponse.json({
          data: { shoppingListsItemsUpdate: { shoppingListsItem: threeLovelyBoots.node } },
        }),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const rowOfLovelyBoots = screen.getByRole('row', { name: /Lovely boots/ });
    within(rowOfLovelyBoots).getByRole('checkbox').click();

    getShoppingList.mockReturnValueOnce(
      buildShoppingListGraphQLResponseWith({
        data: {
          shoppingList: { status: 0, products: { totalCount: 1, edges: [threeLovelyBoots] } },
        },
      }),
    );

    const quantityInput = within(rowOfLovelyBoots).getByRole('spinbutton');
    await userEvent.type(quantityInput, '3', {
      initialSelectionStart: 0,
      initialSelectionEnd: Infinity,
    });
    expect(getShoppingList).toHaveBeenCalledTimes(2);
    quantityInput.blur();

    await waitFor(() => {
      expect(getShoppingList).toHaveBeenCalledTimes(3);
    });
    expect(within(rowOfLovelyBoots).getByRole('checkbox')).toBeChecked();
    spy.mockRestore();
  });
});

describe('when the user updates the product notes', () => {
  it('updates the product note in the shopping list', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    const lovelySocks = buildShoppingListProductEdgeWith({
      node: { itemId: 12345, productName: 'Lovely socks', productNote: 'Initial note' },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: { shoppingList: { products: { totalCount: 1, edges: [lovelySocks] } } },
    });

    const getShoppingList = vi.fn().mockReturnValueOnce(shoppingListResponse);
    const updateShoppingLists = vi.fn();

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(getShoppingList())),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
      ),
      graphql.mutation('B2BUpdateShoppingListItems', ({ query }) =>
        HttpResponse.json(updateShoppingLists(query)),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const rowOfLovelySocks = screen.getByRole('row', { name: /Lovely socks/ });

    expect(within(rowOfLovelySocks).getByText('Initial note')).toBeInTheDocument();

    await userEvent.hover(rowOfLovelySocks);

    await userEvent.click(within(rowOfLovelySocks).getByTestId('StickyNote2Icon'));

    const noteModal = screen.getByRole('dialog');

    const noteInput = within(noteModal).getByPlaceholderText('Add notes to products');
    await userEvent.clear(noteInput);

    await userEvent.type(noteInput, 'Updated note');

    const lovelySocksUpdated = buildShoppingListProductEdgeWith({
      node: { ...lovelySocks.node, productNote: 'Updated note' },
    });

    when(updateShoppingLists)
      .calledWith(stringContainingAll('itemId: 12345', 'productNote: "Updated note"'))
      .thenReturn({
        data: { shoppingListsItemsUpdate: { shoppingListsItem: lovelySocksUpdated.node } },
      });

    const shoppingListResponseUpdated = buildShoppingListGraphQLResponseWith({
      data: { shoppingList: { products: { totalCount: 1, edges: [lovelySocksUpdated] } } },
    });

    getShoppingList.mockReturnValueOnce(shoppingListResponseUpdated);

    await userEvent.click(within(noteModal).getByRole('button', { name: 'save' }));

    expect(await within(rowOfLovelySocks).findByText('Updated note')).toBeInTheDocument();
  });
});

describe('when the shopping list is ready for approval', () => {
  it('does not display the "add to list" section', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    const readyForApprovalStatusCode = 40;
    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: { name: 'Shopping List 1', status: readyForApprovalStatusCode },
      },
    });

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(buildSearchProductsResponseWith({ data: { productsSearch: [] } })),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.queryByRole('heading', { name: 'Add to list' })).not.toBeInTheDocument();
  });
});

describe('when shopping list products verify inventory into add to cart', () => {
  it('it error on exceed product inventory', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'LVLY-SK-123',
      minQuantity: 0,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 1,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["LVLY-SK-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    const lovelySocksProductEdge = buildShoppingListProductEdgeWith({
      node: {
        productName: 'Lovely socks',
        productId: 73737,
        variantSku: 'LVLY-SK-123',
        productNote: 'Decorative wool socks',
        primaryImage: 'https://example.com/socks.jpg',
        basePrice: '49.00',
        tax: '0.00',
        discount: '0.00',
        quantity: 2,
        optionList: JSON.stringify([
          { valueLabel: 'color', valueText: 'red' },
          { valueLabel: 'size', valueText: 'large' },
        ]),
      },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: { products: { totalCount: 1, edges: [lovelySocksProductEdge] }, status: 0 },
      },
    });

    const lovelySocksSearchProduct = buildSearchB2BProductWith({
      id: lovelySocksProductEdge.node.productId,
      name: lovelySocksProductEdge.node.productName,
      isPriceHidden: false,
      optionsV3: [
        buildSearchB2BProductV3OptionWith({
          display_name: 'Size',
          option_values: [
            buildSearchB2BProductV3OptionValueWith({ label: 'large', is_default: true }),
          ],
        }),
      ],
    });

    const searchProductsQuerySpy = vi.fn();
    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', ({ query }) => {
        searchProductsQuerySpy(query);

        return HttpResponse.json(
          buildSearchProductsResponseWith({ data: { productsSearch: [lovelySocksSearchProduct] } }),
        );
      }),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(searchProductsQuerySpy).toHaveBeenCalledWith(
      expect.stringContaining('productIds: [73737]'),
    );

    const row = screen.getByRole('row', { name: /Lovely socks/ });

    expect(within(row).getByText('Lovely socks')).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '2' })).toBeInTheDocument();

    const checkbox = within(row).getByRole('checkbox');

    await userEvent.click(checkbox);

    expect(within(row).getByRole('checkbox')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /Add selected to/ }));

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await screen.findByText('1 product(s) were not added to cart, please change the quantity');

    spy.mockRestore();
  });

  it('it error on min quantity not reached', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'LVLY-SK-123',
      minQuantity: 3,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 5,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["LVLY-SK-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    const lovelySocksProductEdge = buildShoppingListProductEdgeWith({
      node: {
        productName: 'Lovely socks',
        productId: 73737,
        variantSku: 'LVLY-SK-123',
        productNote: 'Decorative wool socks',
        primaryImage: 'https://example.com/socks.jpg',
        basePrice: '49.00',
        tax: '0.00',
        discount: '0.00',
        quantity: 2,
        optionList: JSON.stringify([
          { valueLabel: 'color', valueText: 'red' },
          { valueLabel: 'size', valueText: 'large' },
        ]),
      },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: { products: { totalCount: 1, edges: [lovelySocksProductEdge] }, status: 0 },
      },
    });

    const lovelySocksSearchProduct = buildSearchB2BProductWith({
      id: lovelySocksProductEdge.node.productId,
      name: lovelySocksProductEdge.node.productName,
      isPriceHidden: false,
      optionsV3: [
        buildSearchB2BProductV3OptionWith({
          display_name: 'Size',
          option_values: [
            buildSearchB2BProductV3OptionValueWith({ label: 'large', is_default: true }),
          ],
        }),
      ],
    });

    const searchProductsQuerySpy = vi.fn();
    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', ({ query }) => {
        searchProductsQuerySpy(query);

        return HttpResponse.json(
          buildSearchProductsResponseWith({ data: { productsSearch: [lovelySocksSearchProduct] } }),
        );
      }),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(searchProductsQuerySpy).toHaveBeenCalledWith(
      expect.stringContaining('productIds: [73737]'),
    );

    const row = screen.getByRole('row', { name: /Lovely socks/ });

    expect(within(row).getByText('Lovely socks')).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '2' })).toBeInTheDocument();

    const checkbox = within(row).getByRole('checkbox');

    await userEvent.click(checkbox);

    expect(within(row).getByRole('checkbox')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /Add selected to/ }));

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await screen.findByText('1 product(s) were not added to cart, please change the quantity');

    spy.mockRestore();
  });

  it('it error on max quantity exceed', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const getVariantInfoBySkus = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'LVLY-SK-123',
      maxQuantity: 3,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 5,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["LVLY-SK-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    const lovelySocksProductEdge = buildShoppingListProductEdgeWith({
      node: {
        productName: 'Lovely socks',
        productId: 73737,
        variantSku: 'LVLY-SK-123',
        productNote: 'Decorative wool socks',
        primaryImage: 'https://example.com/socks.jpg',
        basePrice: '49.00',
        tax: '0.00',
        discount: '0.00',
        quantity: 4,
        optionList: JSON.stringify([
          { valueLabel: 'color', valueText: 'red' },
          { valueLabel: 'size', valueText: 'large' },
        ]),
      },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: { products: { totalCount: 1, edges: [lovelySocksProductEdge] }, status: 0 },
      },
    });

    const lovelySocksSearchProduct = buildSearchB2BProductWith({
      id: lovelySocksProductEdge.node.productId,
      name: lovelySocksProductEdge.node.productName,
      isPriceHidden: false,
      optionsV3: [
        buildSearchB2BProductV3OptionWith({
          display_name: 'Size',
          option_values: [
            buildSearchB2BProductV3OptionValueWith({ label: 'large', is_default: true }),
          ],
        }),
      ],
    });

    const searchProductsQuerySpy = vi.fn();
    const getShoppingList = vi.fn();

    when(getShoppingList).calledWith().thenReturn(shoppingListResponse);

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', ({ query }) => {
        searchProductsQuerySpy(query);

        return HttpResponse.json(
          buildSearchProductsResponseWith({ data: { productsSearch: [lovelySocksSearchProduct] } }),
        );
      }),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(searchProductsQuerySpy).toHaveBeenCalledWith(
      expect.stringContaining('productIds: [73737]'),
    );

    const row = screen.getByRole('row', { name: /Lovely socks/ });

    expect(within(row).getByText('Lovely socks')).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '4' })).toBeInTheDocument();

    const checkbox = within(row).getByRole('checkbox');

    await userEvent.click(checkbox);

    expect(within(row).getByRole('checkbox')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /Add selected to/ }));

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to cart/ }));

    await screen.findByText('1 product(s) were not added to cart, please change the quantity');

    spy.mockRestore();
  });
});

describe('Add to quote', () => {
  it('add shopping list to draft quote', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });
    // const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const getVariantInfoBySkus = vi.fn();
    const searchProductsQuerySpy = vi.fn();

    const variantInfo = buildVariantInfoWith({
      variantSku: 'LVLY-SK-123',
      maxQuantity: 3,
      purchasingDisabled: '0',
      isStock: '1',
      stock: 5,
    });

    when(getVariantInfoBySkus)
      .calledWith(expect.stringContaining('variantSkus: ["LVLY-SK-123"]'))
      .thenDo(() => buildVariantInfoResponseWith({ data: { variantSku: [variantInfo] } }));

    const lovelySocksProductEdge = buildShoppingListProductEdgeWith({
      node: {
        productName: 'Lovely socks',
        productId: 73737,
        variantSku: 'LVLY-SK-123',
        productNote: 'Decorative wool socks',
        primaryImage: 'https://example.com/socks.jpg',
        basePrice: '49.00',
        tax: '0.00',
        discount: '0.00',
        quantity: 4,
        optionList: JSON.stringify([
          { valueLabel: 'color', valueText: 'red' },
          { valueLabel: 'size', valueText: 'large' },
        ]),
      },
    });

    const shoppingListResponse = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: { products: { totalCount: 1, edges: [lovelySocksProductEdge] }, status: 0 },
      },
    });

    const lovelySocksSearchProduct = buildSearchB2BProductWith({
      id: lovelySocksProductEdge.node.productId,
      name: lovelySocksProductEdge.node.productName,
      isPriceHidden: false,
      sku: lovelySocksProductEdge.node.variantSku,
      variants: [
        buildSearchB2BProductVariantWith({
          sku: lovelySocksProductEdge.node.variantSku,
        }),
      ],
      optionsV3: [
        buildSearchB2BProductV3OptionWith({
          display_name: 'Size',
          option_values: [
            buildSearchB2BProductV3OptionValueWith({ label: 'large', is_default: true }),
          ],
        }),
      ],
    });

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(shoppingListResponse)),
      graphql.query('SearchProducts', ({ query }) => {
        searchProductsQuerySpy(query);

        return HttpResponse.json(
          buildSearchProductsResponseWith({ data: { productsSearch: [lovelySocksSearchProduct] } }),
        );
      }),
      graphql.query('GetVariantInfoBySkus', ({ query }) =>
        HttpResponse.json(getVariantInfoBySkus(query)),
      ),
      graphql.query('getCart', () =>
        HttpResponse.json<GetCart>({ data: { site: { cart: null } } }),
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
      initialGlobalContext: { productQuoteEnabled: true, shoppingListEnabled: true },
    });

    await screen.findByRole('heading', { name: /add to list/i });

    const row = screen.getByRole('row', { name: /Lovely socks/ });

    expect(within(row).getByText('Lovely socks')).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: '4' })).toBeInTheDocument();

    const checkbox = within(row).getByRole('checkbox');

    await userEvent.click(checkbox);

    expect(within(row).getByRole('checkbox')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /Add selected to/ }));

    await userEvent.click(screen.getByRole('menuitem', { name: /Add selected to quote/ }));

    await screen.findByText('Products were added to your quote');
  });
});

describe('CSV upload and add to quote flow', () => {
  it('should successfully upload CSV products and add them to quote', async () => {
    vitest.mocked(useParams).mockReturnValue({ id: '272989' });

    const initialShoppingList = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: {
          name: 'Shopping List 1',
          id: '272989',
          status: 0,
          products: {
            totalCount: 0,
            edges: [],
          },
        },
      },
    });

    const csvProducts = [
      {
        products: {
          productId: '73737',
          variantId: '12345',
          productName: 'CSV Product 1',
          variantSku: 'CSV-001',
          quantity: 2,
          basePrice: '29.99',
          option: [],
          modifiers: [],
          purchasingDisabled: '0',
        },
        qty: '2',
      },
      {
        products: {
          productId: '73738',
          variantId: '12346',
          productName: 'CSV Product 2',
          variantSku: 'CSV-002',
          quantity: 3,
          basePrice: '19.99',
          option: [],
          modifiers: [],
          purchasingDisabled: '0',
        },
        qty: '3',
      },
    ];

    const productUploadMutationResponse = {
      data: {
        productUpload: {
          result: {
            errorFile: '',
            errorProduct: [],
            validProduct: csvProducts,
            stockErrorFile: '',
            stockErrorSkus: [],
          },
        },
      },
    };

    const updatedShoppingList = buildShoppingListGraphQLResponseWith({
      data: {
        shoppingList: {
          status: 0,
          products: {
            totalCount: csvProducts.length,
            edges: csvProducts.map((csvProduct) =>
              buildShoppingListProductEdgeWith({
                node: {
                  productId: parseInt(csvProduct.products.productId, 10),
                  variantId: parseInt(csvProduct.products.variantId, 10),
                  productName: csvProduct.products.productName,
                  variantSku: csvProduct.products.variantSku,
                  quantity: parseInt(csvProduct.qty, 10),
                  basePrice: csvProduct.products.basePrice,
                  tax: '0.00',
                  discount: '0.00',
                  optionList: '[]',
                },
              }),
            ),
          },
        },
      },
    });

    let currentShoppingList = initialShoppingList;

    const getPriceProducts = vi.fn<(...arg: unknown[]) => PriceProductsResponse>();

    when(getPriceProducts)
      .calledWith({
        storeHash: 'store-hash',
        channelId: 1,
        currencyCode: 'USD',
        items: [
          {
            productId: csvProducts[0].products.productId,
            variantId: csvProducts[0].products.variantId,
            options: [],
          },
        ],
        customerGroupId: 0,
      })
      .thenReturn({
        data: {
          priceProducts: [buildProductPriceWith('WHATEVER_VALUES')],
        },
      });

    server.use(
      graphql.query('B2BShoppingListDetails', async () => HttpResponse.json(currentShoppingList)),
      graphql.mutation('B2BShoppingListsItemsCreate', () => {
        const shoppingListProducts = csvProducts.map((csvProduct) =>
          buildShoppingListProductEdgeWith({
            node: {
              itemId: parseInt(csvProduct.products.variantId, 10),
              productId: parseInt(csvProduct.products.productId, 10),
              variantId: parseInt(csvProduct.products.variantId, 10),
              productName: csvProduct.products.productName,
              variantSku: csvProduct.products.variantSku,
              quantity: parseInt(csvProduct.qty, 10),
              basePrice: '29.99',
              tax: '0.00',
              discount: '0.00',
              optionList: JSON.stringify([]),
              primaryImage: '',
              productNote: '',
            },
          }),
        );

        // Update the current shopping list to include the newly added products
        currentShoppingList = buildShoppingListGraphQLResponseWith({
          data: {
            shoppingList: {
              name: 'Shopping List 1',
              status: 30,
              id: '272989',
              products: {
                totalCount: csvProducts.length,
                edges: shoppingListProducts,
              },
            },
          },
        });

        return HttpResponse.json({
          data: {
            shoppingListsItemsCreate: {
              shoppingListsItems: csvProducts.map((csvProduct) => ({
                itemId: parseInt(csvProduct.products.variantId, 10),
                productId: parseInt(csvProduct.products.productId, 10),
                variantId: parseInt(csvProduct.products.variantId, 10),
                productName: csvProduct.products.productName,
                variantSku: csvProduct.products.variantSku,
                quantity: parseInt(csvProduct.qty, 10),
                optionList: JSON.stringify([]),
                basePrice: '29.99',
                tax: '0.00',
                discount: '0.00',
              })),
            },
          },
        });
      }),
      graphql.query('SearchProducts', () =>
        HttpResponse.json(
          buildSearchProductsResponseWith({
            data: {
              productsSearch: csvProducts.map((csvProduct) =>
                buildSearchB2BProductWith({
                  id: parseInt(csvProduct.products.productId, 10),
                  name: csvProduct.products.productName,
                  sku: csvProduct.products.variantSku,
                  variants: [
                    buildSearchB2BProductVariantWith({
                      sku: csvProduct.products.variantSku,
                      variant_id: parseInt(csvProduct.products.variantId, 10),
                    }),
                  ],
                }),
              ),
            },
          }),
        ),
      ),
      graphql.query('GetVariantInfoBySkus', () =>
        HttpResponse.json(
          buildVariantInfoResponseWith({
            data: {
              variantSku: csvProducts.map((csvProduct) =>
                buildVariantInfoWith({
                  productId: csvProduct.products.productId,
                  variantId: csvProduct.products.variantId,
                  variantSku: csvProduct.products.variantSku,
                  productName: csvProduct.products.productName,
                  isStock: '1',
                  stock: 100,
                  purchasingDisabled: '0',
                }),
              ),
            },
          }),
        ),
      ),
      graphql.query('priceProducts', () => {
        return HttpResponse.json(getPriceProducts());
      }),
      graphql.mutation('AddItemsToShoppingList', () => {
        return HttpResponse.json({
          data: {
            shoppingListsItemsCreate: {
              shoppingListsItems: csvProducts.map((csvProduct) => ({
                itemId: parseInt(csvProduct.products.variantId, 10),
                productId: parseInt(csvProduct.products.productId, 10),
                variantId: parseInt(csvProduct.products.variantId, 10),
                productName: csvProduct.products.productName,
                variantSku: csvProduct.products.variantSku,
                quantity: parseInt(csvProduct.qty, 10),
                optionList: JSON.stringify([]),
                basePrice: '29.99',
                tax: '0.00',
                discount: '0.00',
              })),
            },
          },
        });
      }),
      // since prouctUpload it's a anonymous mutation we can't intercept
      http.post(
        'https://api-b2b.bigcommerce.com/graphql',
        async ({ request }: { request: Request }) => {
          const clone = request.clone();
          const body = await clone.text();

          if (body.includes('productUpload') && !body.includes('productAnonUpload')) {
            currentShoppingList = updatedShoppingList;
            return HttpResponse.json(productUploadMutationResponse);
          }
          return new HttpResponse(null, { status: 404 });
        },
      ),
    );

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: { company: b2bCompanyWithShoppingListPermissions },
      initialGlobalContext: {
        productQuoteEnabled: true,
        shoppingListEnabled: true,
      },
    });

    await screen.findByRole('heading', { name: /add to list/i });

    const uploadButton = screen.getByRole('button', { name: /bulk upload csv/i });
    await userEvent.click(uploadButton);

    const dialog = await screen.findByRole('dialog', { name: /bulk upload/i });

    const csvContent = 'variant_sku,qty\nCSV-001,2\nCSV-002,3';
    const file = new File([csvContent], 'products.csv', { type: 'text/csv' });

    const dropzoneInput = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    if (!dropzoneInput) {
      throw new Error('File input not found');
    }

    const files = [file];

    await userEvent.upload(dropzoneInput, files);

    await within(dialog).findByText('products.csv');
    await within(dialog).findByText('products.csv');

    const addToListButton = screen.getByRole('button', { name: /add to list/i });
    await userEvent.click(addToListButton);

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));

    expect(await screen.findByText('CSV Product 1')).toBeInTheDocument();
    expect(await screen.findByText('CSV Product 2')).toBeInTheDocument();

    const row = screen.getByRole('row', { name: /CSV Product 1/i });

    const checkbox = within(row).getByRole('checkbox');

    await userEvent.click(checkbox);

    expect(within(row).getByRole('checkbox')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /Add selected to/ }));

    const addToQuoteOption = screen.getByRole('menuitem', { name: /add selected to quote/i });
    await userEvent.click(addToQuoteOption);

    await screen.findByText(/products were added to your quote/i);
    expect(screen.getByText(/view quote/i)).toBeInTheDocument();
  });
});
