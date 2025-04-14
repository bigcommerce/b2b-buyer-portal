import {
  buildCompanyStateWith,
  builder,
  http,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitForElementToBeRemoved,
} from 'tests/test-utils';

import { B2BRequest } from '@/shared/service/request/b3Fetch';
import { CompanyStatus, Customer, CustomerRole, LoginTypes, UserTypes } from '@/types';
import * as utilsModule from '@/utils';

import ShoppingListDetailsContent from '.';

const { server } = startMockServer();

const buildCustomerWith = builder<Customer>(() => ({
  id: 0,
  phoneNumber: '123123',
  firstName: 'test',
  lastName: 'test',
  emailAddress: 'test@bc.com',
  customerGroupId: 123,
  role: CustomerRole.GUEST,
  userType: UserTypes.DOES_NOT_EXIST,
  loginType: LoginTypes.WAITING_LOGIN,
  companyRoleName: 'Tester',
}));

const buildShoppingListGraphQLResponseWith = builder(() => ({
  id: '4',
  createdAt: 1744278967,
  updatedAt: 1744279004,
  name: 'Shopping List 1',
  description: 'Shopping List 1 description',
  status: 0,
  reason: null,
  customerInfo: {
    firstName: 'fn',
    lastName: 'ln',
    userId: 87,
    email: 'test@bc.com',
    role: '2',
  },
  isOwner: true,
  grandTotal: '109',
  totalDiscount: '0',
  totalTax: '0',
  isShowGrandTotal: false,
  channelId: null,
  channelName: '',
  approvedFlag: true,
  companyInfo: {
    companyId: '79',
    companyName: 'BC',
    companyAddress: 'Pitt street',
    companyCountry: 'Australia',
    companyState: 'NSW',
    companyCity: 'Sydney',
    companyZipCode: '2000',
    phoneNumber: '123456',
    bcId: '109',
  },
  products: {
    totalCount: 1,
    edges: [
      {
        node: {
          id: '3',
          createdAt: 1744278982,
          updatedAt: 1744278982,
          productId: 80,
          variantId: 64,
          quantity: 1,
          productName: '[Sample] Orbit Terrarium - Large',
          optionList: '[]',
          itemId: 3,
          baseSku: 'OTL',
          variantSku: 'OTL',
          basePrice: '109',
          discount: '0',
          tax: '0',
          enteredInclusive: false,
          productUrl: '/orbit-terrarium-large/',
          primaryImage: '',
          productNote: '',
        },
      },
    ],
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

it('shows "Add to list" panel for draft shopping lists', async () => {
  const draftStatusCode = 30;
  const draftShoppingList = buildShoppingListGraphQLResponseWith({
    status: draftStatusCode,
  });
  const shoppingListResponse = {
    data: {
      customerShoppingList: draftShoppingList,
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
      HttpResponse.json(shoppingListResponse),
    ),
  );

  const customer = buildCustomerWith({
    userType: UserTypes.B2B_SUPER_ADMIN,
  });

  const companyState = buildCompanyStateWith({
    customer,
    permissions: [{ code: 'create_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: {
      company: companyState,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('Shopping List 1')).toBeInTheDocument();
  expect(screen.getByText(/add to list/i)).toBeInTheDocument();
});

it('hides "Add to list" panel from b2b users for rejected shopping lists', async () => {
  const rejectedStatusCode = 50;
  const rejectedShoppingList = buildShoppingListGraphQLResponseWith({
    status: rejectedStatusCode,
  });
  const shoppingListResponse = {
    data: {
      customerShoppingList: rejectedShoppingList,
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
      HttpResponse.json(shoppingListResponse),
    ),
  );

  const customer = buildCustomerWith({
    userType: UserTypes.B2B_SUPER_ADMIN,
  });

  const companyState = buildCompanyStateWith({
    customer,
    permissions: [{ code: 'create_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: {
      company: companyState,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('Shopping List 1')).toBeInTheDocument();
  expect(screen.queryByText(/add to list/i)).not.toBeInTheDocument();
});

// Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
// For now we treat Deleted as Rejected so that the shopping lists that were previously rejected remain the same behavior
it('hides "Add to list" panel from b2b users for deleted shopping lists', async () => {
  const deletedStatusCode = 20;
  const deletedShoppingList = buildShoppingListGraphQLResponseWith({
    status: deletedStatusCode,
  });
  const shoppingListResponse = {
    data: {
      customerShoppingList: deletedShoppingList,
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
      HttpResponse.json(shoppingListResponse),
    ),
  );

  const customer = buildCustomerWith({
    userType: UserTypes.B2B_SUPER_ADMIN,
  });

  const companyState = buildCompanyStateWith({
    customer,
    permissions: [{ code: 'create_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
    preloadedState: {
      company: companyState,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

  expect(screen.getByText('Shopping List 1')).toBeInTheDocument();
  expect(screen.queryByText(/add to list/i)).not.toBeInTheDocument();
});

describe('when user approves a shopping list', () => {
  it('sends a mutation to approve the shopping list', async () => {
    const readyForApprovalStatusCode = 40;
    const customerInfo = {
      firstName: 'tester',
      lastName: 'tester',
      userId: 123,
      email: 'test@test.com',
      role: '2',
    };
    const companyInfoInShoppingList = {
      companyId: '79',
      companyName: 'BC',
      companyAddress: 'Pitt street',
      companyCountry: 'Australia',
      companyState: 'NSW',
      companyCity: 'Sydney',
      companyZipCode: '2000',
      phoneNumber: '123456',
      bcId: '109',
    };
    const readyForApprovalShoppingList = buildShoppingListGraphQLResponseWith({
      companyInfo: companyInfoInShoppingList,
      customerInfo,
      status: readyForApprovalStatusCode,
    });

    const shoppingListResponse = {
      data: {
        shoppingList: readyForApprovalShoppingList,
      },
    };

    const requestBodies: B2BRequest[] = [];

    const responseHandler = vi.fn(async ({ request }) => {
      const body = await request.json();
      requestBodies.push(body);

      return HttpResponse.json(shoppingListResponse);
    });

    server.use(http.post('https://api-b2b.bigcommerce.com/graphql', responseHandler));

    // It's not ideal that we are mocking the implementation of verifyLevelPermission
    // However since verifyLevelPermission has `store.getState()`, it is not able to load the test store states correctly
    // Until we refactor the verifyLevelPermission to use selector and avoid `store.getState()`, we will have to test it this way
    vi.spyOn(utilsModule, 'verifyLevelPermission').mockImplementation(
      ({ code, companyId, userId }) => {
        if (code === 'approve_draft_shopping_list' && companyId === 79 && userId === 123) {
          return true;
        }

        return false;
      },
    );

    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
    });

    const companyInfoInCompanyState = {
      id: '79',
      companyName: 'b2bc',
      status: CompanyStatus.APPROVED,
    };

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: companyInfoInCompanyState,
      permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
    });

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: {
        company: companyState,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Shopping List 1')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /approve/i }));

    const shoppingListsUpdateMutationBody = requestBodies.find((body) =>
      body.query.includes('mutation'),
    );
    const shoppingListsUpdateMutationVariables = shoppingListsUpdateMutationBody?.variables;

    expect(shoppingListsUpdateMutationVariables).toBeDefined();
    expect(shoppingListsUpdateMutationVariables.shoppingListData).toHaveProperty('status', 0);
  });
});

describe('when user rejects a shopping list', () => {
  it('sends a mutation to reject the shopping list', async () => {
    const readyForApprovalStatusCode = 40;
    const customerInfo = {
      firstName: 'tester',
      lastName: 'tester',
      userId: 123,
      email: 'test@test.com',
      role: '2',
    };
    const companyInfoInShoppingList = {
      companyId: '79',
      companyName: 'BC',
      companyAddress: 'Pitt street',
      companyCountry: 'Australia',
      companyState: 'NSW',
      companyCity: 'Sydney',
      companyZipCode: '2000',
      phoneNumber: '123456',
      bcId: '109',
    };
    const readyForApprovalShoppingList = buildShoppingListGraphQLResponseWith({
      companyInfo: companyInfoInShoppingList,
      customerInfo,
      status: readyForApprovalStatusCode,
    });

    const shoppingListResponse = {
      data: {
        shoppingList: readyForApprovalShoppingList,
      },
    };

    const requestBodies: B2BRequest[] = [];

    const responseHandler = vi.fn(async ({ request }) => {
      const body = await request.json();
      requestBodies.push(body);

      return HttpResponse.json(shoppingListResponse);
    });

    server.use(http.post('https://api-b2b.bigcommerce.com/graphql', responseHandler));

    // It's not ideal that we are mocking the implementation of verifyLevelPermission
    // However since verifyLevelPermission has `store.getState()`, it is not able to load the test store states correctly
    // Until we refactor the verifyLevelPermission to use selector and avoid `store.getState()`, we will have to test it this way
    vi.spyOn(utilsModule, 'verifyLevelPermission').mockImplementation(
      ({ code, companyId, userId }) => {
        if (code === 'approve_draft_shopping_list' && companyId === 79 && userId === 123) {
          return true;
        }

        return false;
      },
    );

    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
    });

    const companyInfoInCompanyState = {
      id: '79',
      companyName: 'b2bc',
      status: CompanyStatus.APPROVED,
    };

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: companyInfoInCompanyState,
      permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
    });

    renderWithProviders(<ShoppingListDetailsContent setOpenPage={() => {}} />, {
      preloadedState: {
        company: companyState,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.getByText('Shopping List 1')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /reject/i }));

    const shoppingListsUpdateMutationBody = requestBodies.find((body) =>
      body.query.includes('mutation'),
    );
    const shoppingListsUpdateMutationVariables = shoppingListsUpdateMutationBody?.variables;

    expect(shoppingListsUpdateMutationVariables).toBeDefined();
    expect(shoppingListsUpdateMutationVariables.shoppingListData).toHaveProperty('status', 50);
  });
});
