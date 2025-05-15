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
} from 'tests/test-utils';

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
    graphql.operation(() => HttpResponse.json({ errors: [{ message: 'API not mocked' }] })),
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
    graphql.operation(() => HttpResponse.json({ errors: [{ message: 'API not mocked' }] })),
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
    graphql.operation(() => HttpResponse.json({ errors: [{ message: 'API not mocked' }] })),
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
      graphql.operation(() => HttpResponse.json({ errors: [{ message: 'API not mocked' }] })),
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
      graphql.operation(() => HttpResponse.json({ errors: [{ message: 'API not mocked' }] })),
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
