import { set } from 'lodash-es';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  bulk,
  faker,
  getUnixTime,
  graphql,
  HttpResponse,
  render,
  renderWithProviders,
  screen,
  startMockServer,
  stringContainingAll,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { CustomerRole, ShoppingListStatus } from '@/types';

import PDP from '.';

const { server } = startMockServer();

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockReturnValue();
});

interface ProductData {
  productId: string;
  quantity: string;
  sku: string;
  options: Record<string, string>;
}

function FakeProductDataProvider({ productId, quantity, sku, options }: ProductData) {
  return (
    <div className="productView">
      <input name="product_id" defaultValue={productId} />
      <input name="qty[]" defaultValue={quantity} />
      <span data-product-sku>{sku}</span>
      <form data-cart-item-add>
        {Object.entries(options).map(([key, value]) => (
          <input key={key} name={key} defaultValue={value} />
        ))}
      </form>
      <a href="#bar">Shopping List Click Node</a>
    </div>
  );
}

const buildShoppingListNodeWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    customerInfo: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      userId: faker.number.int(),
      email: faker.internet.email(),
    },
    updatedAt: getUnixTime(faker.date.recent()),
    isOwner: faker.datatype.boolean(),
    products: {
      totalCount: faker.number.int({ min: 0, max: 10 }),
    },
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
  },
}));

const buildShoppingListResponseWith = builder(() => {
  const totalCount = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      shoppingLists: {
        totalCount,
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildShoppingListNodeWith, 'WHATEVER_VALUES').times(totalCount),
      },
    },
  };
});

const buildProductSearchResultWith = builder(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  sku: faker.string.uuid(),
  variants: [],
  imageUrl: faker.image.url(),
  modifiers: [],
  options: [],
  optionsV3: [],
  channelId: [],
  productUrl: faker.internet.url(),
}));

describe('stencil', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      storeInfo: { platform: 'bigcommerce' },
      setOpenPageFn: vi.fn(),
    }),
    company: buildCompanyStateWith({
      customer: {
        role: CustomerRole.SUPER_ADMIN,
      },
    }),
  };

  it('can add a product with required options to a shopping list', async () => {
    render(
      <FakeProductDataProvider
        productId="123"
        sku="SKU-123"
        quantity="2"
        options={{ 'attribute[114]': '104' }}
      />,
    );

    const addItemsToShoppingList = vi.fn();

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [
              { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
            ],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'quantity: 2,',
          '{optionId: "attribute[114]", optionValue: "104" }',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    const shoppingListClickNode = screen.getByRole('link', { name: 'Shopping List Click Node' });

    renderWithProviders(<PDP />, {
      preloadedState,
      initialGlobalContext: { shoppingListClickNode },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('can add a variant of the product using a SKU to a shopping list', async () => {
    render(
      <FakeProductDataProvider
        productId="123"
        sku="SKU-123"
        quantity="2"
        options={{ 'attribute[114]': '104' }}
      />,
    );

    const addItemsToShoppingList = vi.fn();

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [{ variants: [{ variant_id: 333, sku: 'SKU-123' }] }],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'variantId: 333,', // this time it includes the variant ID
          'quantity: 2,',
          '{optionId: "attribute[114]", optionValue: "104" }',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    const shoppingListClickNode = screen.getByRole('link', { name: 'Shopping List Click Node' });

    renderWithProviders(<PDP />, {
      preloadedState,
      initialGlobalContext: { shoppingListClickNode },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('can create a shopping list from the modal and add a product to it', async () => {
    const createShoppingList = vi.fn();
    const getCompanyShoppingLists = vi.fn();
    const searchProducts = vi.fn();
    const addItemsToShoppingList = vi.fn();

    server.use(
      graphql.query('B2BCustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getCompanyShoppingLists(query)),
      ),
      graphql.mutation('CreateShoppingList', ({ variables }) =>
        HttpResponse.json(createShoppingList(variables)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(searchProducts)
      .calledWith(stringContainingAll('productIds: [123]'))
      .thenReturn({
        data: {
          productsSearch: [buildProductSearchResultWith('WHATEVER_VALUES')],
        },
      });

    when(createShoppingList)
      .calledWith({
        shoppingListData: {
          name: 'New Shopping List',
          description: 'This is a new shopping list',
          status: 0,
        },
      })
      .thenResolve({});

    when(getCompanyShoppingLists)
      .calledWith(stringContainingAll('first: 50', `status: ${ShoppingListStatus.Approved}`))
      .thenReturn(
        buildShoppingListResponseWith({
          data: {
            shoppingLists: {
              totalCount: 0,
              edges: [],
            },
          },
        }),
      );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'quantity: 1,',
          'optionList: [],',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    render(<FakeProductDataProvider productId="123" sku="SKU-123" quantity="1" options={{}} />);

    const shoppingListClickNode = screen.getByRole('link', { name: 'Shopping List Click Node' });

    renderWithProviders(<PDP />, {
      preloadedState,
      initialGlobalContext: { shoppingListClickNode },
    });

    const createNewButton = await screen.findByRole('button', { name: 'Create new' });

    await userEvent.click(createNewButton);

    expect(await screen.findByRole('heading', { name: 'Create new' })).toBeInTheDocument();

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });

    await userEvent.type(nameInput, 'New Shopping List');
    await userEvent.type(descriptionInput, 'This is a new shopping list');

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'New Shopping List' },
    });

    when(getCompanyShoppingLists, { times: 1 })
      .calledWith(stringContainingAll('first: 50'))
      .thenReturn(
        buildShoppingListResponseWith({
          data: { shoppingLists: { totalCount: 0, edges: [shoppingList] } },
        }),
      );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await userEvent.click(await screen.findByText('New Shopping List'));

    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });
  });

  it('navigates to the shopping list page when the "View Shopping List" button is clicked', async () => {
    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [buildProductSearchResultWith('WHATEVER_VALUES')],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', () => HttpResponse.json({})),
    );

    render(
      <FakeProductDataProvider
        productId="123"
        sku="SKU-123"
        quantity="2"
        options={{ 'attribute[1]': 'bar' }}
      />,
    );

    const shoppingListClickNode = screen.getByRole('link', { name: 'Shopping List Click Node' });

    renderWithProviders(<PDP />, {
      preloadedState,
      initialGlobalContext: { shoppingListClickNode },
    });

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await userEvent.click(await screen.findByRole('button', { name: 'view shopping list' }));

    expect(preloadedState.global.setOpenPageFn).toHaveBeenLastCalledWith({
      isOpen: true,
      openUrl: '/shoppingList/992',
      params: {
        shoppingListBtn: 'add',
      },
    });
  });

  describe('when a product missing a required variant is added to a shopping list', () => {
    it('triggers an error alert that indicates the product is missing required variant', async () => {
      render(
        <FakeProductDataProvider
          productId="123"
          sku="SKU-123"
          quantity="1"
          options={{ 'attribute[1]': '2' }}
        />,
      );

      const shoppingList = buildShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(
            buildShoppingListResponseWith({
              data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () =>
          HttpResponse.json({
            data: {
              productsSearch: [
                { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
              ],
            },
          }),
        ),
      );
      const shoppingListClickNode = screen.getByRole('link', { name: 'Shopping List Click Node' });

      renderWithProviders(<PDP />, {
        preloadedState,
        initialGlobalContext: { shoppingListClickNode },
      });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Please fill out product options first.')).toBeInTheDocument();
      });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('when an unexpected error occurred during adding a product to shopping list', () => {
    it('triggers an error alert that indicates something went wrong', async () => {
      render(
        <FakeProductDataProvider
          productId="123"
          sku="SKU-123"
          quantity="1"
          options={{ 'attribute[114]': '104' }}
        />,
      );

      const shoppingList = buildShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(
            buildShoppingListResponseWith({
              data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () =>
          HttpResponse.json({
            data: {
              productsSearch: [
                { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
              ],
            },
          }),
        ),
        graphql.mutation('AddItemsToShoppingList', () =>
          HttpResponse.json({ errors: [{ message: 'Something went wrong. Please try again.' }] }),
        ),
      );

      const shoppingListClickNode = screen.getByRole('link', { name: 'Shopping List Click Node' });

      renderWithProviders(<PDP />, {
        preloadedState,
        initialGlobalContext: { shoppingListClickNode },
      });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        // `toHaveLength(2)` is used because the error message appears twice in the UI
        // once shown by the `fetch` method and once by the Payment component
        expect(screen.getAllByText('Something went wrong. Please try again.')).toHaveLength(2);
      });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });
});

describe('other/catalyst', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      storeInfo: { platform: faker.helpers.arrayElement(['other', 'catalyst']) },
      setOpenPageFn: vi.fn(),
    }),
    company: buildCompanyStateWith({
      customer: {
        role: CustomerRole.SUPER_ADMIN,
      },
    }),
  };

  it('can add a product with required options to a shopping list', async () => {
    set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
      {
        productId: 123,
        optionSelections: { 'attribute[114]': '104' },
        quantity: 2,
      },
    ]);

    const addItemsToShoppingList = vi.fn();

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [
              { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
            ],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'quantity: 2,',
          '{optionId: "attribute[114]", optionValue: "104" }',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    renderWithProviders(<PDP />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('can add a variant of the product using a SKU to a shopping list', async () => {
    set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
      {
        productId: 123,
        sku: 'SKU-123',
        optionSelections: { 'attribute[114]': '104' },
        quantity: 2,
      },
    ]);

    const addItemsToShoppingList = vi.fn();

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [{ variants: [{ variant_id: 333, sku: 'SKU-123' }] }],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'variantId: 333,', // this time it includes the variant ID
          'quantity: 2,',
          '{optionId: "attribute[114]", optionValue: "104" }',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    renderWithProviders(<PDP />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('can add a product by a specific SKU to a shopping list', async () => {
    set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
      {
        productId: 123,
        sku: 'SKU-123',
        optionSelections: { 'attribute[114]': '104' },
        quantity: 2,
      },
    ]);

    const addItemsToShoppingList = vi.fn();

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [
              { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
            ],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'quantity: 2,',
          '{optionId: "attribute[114]", optionValue: "104" }',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    renderWithProviders(<PDP />, { preloadedState });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByText('OK'));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('can create a shopping list from the modal and add a product to it', async () => {
    const createShoppingList = vi.fn();
    const getCompanyShoppingLists = vi.fn();
    const searchProducts = vi.fn();
    const addItemsToShoppingList = vi.fn();

    server.use(
      graphql.query('B2BCustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getCompanyShoppingLists(query)),
      ),
      graphql.mutation('CreateShoppingList', ({ variables }) =>
        HttpResponse.json(createShoppingList(variables)),
      ),
      graphql.query('SearchProducts', ({ query }) => HttpResponse.json(searchProducts(query))),
      graphql.mutation('AddItemsToShoppingList', ({ query }) =>
        HttpResponse.json(addItemsToShoppingList(query)),
      ),
    );

    when(searchProducts)
      .calledWith(stringContainingAll('productIds: [123]'))
      .thenReturn({
        data: {
          productsSearch: [buildProductSearchResultWith('WHATEVER_VALUES')],
        },
      });

    when(createShoppingList)
      .calledWith({
        shoppingListData: {
          name: 'New Shopping List',
          description: 'This is a new shopping list',
          status: 0,
        },
      })
      .thenResolve({});

    when(getCompanyShoppingLists)
      .calledWith(stringContainingAll('first: 50', `status: ${ShoppingListStatus.Approved}`))
      .thenReturn(
        buildShoppingListResponseWith({
          data: {
            shoppingLists: {
              totalCount: 0,
              edges: [],
            },
          },
        }),
      );

    when(addItemsToShoppingList)
      .calledWith(
        stringContainingAll(
          'productId: 123,',
          'quantity: 1,',
          'optionList: [],',
          'shoppingListId: 992,',
        ),
      )
      .thenReturn({});

    set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
      {
        productId: 123,
        optionSelections: {},
        quantity: 1,
      },
    ]);

    renderWithProviders(<PDP />, { preloadedState });

    const createNewButton = await screen.findByRole('button', { name: 'Create new' });

    await userEvent.click(createNewButton);

    expect(await screen.findByRole('heading', { name: 'Create new' })).toBeInTheDocument();

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });

    await userEvent.type(nameInput, 'New Shopping List');
    await userEvent.type(descriptionInput, 'This is a new shopping list');

    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'New Shopping List' },
    });

    when(getCompanyShoppingLists, { times: 1 })
      .calledWith(stringContainingAll('first: 50', `status: ${ShoppingListStatus.Approved}`))
      .thenReturn(
        buildShoppingListResponseWith({
          data: { shoppingLists: { totalCount: 0, edges: [shoppingList] } },
        }),
      );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await userEvent.click(await screen.findByText('New Shopping List'));

    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.getByText('Products were added to your shopping list')).toBeInTheDocument();
    });
  });

  it('navigates to the shopping list page when the "View Shopping List" button is clicked', async () => {
    const shoppingList = buildShoppingListNodeWith({
      node: { id: '992', name: 'Foo Bar Shopping List' },
    });

    server.use(
      graphql.query('B2BCustomerShoppingLists', () =>
        HttpResponse.json(
          buildShoppingListResponseWith({
            data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
          }),
        ),
      ),
      graphql.query('SearchProducts', () =>
        HttpResponse.json({
          data: {
            productsSearch: [buildProductSearchResultWith('WHATEVER_VALUES')],
          },
        }),
      ),
      graphql.mutation('AddItemsToShoppingList', () => HttpResponse.json({})),
    );

    set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
      {
        productId: 123,
        optionSelections: { 'attribute[1]': 'bar' },
        quantity: 2,
      },
    ]);

    renderWithProviders(<PDP />, { preloadedState });

    await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await userEvent.click(await screen.findByRole('button', { name: 'view shopping list' }));

    expect(preloadedState.global.setOpenPageFn).toHaveBeenLastCalledWith({
      isOpen: true,
      openUrl: '/shoppingList/992',
      params: {
        shoppingListBtn: 'add',
      },
    });
  });

  describe('when a product missing a required variant is added to a shopping list', () => {
    it('triggers an error alert that indicates the product is missing required variant', async () => {
      set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
        {
          productId: 123,
          optionSelections: { 'attribute[1]': '2' },
          quantity: 2,
        },
      ]);

      const shoppingList = buildShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(
            buildShoppingListResponseWith({
              data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () =>
          HttpResponse.json({
            data: {
              productsSearch: [
                { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
              ],
            },
          }),
        ),
      );

      renderWithProviders(<PDP />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        expect(screen.getByText('Please fill out product options first.')).toBeInTheDocument();
      });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('when an unexpected error occurred during adding a product to shopping list', () => {
    it('triggers an error alert that indicates something went wrong', async () => {
      set(window, 'b2b.utils.shoppingList.itemFromCurrentPage', [
        {
          productId: 123,
          optionSelections: { 'attribute[114]': '104' },
          quantity: 1,
        },
      ]);

      const shoppingList = buildShoppingListNodeWith({
        node: { id: '992', name: 'Foo Bar Shopping List' },
      });

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(
            buildShoppingListResponseWith({
              data: { shoppingLists: { totalCount: 1, edges: [shoppingList] } },
            }),
          ),
        ),
        graphql.query('SearchProducts', () =>
          HttpResponse.json({
            data: {
              productsSearch: [
                { optionsV3: [{ id: 114, option_values: [{ id: 103 }, { id: 104 }] }] },
              ],
            },
          }),
        ),
        graphql.mutation('AddItemsToShoppingList', () =>
          HttpResponse.json({ errors: [{ message: 'Something went wrong. Please try again.' }] }),
        ),
      );

      renderWithProviders(<PDP />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      expect(screen.getByText('Add to shopping list')).toBeInTheDocument();

      await userEvent.click(await screen.findByText('Foo Bar Shopping List'));

      await userEvent.click(screen.getByText('OK'));

      await waitFor(() => {
        // `toHaveLength(2)` is used because the error message appears twice in the UI
        // once shown by the `fetch` method and once by the Payment component
        expect(screen.getAllByText('Something went wrong. Please try again.')).toHaveLength(2);
      });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });
});
