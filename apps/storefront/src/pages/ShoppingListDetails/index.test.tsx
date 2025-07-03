import { useParams } from 'react-router-dom';
import {
  buildCompanyStateWith,
  builder,
  bulk,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';

import { SearchProductsResponse } from '@/shared/service/b2b/graphql/product';
import { CustomerShoppingListB2B } from '@/shared/service/b2b/graphql/shoppingList';
import { CompanyStatus, UserTypes } from '@/types';

import ShoppingListDetailsContent from '.';

vitest.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: vitest.fn(),
}));

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
      { option_id: faker.string.numeric(), option_value: faker.word.sample() },
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
  customer: { userType: UserTypes.MULTIPLE_B2C },
  permissions: [
    { code: 'create_shopping_list', permissionLevel: 1 },
    { code: 'approve_draft_shopping_list', permissionLevel: 1 },
  ],
});

type SearchB2BProduct = SearchProductsResponse['data']['productsSearch'][number];
type SearchB2BProductV3Option = SearchB2BProduct['optionsV3'][number];
type SearchB2BProductV3OptionValue = SearchB2BProductV3Option['option_values'][number];

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
  variants: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => ({
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
  })),
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
  expect(screen.getByText('$460.00')).toBeInTheDocument();

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
