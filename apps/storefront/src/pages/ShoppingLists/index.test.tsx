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

import ShoppingLists from '.';

const { server } = startMockServer();

// TODO: we should use faker to generate random data once faker is in place
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

// TODO: we should use faker to generate random data once faker is in place
const buildShoppingListGraphQLResponseNodeWith = builder(() => ({
  id: '123',
  name: 'shopping list 1',
  description: 'shopping list 1 description',
  status: 0,
  customerInfo: {
    firstName: 'tester',
    lastName: 'tester',
    userId: 87,
    email: 'test@test.com',
    role: '2',
  },
  updatedAt: 1744279004,
  isOwner: true,
  products: { totalCount: 1 },
  approvedFlag: true,
  companyInfo: {
    companyId: '79',
    companyName: 'tester company',
    companyAddress: 'Roundswell Business Park',
    companyCountry: 'United States',
    companyState: 'Devon',
    companyCity: 'city',
    companyZipCode: 'EX31 3TU',
    phoneNumber: '123345',
    bcId: '109',
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

it('shows approved shopping list with "approved" label', async () => {
  const approvedStatusCode = 0;
  const approvedShoppingList = buildShoppingListGraphQLResponseNodeWith({
    status: approvedStatusCode,
  });
  const response = {
    data: {
      shoppingLists: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [
          {
            node: approvedShoppingList,
          },
        ],
      },
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () => HttpResponse.json(response)),
  );

  const superAdminCustomer = buildCustomerWith({
    role: CustomerRole.SUPER_ADMIN,
  });

  const companyStateWithSuperAdminUser = buildCompanyStateWith({
    customer: superAdminCustomer,
    permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingLists />, {
    preloadedState: {
      company: companyStateWithSuperAdminUser,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  expect(screen.getByText(/Approved/));
});

it('shows draft shopping list with "draft" label', async () => {
  const draftStatusCode = 30;
  const draftShoppingList = buildShoppingListGraphQLResponseNodeWith({ status: draftStatusCode });
  const response = {
    data: {
      shoppingLists: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [
          {
            node: draftShoppingList,
          },
        ],
      },
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () => HttpResponse.json(response)),
  );

  const superAdminCustomer = buildCustomerWith({
    role: CustomerRole.SUPER_ADMIN,
  });

  const companyStateWithSuperAdminUser = buildCompanyStateWith({
    customer: superAdminCustomer,
    permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingLists />, {
    preloadedState: {
      company: companyStateWithSuperAdminUser,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  expect(screen.getByText(/Draft/));
});

it('shows ready for approval shopping list with "ready for approval" label', async () => {
  const readyForApprovalStatusCode = 40;
  const readyForApprovalShoppingList = buildShoppingListGraphQLResponseNodeWith({
    status: readyForApprovalStatusCode,
  });
  const response = {
    data: {
      shoppingLists: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [
          {
            node: readyForApprovalShoppingList,
          },
        ],
      },
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () => HttpResponse.json(response)),
  );

  const superAdminCustomer = buildCustomerWith({
    role: CustomerRole.SUPER_ADMIN,
  });

  const companyStateWithSuperAdminUser = buildCompanyStateWith({
    customer: superAdminCustomer,
    permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingLists />, {
    preloadedState: {
      company: companyStateWithSuperAdminUser,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  expect(screen.getByText(/Ready for approval/));
});

it('shows rejected shopping list with "rejected" label', async () => {
  const rejectedStatusCode = 50;
  const rejectedShoppingList = buildShoppingListGraphQLResponseNodeWith({
    status: rejectedStatusCode,
  });
  const response = {
    data: {
      shoppingLists: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [
          {
            node: rejectedShoppingList,
          },
        ],
      },
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () => HttpResponse.json(response)),
  );

  const superAdminCustomer = buildCustomerWith({
    role: CustomerRole.SUPER_ADMIN,
  });

  const companyStateWithSuperAdminUser = buildCompanyStateWith({
    customer: superAdminCustomer,
    permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingLists />, {
    preloadedState: {
      company: companyStateWithSuperAdminUser,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  expect(screen.getByText(/Rejected/));
});

// Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
// For now we treat Deleted as Rejected so that the shopping lists that were previously rejected remain the same behavior
it('shows deleted shopping list with "rejected" label', async () => {
  const deletedStatusCode = 20;
  const deletedShoppingList = buildShoppingListGraphQLResponseNodeWith({
    status: deletedStatusCode,
  });
  const response = {
    data: {
      shoppingLists: {
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [
          {
            node: deletedShoppingList,
          },
        ],
      },
    },
  };

  server.use(
    http.post('https://api-b2b.bigcommerce.com/graphql', async () => HttpResponse.json(response)),
  );

  const superAdminCustomer = buildCustomerWith({
    role: CustomerRole.SUPER_ADMIN,
  });

  const companyStateWithSuperAdminUser = buildCompanyStateWith({
    customer: superAdminCustomer,
    permissions: [{ code: 'approve_draft_shopping_list', permissionLevel: 1 }],
  });

  renderWithProviders(<ShoppingLists />, {
    preloadedState: {
      company: companyStateWithSuperAdminUser,
    },
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  expect(screen.getByText(/Rejected/));
});

describe('when user has "create_shopping_list" permission', () => {
  describe('when user has "submit_shopping_list_for_approval" permission', () => {
    it('hides delete button for shopping lists that are approved or ready for approval', async () => {
      const approvedStatusCode = 0;
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
        companyName: 'tester company',
        companyAddress: 'Roundswell Business Park',
        companyCountry: 'United States',
        companyState: 'Devon',
        companyCity: 'city',
        companyZipCode: 'EX31 3TU',
        phoneNumber: '123345',
        bcId: '109',
      };
      const approvedShoppingList = buildShoppingListGraphQLResponseNodeWith({
        name: 'shopping list 1',
        customerInfo,
        companyInfo: companyInfoInShoppingList,
        status: approvedStatusCode,
      });
      const readyForApprovalShoppingList = buildShoppingListGraphQLResponseNodeWith({
        name: 'shopping list 2',
        customerInfo,
        status: readyForApprovalStatusCode,
      });
      const response = {
        data: {
          shoppingLists: {
            totalCount: 2,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
            edges: [
              {
                node: approvedShoppingList,
              },
              {
                node: readyForApprovalShoppingList,
              },
            ],
          },
        },
      };

      server.use(
        http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
          HttpResponse.json(response),
        ),
      );

      const customer = buildCustomerWith({
        id: 123,
        userType: UserTypes.MULTIPLE_B2C,
      });

      const companyInfo = {
        id: '79',
        companyName: 'b2bc',
        status: CompanyStatus.APPROVED,
      };

      const companyState = buildCompanyStateWith({
        customer,
        companyInfo,
        permissions: [
          { code: 'submit_shopping_list_for_approval', permissionLevel: 1 },
          { code: 'create_shopping_list', permissionLevel: 1 },
        ],
      });

      // It's not ideal that we are mocking the implementation of verifyLevelPermission
      // However since verifyLevelPermission has `store.getState()`, it is not able to load the test store states correctly
      // Until we refactor the verifyLevelPermission to use selector and avoid `store.getState()`, we will have to test it this way
      vi.spyOn(utilsModule, 'verifyLevelPermission').mockImplementation(
        ({ code, companyId, userId }) => {
          if (code === 'create_shopping_list' && companyId === 79 && userId === 123) {
            return true;
          }

          return false;
        },
      );

      renderWithProviders(<ShoppingLists />, {
        preloadedState: {
          company: companyState,
        },
      });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
      expect(screen.getByText('shopping list 1')).toBeInTheDocument();
      expect(screen.getByText('shopping list 2')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('allows b2b users to delete their own rejected shopping list', async () => {
      const rejectedStatusCode = 50;
      const customerInfo = {
        firstName: 'tester',
        lastName: 'tester',
        userId: 123,
        email: 'test@test.com',
        role: '2',
      };
      const companyInfoInShoppingList = {
        companyId: '79',
        companyName: 'tester company',
        companyAddress: 'Roundswell Business Park',
        companyCountry: 'United States',
        companyState: 'Devon',
        companyCity: 'city',
        companyZipCode: 'EX31 3TU',
        phoneNumber: '123345',
        bcId: '109',
      };
      const rejectedShoppingList = buildShoppingListGraphQLResponseNodeWith({
        customerInfo,
        companyInfo: companyInfoInShoppingList,
        status: rejectedStatusCode,
      });
      const response = {
        data: {
          shoppingLists: {
            totalCount: 1,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
            edges: [
              {
                node: rejectedShoppingList,
              },
            ],
          },
        },
      };

      server.use(
        http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
          HttpResponse.json(response),
        ),
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
        permissions: [
          { code: 'submit_shopping_list_for_approval', permissionLevel: 1 },
          { code: 'create_shopping_list', permissionLevel: 1 },
        ],
      });

      // It's not ideal that we are mocking the implementation of verifyLevelPermission
      // However since verifyLevelPermission has `store.getState()`, it is not able to load the test store states correctly
      // Until we refactor the verifyLevelPermission to use selector and avoid `store.getState()`, we will have to test it this way
      vi.spyOn(utilsModule, 'verifyLevelPermission').mockImplementation(
        ({ code, companyId, userId }) => {
          if (code === 'create_shopping_list' && companyId === 79 && userId === 123) {
            return true;
          }

          return false;
        },
      );

      renderWithProviders(<ShoppingLists />, {
        preloadedState: {
          company: companyState,
        },
      });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
    // For now we treat Deleted as Rejected so that the shopping lists that were previously rejected remain the same behavior
    it('allows b2b users to delete their own shopping list in status "Deleted"', async () => {
      const deletedStatusCode = 20;
      const customerInfo = {
        firstName: 'tester',
        lastName: 'tester',
        userId: 123,
        email: 'test@test.com',
        role: '2',
      };
      const companyInfoInShoppingList = {
        companyId: '79',
        companyName: 'tester company',
        companyAddress: 'Roundswell Business Park',
        companyCountry: 'United States',
        companyState: 'Devon',
        companyCity: 'city',
        companyZipCode: 'EX31 3TU',
        phoneNumber: '123345',
        bcId: '109',
      };
      const deletedShoppingList = buildShoppingListGraphQLResponseNodeWith({
        customerInfo,
        companyInfo: companyInfoInShoppingList,
        status: deletedStatusCode,
      });
      const response = {
        data: {
          shoppingLists: {
            totalCount: 1,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
            edges: [
              {
                node: deletedShoppingList,
              },
            ],
          },
        },
      };

      server.use(
        http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
          HttpResponse.json(response),
        ),
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
        permissions: [
          { code: 'submit_shopping_list_for_approval', permissionLevel: 1 },
          { code: 'create_shopping_list', permissionLevel: 1 },
        ],
      });

      // It's not ideal that we are mocking the implementation of verifyLevelPermission
      // However since verifyLevelPermission has `store.getState()`, it is not able to load the test store states correctly
      // Until we refactor the verifyLevelPermission to use selector and avoid `store.getState()`, we will have to test it this way
      vi.spyOn(utilsModule, 'verifyLevelPermission').mockImplementation(
        ({ code, companyId, userId }) => {
          if (code === 'create_shopping_list' && companyId === 79 && userId === 123) {
            return true;
          }

          return false;
        },
      );

      renderWithProviders(<ShoppingLists />, {
        preloadedState: {
          company: companyState,
        },
      });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('when user does not have "submit_shopping_list_for_approval" permission', () => {
    it('shows delete button for shopping lists even if the status is approved or ready for approval', async () => {
      const approvedStatusCode = 0;
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
        companyName: 'tester company',
        companyAddress: 'Roundswell Business Park',
        companyCountry: 'United States',
        companyState: 'Devon',
        companyCity: 'city',
        companyZipCode: 'EX31 3TU',
        phoneNumber: '123345',
        bcId: '109',
      };
      const approvedShoppingList = buildShoppingListGraphQLResponseNodeWith({
        name: 'shopping list 1',
        customerInfo,
        companyInfo: companyInfoInShoppingList,
        status: approvedStatusCode,
      });
      const readyForApprovalShoppingList = buildShoppingListGraphQLResponseNodeWith({
        name: 'shopping list 2',
        customerInfo,
        status: readyForApprovalStatusCode,
      });
      const response = {
        data: {
          shoppingLists: {
            totalCount: 2,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
            edges: [
              {
                node: approvedShoppingList,
              },
              {
                node: readyForApprovalShoppingList,
              },
            ],
          },
        },
      };

      server.use(
        http.post('https://api-b2b.bigcommerce.com/graphql', async () =>
          HttpResponse.json(response),
        ),
      );

      const customer = buildCustomerWith({
        id: 123,
        userType: UserTypes.MULTIPLE_B2C,
      });

      const companyInfo = {
        id: '79',
        companyName: 'b2bc',
        status: CompanyStatus.APPROVED,
      };

      const companyState = buildCompanyStateWith({
        customer,
        companyInfo,
        permissions: [{ code: 'create_shopping_list', permissionLevel: 1 }],
      });

      // It's not ideal that we are mocking the implementation of verifyLevelPermission
      // However since verifyLevelPermission has `store.getState()`, it is not able to load the test store states correctly
      // Until we refactor the verifyLevelPermission to use selector and avoid `store.getState()`, we will have to test it this way
      vi.spyOn(utilsModule, 'verifyLevelPermission').mockImplementation(
        ({ code, companyId, userId }) => {
          if (code === 'create_shopping_list' && companyId === 79 && userId === 123) {
            return true;
          }

          return false;
        },
      );

      renderWithProviders(<ShoppingLists />, {
        preloadedState: {
          company: companyState,
        },
      });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
      expect(screen.getByText('shopping list 1')).toBeInTheDocument();
      expect(screen.getByText('shopping list 2')).toBeInTheDocument();

      const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });

      expect(deleteButtons).toHaveLength(2);
    });
  });
});

describe('when user does not have "create_shopping_list" permission', () => {
  it('hides delete button for shopping lists', async () => {
    const rejectedStatusCode = 50;
    const customerInfo = {
      firstName: 'tester',
      lastName: 'tester',
      userId: 123,
      email: 'test@test.com',
      role: '2',
    };
    const companyInfoInShoppingList = {
      companyId: '79',
      companyName: 'tester company',
      companyAddress: 'Roundswell Business Park',
      companyCountry: 'United States',
      companyState: 'Devon',
      companyCity: 'city',
      companyZipCode: 'EX31 3TU',
      phoneNumber: '123345',
      bcId: '109',
    };
    const rejectedShoppingList = buildShoppingListGraphQLResponseNodeWith({
      customerInfo,
      companyInfo: companyInfoInShoppingList,
      status: rejectedStatusCode,
    });
    const response = {
      data: {
        shoppingLists: {
          totalCount: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          edges: [
            {
              node: rejectedShoppingList,
            },
          ],
        },
      },
    };

    server.use(
      http.post('https://api-b2b.bigcommerce.com/graphql', async () => HttpResponse.json(response)),
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
      permissions: [],
    });

    renderWithProviders(<ShoppingLists />, {
      preloadedState: {
        company: companyState,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});

describe('when user filters shopping lists by status "rejected"', () => {
  // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
  // For now when we filter by "Rejected" we also include "Deleted"
  it('fetches shopping lists with status "Rejected" and "Deleted"', async () => {
    const shoppingList = buildShoppingListGraphQLResponseNodeWith('WHATEVER_VALUES');
    const response = {
      data: {
        shoppingLists: {
          totalCount: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          edges: [
            {
              node: shoppingList,
            },
          ],
        },
      },
    };

    const requestBodies: B2BRequest[] = [];

    const responseHandler = vi.fn(async ({ request }) => {
      const body = await request.json();
      requestBodies.push(body);

      return HttpResponse.json(response);
    });

    server.use(http.post('https://api-b2b.bigcommerce.com/graphql', responseHandler));

    const superAdminCustomer = buildCustomerWith({
      role: CustomerRole.SUPER_ADMIN,
    });

    const companyStateWithSuperAdminUser = buildCompanyStateWith({
      customer: superAdminCustomer,
      permissions: [{ code: 'submit_shopping_list_for_approval', permissionLevel: 1 }],
    });

    renderWithProviders(<ShoppingLists />, {
      preloadedState: {
        company: companyStateWithSuperAdminUser,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    await userEvent.click(await screen.findByRole('button', { name: 'edit' }));

    await userEvent.click(
      screen.getByRole('combobox', {
        name: (_, element) => element.getAttribute('aria-labelledby')?.includes('status') ?? false,
      }),
    );

    await userEvent.click(screen.getByRole('option', { name: /Rejected/i }));
    await userEvent.click(screen.getByRole('button', { name: /Apply/i }));

    const lastRequestBody = requestBodies[requestBodies.length - 1];

    expect(lastRequestBody.query).toContain('status: [20, 50]');
  });
});
