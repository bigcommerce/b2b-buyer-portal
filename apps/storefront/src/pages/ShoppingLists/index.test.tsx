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
  userEvent,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';
import { when } from 'vitest-when';

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
const buildB2BShoppingListNodeWith = builder(() => ({
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

const buildB2BShoppingListResponseWith = builder(() => {
  const numberOfShoppingLists = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      shoppingLists: {
        totalCount: faker.number.int({ min: numberOfShoppingLists, max: 100 }),
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildB2BShoppingListNodeWith, 'WHATEVER_VALUES').times(numberOfShoppingLists),
      },
    },
  };
});

const buildB2CShoppingListEdgeWith = builder(() => ({
  node: {
    id: faker.number.int().toString(),
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    updatedAt: faker.date.past(),
    products: {
      totalCount: faker.number.int(),
    },
  },
}));

const buildB2CShoppingListResponseWith = builder(() => {
  const numberOfShoppingLists = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      customerShoppingLists: {
        totalCount: faker.number.int({ min: numberOfShoppingLists }),
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
        edges: bulk(buildB2CShoppingListEdgeWith, 'WHATEVER_VALUES').times(numberOfShoppingLists),
      },
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('shows approved shopping list with "approved" label', async () => {
  const approvedStatusCode = 0;
  const approvedShoppingList = buildB2BShoppingListNodeWith({
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
  const draftShoppingList = buildB2BShoppingListNodeWith({ status: draftStatusCode });
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
  const readyForApprovalShoppingList = buildB2BShoppingListNodeWith({
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
  const rejectedShoppingList = buildB2BShoppingListNodeWith({
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
  const deletedShoppingList = buildB2BShoppingListNodeWith({
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
      const approvedShoppingList = buildB2BShoppingListNodeWith({
        name: 'shopping list 1',
        customerInfo,
        companyInfo: companyInfoInShoppingList,
        status: approvedStatusCode,
      });
      const readyForApprovalShoppingList = buildB2BShoppingListNodeWith({
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
      const rejectedShoppingList = buildB2BShoppingListNodeWith({
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
      const deletedShoppingList = buildB2BShoppingListNodeWith({
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
      const approvedShoppingList = buildB2BShoppingListNodeWith({
        name: 'shopping list 1',
        customerInfo,
        companyInfo: companyInfoInShoppingList,
        status: approvedStatusCode,
      });
      const readyForApprovalShoppingList = buildB2BShoppingListNodeWith({
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
    const rejectedShoppingList = buildB2BShoppingListNodeWith({
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
    const getB2BCustomerShoppingLists = vi
      .fn()
      .mockReturnValue(buildB2BShoppingListResponseWith('WHATEVER_VALUES'));

    server.use(
      graphql.query('B2BCustomerShoppingLists', ({ query }) =>
        HttpResponse.json(getB2BCustomerShoppingLists(query)),
      ),
      graphql.query('GetShoppingListsCreatedByUser', () =>
        HttpResponse.json({ data: { createdByUser: { results: [] } } }),
      ),
    );

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

    const filterModal = await screen.findByRole('dialog');

    // Status select cannot be found via the label
    // the first select is for "Created By"
    await userEvent.click(within(filterModal).getAllByRole('combobox')[1]);

    await userEvent.click(screen.getByRole('option', { name: /Rejected/i }));
    await userEvent.click(screen.getByRole('button', { name: /Apply/i }));

    expect(getB2BCustomerShoppingLists).toHaveBeenCalledWith(
      expect.stringContaining('status: [20, 50]'),
    );
  });
});

describe('when the user is a B2B customer', () => {
  const approvedB2BCompany = buildCompanyStateWith({
    permissions: [
      { code: 'delete_shopping_list_item', permissionLevel: 1 },
      { code: 'create_shopping_list', permissionLevel: 1 },
      { code: 'update_shopping_list_item', permissionLevel: 1 },
    ],
    companyInfo: { status: CompanyStatus.APPROVED },
    customer: { userType: UserTypes.MULTIPLE_B2C, firstName: 'John', lastName: 'Doe' },
  });

  const preloadedState = { company: approvedB2BCompany };

  describe('when deleting a shopping list succeeds', () => {
    it('displays a success message and displays the shopping lists', async () => {
      const deleteShoppingList = vi.fn();
      const getB2BCustomerShoppingLists = vi.fn();

      const outdatedList = buildB2BShoppingListNodeWith({
        name: 'My outdated shopping list',
        id: '123',
        status: 50,
      });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [outdatedList] } } }),
      );

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(getB2BCustomerShoppingLists()),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json({ data: { createdByUser: { results: [] } } }),
        ),
        graphql.mutation('DeleteShoppingList', ({ variables }) =>
          HttpResponse.json(deleteShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: 'delete' }));

      const confirmDeleteModal = await screen.findByRole('dialog');

      when(deleteShoppingList)
        .calledWith({ id: 123 })
        .thenReturn({ data: { shoppingListsDelete: { message: 'Success' } } });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [] } } }),
      );

      await userEvent.click(within(confirmDeleteModal).getByRole('button', { name: 'Delete' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully deleted'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'My outdated shopping list' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('when creating a shopping list succeeds', () => {
    it('displays a success message and displays the new shopping list in the results', async () => {
      const createShoppingList = vi.fn();
      const getB2BCustomerShoppingLists = vi.fn();

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [] } } }),
      );

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(getB2BCustomerShoppingLists()),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json({ data: { createdByUser: { results: [] } } }),
        ),
        graphql.mutation('CreateShoppingList', ({ variables }) =>
          HttpResponse.json(createShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: /Create New/i }));

      const createNewModal = await screen.findByRole('dialog');

      await userEvent.type(
        within(createNewModal).getByRole('textbox', { name: 'Name' }),
        'My new shopping list',
      );

      await userEvent.type(
        within(createNewModal).getByRole('textbox', { name: 'Description' }),
        'Lots of good stuff in here',
      );

      const newList = buildB2BShoppingListNodeWith({
        name: 'My new shopping list',
        description: 'Lots of good stuff in here',
        id: '123',
      });

      when(createShoppingList)
        .calledWith({
          shoppingListData: {
            description: 'Lots of good stuff in here',
            name: 'My new shopping list',
            status: 0,
          },
        })
        .thenReturn({ data: { shoppingListsCreate: { shoppingList: newList } } });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [newList] } } }),
      );

      await userEvent.click(within(createNewModal).getByRole('button', { name: 'Save' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully added'),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'My new shopping list' }),
      ).toBeInTheDocument();
    });
  });

  describe('when duplicating a shopping list succeeds', () => {
    it('displays a success message and displays the new shopping list in the results', async () => {
      const duplicateShoppingList = vi.fn();
      const getB2BCustomerShoppingLists = vi.fn();

      const originalList = buildB2BShoppingListNodeWith({
        name: 'My original shopping list',
        description: 'Lots of good stuff in here',
        id: '123',
      });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [originalList] } } }),
      );

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(getB2BCustomerShoppingLists()),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json({ data: { createdByUser: { results: [] } } }),
        ),
        graphql.mutation('DuplicateB2BShoppingList', ({ variables }) =>
          HttpResponse.json(duplicateShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: /duplicate/i }));

      const createNewModal = await screen.findByRole('dialog');

      const nameField = within(createNewModal).getByRole('textbox', { name: 'Name' });
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'My copied shopping list');

      const descriptionField = within(createNewModal).getByRole('textbox', { name: 'Description' });
      await userEvent.clear(descriptionField);
      await userEvent.type(descriptionField, 'Even more good stuff in here');

      const duplicateList = buildB2BShoppingListNodeWith({
        name: 'My copied shopping list',
        description: 'Even more good stuff in here',
        id: '456',
      });

      when(duplicateShoppingList)
        .calledWith({
          sampleShoppingListId: 123,
          shoppingListData: {
            description: 'Even more good stuff in here',
            name: 'My copied shopping list',
          },
        })
        .thenReturn({
          data: { shoppingListsDuplicate: { shoppingList: duplicateList } },
        });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({
          data: { shoppingLists: { edges: [originalList, duplicateList] } },
        }),
      );

      await userEvent.click(within(createNewModal).getByRole('button', { name: 'Save' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully duplicated'),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'My copied shopping list' }),
      ).toBeInTheDocument();
    });
  });

  describe('when updating a shopping list succeeds', () => {
    it('displays a success message and displays the updated shopping list in the results', async () => {
      const updateB2BShoppingListDetails = vi.fn();
      const getB2BCustomerShoppingLists = vi.fn();

      const originalList = buildB2BShoppingListNodeWith({
        name: 'My original shopping list',
        description: 'Lots of good stuff in here',
        id: '123',
      });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [originalList] } } }),
      );

      server.use(
        graphql.query('B2BCustomerShoppingLists', () =>
          HttpResponse.json(getB2BCustomerShoppingLists()),
        ),
        graphql.query('GetShoppingListsCreatedByUser', () =>
          HttpResponse.json({ data: { createdByUser: { results: [] } } }),
        ),
        graphql.mutation('UpdateB2BShoppingList', ({ variables }) =>
          HttpResponse.json(updateB2BShoppingListDetails(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      const editButtons = await screen.findAllByRole('button', { name: /edit/i });

      // editButtons[0] is the search filter button :/
      await userEvent.click(editButtons[1]);

      const createNewModal = await screen.findByRole('dialog');

      const nameField = within(createNewModal).getByRole('textbox', { name: 'Name' });
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'My updated shopping list');

      const descriptionField = within(createNewModal).getByRole('textbox', { name: 'Description' });
      await userEvent.clear(descriptionField);
      await userEvent.type(descriptionField, 'Needs more good stuff in here');

      const updatedList = buildB2BShoppingListNodeWith({
        ...originalList,
        name: 'My updated shopping list',
        description: 'Needs more good stuff in here',
      });

      when(updateB2BShoppingListDetails)
        .calledWith({
          id: 123,
          shoppingListData: {
            name: 'My updated shopping list',
            description: 'Needs more good stuff in here',
            status: originalList.status,
          },
        })
        .thenReturn({
          data: { shoppingListsUpdate: { shoppingList: updatedList } },
        });

      getB2BCustomerShoppingLists.mockReturnValueOnce(
        buildB2BShoppingListResponseWith({ data: { shoppingLists: { edges: [updatedList] } } }),
      );

      await userEvent.click(within(createNewModal).getByRole('button', { name: 'Save' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully updated'),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'My updated shopping list' }),
      ).toBeInTheDocument();
    });
  });
});

describe('when the user is a B2C customer', () => {
  const nonCompany = buildCompanyStateWith({ customer: { b2bId: undefined } });
  const preloadedState = { company: nonCompany };

  describe('when deleting a shopping list succeeds', () => {
    it('displays a success message and displays the shopping lists', async () => {
      const deleteShoppingList = vi.fn();
      const getB2CCustomerShoppingLists = vi.fn();

      const outdatedList = buildB2CShoppingListEdgeWith({
        node: { id: '123', name: 'My outdated shopping list' },
      });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({
          data: { customerShoppingLists: { edges: [outdatedList] } },
        }),
      );

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(getB2CCustomerShoppingLists()),
        ),
        graphql.mutation('DeleteCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(deleteShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: 'delete' }));

      const confirmDeleteModal = await screen.findByRole('dialog');

      when(deleteShoppingList)
        .calledWith({ id: 123 })
        .thenReturn({ data: { customerShoppingListsDelete: { message: 'Success' } } });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({ data: { customerShoppingLists: { edges: [] } } }),
      );

      await userEvent.click(within(confirmDeleteModal).getByRole('button', { name: 'Delete' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully deleted'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'My outdated shopping list' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('when creating a shopping list succeeds', () => {
    it('displays a success message and displays the new shopping list in the results', async () => {
      const createShoppingList = vi.fn();
      const getB2CCustomerShoppingLists = vi.fn();

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({
          data: { customerShoppingLists: { edges: [] } },
        }),
      );

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(getB2CCustomerShoppingLists()),
        ),
        graphql.mutation('CreateCustomerShoppingList', ({ variables }) =>
          HttpResponse.json(createShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: /Create New/i }));

      const createNewModal = await screen.findByRole('dialog');

      await userEvent.type(
        within(createNewModal).getByRole('textbox', { name: 'Name' }),
        'My new shopping list',
      );

      await userEvent.type(
        within(createNewModal).getByRole('textbox', { name: 'Description' }),
        'Lots of good stuff in here',
      );

      const newList = buildB2CShoppingListEdgeWith({
        node: {
          name: 'My new shopping list',
          description: 'Lots of good stuff in here',
          id: '123',
        },
      });

      when(createShoppingList)
        .calledWith({
          shoppingListData: {
            channelId: 1,
            name: 'My new shopping list',
            description: 'Lots of good stuff in here',
          },
        })
        .thenReturn({ data: { shoppingList: { shoppingList: { id: '123' } } } });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({ data: { customerShoppingLists: { edges: [newList] } } }),
      );

      await userEvent.click(within(createNewModal).getByRole('button', { name: 'Save' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully added'),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'My new shopping list' }),
      ).toBeInTheDocument();
    });
  });

  describe('when duplicating a shopping list succeeds', () => {
    it('displays a success message and displays the new shopping list in the results', async () => {
      const duplicateShoppingList = vi.fn();
      const getB2CCustomerShoppingLists = vi.fn();

      const originalList = buildB2CShoppingListEdgeWith({
        node: {
          name: 'My original shopping list',
          description: 'Lots of good stuff in here',
          id: '123',
        },
      });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({
          data: { customerShoppingLists: { edges: [originalList] } },
        }),
      );

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(getB2CCustomerShoppingLists()),
        ),
        graphql.mutation('DuplicateB2CShoppingList', ({ variables }) =>
          HttpResponse.json(duplicateShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: /duplicate/i }));

      const createNewModal = await screen.findByRole('dialog');

      const nameField = within(createNewModal).getByRole('textbox', { name: 'Name' });
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'My copied shopping list');

      const descriptionField = within(createNewModal).getByRole('textbox', { name: 'Description' });
      await userEvent.clear(descriptionField);
      await userEvent.type(descriptionField, 'Even more good stuff in here');

      const duplicateList = buildB2CShoppingListEdgeWith({
        node: {
          name: 'My copied shopping list',
          description: 'Even more good stuff in here',
          id: '456',
        },
      });

      when(duplicateShoppingList)
        .calledWith({
          sampleShoppingListId: 123,
          shoppingListData: {
            description: 'Even more good stuff in here',
            name: 'My copied shopping list',
          },
        })
        .thenReturn({
          data: { shoppingListsDuplicate: { shoppingList: duplicateList } },
        });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({
          data: { customerShoppingLists: { edges: [originalList, duplicateList] } },
        }),
      );

      await userEvent.click(within(createNewModal).getByRole('button', { name: 'Save' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully duplicated'),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'My copied shopping list' }),
      ).toBeInTheDocument();
    });
  });

  describe('when updating a shopping list succeeds', () => {
    it('displays a success message and displays the updated shopping list in the results', async () => {
      const updateShoppingList = vi.fn();
      const getB2CCustomerShoppingLists = vi.fn();

      const originalList = buildB2CShoppingListEdgeWith({
        node: {
          name: 'My original shopping list',
          description: 'Lots of good stuff in here',
          id: '123',
        },
      });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({
          data: { customerShoppingLists: { edges: [originalList] } },
        }),
      );

      server.use(
        graphql.query('CustomerShoppingLists', () =>
          HttpResponse.json(getB2CCustomerShoppingLists()),
        ),
        graphql.mutation('UpdateB2CShoppingList', ({ variables }) =>
          HttpResponse.json(updateShoppingList(variables)),
        ),
      );

      renderWithProviders(<ShoppingLists />, { preloadedState });

      await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));

      const createNewModal = await screen.findByRole('dialog');

      const nameField = within(createNewModal).getByRole('textbox', { name: 'Name' });
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'My much improved shopping list');

      const descriptionField = within(createNewModal).getByRole('textbox', { name: 'Description' });
      await userEvent.clear(descriptionField);
      await userEvent.type(descriptionField, 'Even more good stuff in here');

      const updatedList = buildB2CShoppingListEdgeWith({
        node: {
          name: 'My much improved shopping list',
          description: 'Even more good stuff in here',
          id: originalList.node.id,
        },
      });

      when(updateShoppingList)
        .calledWith({
          id: 123,
          shoppingListData: {
            channelId: 1,
            description: 'Even more good stuff in here',
            name: 'My much improved shopping list',
          },
        })
        .thenReturn({
          data: { shoppingList: updatedList },
        });

      getB2CCustomerShoppingLists.mockReturnValueOnce(
        buildB2CShoppingListResponseWith({
          data: { customerShoppingLists: { edges: [updatedList] } },
        }),
      );

      await userEvent.click(within(createNewModal).getByRole('button', { name: 'Save' }));

      const alert = await screen.findByRole('alert');

      expect(
        within(alert).getByText('The shopping list was successfully updated'),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'My much improved shopping list' }),
      ).toBeInTheDocument();
    });
  });
});
