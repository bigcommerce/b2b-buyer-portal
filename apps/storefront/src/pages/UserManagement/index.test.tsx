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
  waitFor,
  within,
} from 'tests/test-utils';

import B3LayoutTip from '@/components/layout/B3LayoutTip';
import { DynamicallyVariableProvider } from '@/shared/dynamicallyVariable';
import { CompanyRolesResponse } from '@/shared/service/b2b/graphql/roleAndPermissions';
import {
  UserEmailCheckResponse,
  UserExtraFieldsInfoResponse,
  UsersResponse,
} from '@/shared/service/b2b/graphql/users';
import { UserTypes } from '@/types';

import UserManagement from './index';

const { server } = startMockServer();

type UserExtraField = UserExtraFieldsInfoResponse['data']['userExtraFields'][number];

const buildUserExtraFieldWith = builder<UserExtraField>(() => ({
  fieldName: faker.lorem.words(3),
  fieldType: faker.number.int(),
  isRequired: faker.datatype.boolean(),
  defaultValue: faker.word.sample(),
  maximumLength: faker.number.int({ min: 1, max: 100 }).toString(),
  numberOfRows: faker.number.int({ min: 1, max: 10 }),
  maximumValue: faker.number.int({ min: 1, max: 100 }).toString(),
  listOfValue: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () =>
    faker.word.sample(),
  ),
  visibleToEnduser: faker.datatype.boolean(),
  labelName: faker.lorem.words(),
}));

const buildUserExtraFieldsResponseWith = builder<UserExtraFieldsInfoResponse>(() => ({
  data: {
    userExtraFields: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () =>
      buildUserExtraFieldWith('WHATEVER_VALUES'),
    ),
  },
}));

type UserEdge = UsersResponse['data']['users']['edges'][number];

const buildUserEdgeWith = builder<UserEdge>(() => ({
  node: {
    id: faker.string.uuid(),
    createdAt: faker.date.past().getTime(),
    updatedAt: faker.date.recent().getTime(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    bcId: faker.number.int(),
    role: faker.number.int({ min: 0, max: 2 }),
    uuid: faker.datatype.boolean() ? faker.string.uuid() : null,
    extraFields: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      fieldName: faker.lorem.words(3),
      fieldValue: faker.word.sample(),
    })),
    companyRoleId: faker.number.int(),
    companyRoleName: faker.lorem.words(2),
    masqueradingCompanyId: faker.datatype.boolean() ? faker.string.uuid() : null,
    companyInfo: {
      companyId: faker.string.uuid(),
      companyName: faker.company.name(),
      companyAddress: faker.location.streetAddress(),
      companyCountry: faker.location.country(),
      companyState: faker.location.state(),
      companyCity: faker.location.city(),
      companyZipCode: faker.location.zipCode(),
      phoneNumber: faker.phone.number(),
      bcId: faker.string.numeric(),
    },
  },
}));

const buildUsersResponseWith = builder<UsersResponse>(() => {
  const edges = Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () =>
    buildUserEdgeWith('WHATEVER_VALUES'),
  );

  return {
    data: {
      users: {
        totalCount: edges.length,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges,
      },
    },
  };
});

type CompanyRoleEdge = CompanyRolesResponse['data']['companyRoles']['edges'][number];

const buildCompanyRoleEdgeWith = builder<CompanyRoleEdge>(() => ({
  node: {
    id: faker.number.int().toString(),
    name: faker.lorem.words(2),
    roleLevel: faker.number.int(),
    roleType: faker.number.int(),
  },
}));

const buildCompanyRolesResponseWith = builder<CompanyRolesResponse>(() => {
  const numberOfEdges = faker.number.int({ min: 0, max: 10 });

  return {
    data: {
      companyRoles: {
        edges: bulk(buildCompanyRoleEdgeWith, 'WHATEVER_VALUES').times(numberOfEdges),
        totalCount: faker.number.int({ min: numberOfEdges }),
        pageInfo: {
          hasNextPage: faker.datatype.boolean(),
          hasPreviousPage: faker.datatype.boolean(),
        },
      },
    },
  };
});

const buildUserEmailCheckResponseWith = builder<UserEmailCheckResponse>(() => ({
  data: {
    userEmailCheck: {
      userType: faker.helpers.enumValue(UserTypes),
      userInfo: {
        id: null,
        email: null,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        role: null,
        companyName: null,
        originChannelId: null,
        forcePasswordReset: null,
      },
    },
  },
}));

const companyWithAllUserPermissions = buildCompanyStateWith({
  companyInfo: { id: '82828' },
  permissions: [
    { code: 'create_user', permissionLevel: 3 },
    { code: 'update_user', permissionLevel: 3 },
    { code: 'delete_user', permissionLevel: 3 },
  ],
  companyHierarchyInfo: { selectCompanyHierarchyId: '776775' },
});

const preloadedState = { company: companyWithAllUserPermissions };

// Unlike most pages, UserManagement mostly uses the exact same components for both desktop and mobile views.
describe.each([
  { name: 'desktop', clientWidth: 1000 },
  { name: 'mobile', clientWidth: 500 },
])('when at $name size', ({ clientWidth }) => {
  beforeEach(() => {
    vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(clientWidth);
  });

  it('displays the "Add new user" button', async () => {
    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetUsers', () => HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    expect(await screen.findByRole('button', { name: 'Add new user' })).toBeInTheDocument();
  });

  it('displays the basic details of each user', async () => {
    const fredSmith = buildUserEdgeWith({
      node: {
        firstName: 'Fred',
        lastName: 'Smith',
        email: 'fred.smith@acme.org',
        companyRoleName: 'Admin',
      },
    });
    const sallyCinnamon = buildUserEdgeWith({
      node: {
        firstName: 'Sally',
        lastName: 'Cinnamon',
        email: 'sally.cinnamon@acme.org',
        companyRoleName: 'Senior Buyer',
      },
    });
    const troyMcClure = buildUserEdgeWith({
      node: {
        firstName: 'Troy',
        lastName: 'McClure',
        email: 'troy.mcclure@acme.org',
        companyRoleName: 'Junior Buyer',
      },
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetUsers', () =>
        HttpResponse.json(
          buildUsersResponseWith({
            data: { users: { edges: [fredSmith, sallyCinnamon, troyMcClure] } },
          }),
        ),
      ),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Fred Smith' })).toBeInTheDocument();
    expect(screen.getByText('fred.smith@acme.org')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Sally Cinnamon' })).toBeInTheDocument();
    expect(screen.getByText('sally.cinnamon@acme.org')).toBeInTheDocument();
    expect(screen.getByText('Senior buyer')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();
    expect(screen.getByText('troy.mcclure@acme.org')).toBeInTheDocument();
    expect(screen.getByText('Junior buyer')).toBeInTheDocument();
  });

  it('does not apply any filters by default', async () => {
    const getUsersVariablesSpy = vi.fn();
    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetUsers', ({ variables }) => {
        getUsersVariablesSpy(variables);

        return HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES'));
      }),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    await waitFor(() =>
      expect(getUsersVariablesSpy).toHaveBeenCalledWith({
        first: 12,
        offset: 0,
        search: '',
        companyId: 82828,
        q: '',
        createdBy: '',
        email: '',
        companyRoleId: undefined,
      }),
    );
  });

  it('displays users with custom roles', async () => {
    const joeSwanson = buildUserEdgeWith({
      node: {
        firstName: 'Joe',
        lastName: 'Swanson',
        companyRoleName: 'Junior Assistant to the Regional Manager',
      },
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetUsers', () =>
        HttpResponse.json(buildUsersResponseWith({ data: { users: { edges: [joeSwanson] } } })),
      ),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Joe Swanson' })).toBeInTheDocument();
    expect(screen.getByText('Junior Assistant to the Regional Manager')).toBeInTheDocument();
  });

  describe('when there is a next page of results, the user click "Go to next page" and the results load successfully', () => {
    it('displays the next page of results', async () => {
      const firstElevenUsers = bulk(buildUserEdgeWith, 'WHATEVER_VALUES').times(11);
      const troyMcClure = buildUserEdgeWith({ node: { firstName: 'Troy', lastName: 'McClure' } });
      const usersPageOne = buildUsersResponseWith({
        data: {
          users: {
            totalCount: 13,
            pageInfo: { hasNextPage: true, hasPreviousPage: false },
            edges: [...firstElevenUsers, troyMcClure],
          },
        },
      });

      const sallyCinnamon = buildUserEdgeWith({
        node: { firstName: 'Sally', lastName: 'Cinnamon' },
      });
      const usersPageTwo = buildUsersResponseWith({
        data: {
          users: {
            totalCount: 13,
            pageInfo: { hasNextPage: false, hasPreviousPage: true },
            edges: [sallyCinnamon],
          },
        },
      });

      const getUsersResponse = vi
        .fn<unknown[], UsersResponse>()
        .mockReturnValue(buildUsersResponseWith(usersPageOne));

      const getUsersVariablesSpy = vi.fn();

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', ({ variables }) => {
          getUsersVariablesSpy(variables);

          return HttpResponse.json(getUsersResponse());
        }),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      const troyMcClureHeading = await screen.findByRole('heading', { name: 'Troy McClure' });

      expect(troyMcClureHeading).toBeInTheDocument();

      getUsersResponse.mockReturnValue(buildUsersResponseWith(usersPageTwo));

      await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

      expect(await screen.findByRole('heading', { name: 'Sally Cinnamon' })).toBeInTheDocument();
      expect(troyMcClureHeading).not.toBeInTheDocument();

      // once queries/mutations are changed to use real graphql variables,
      // we can spy on the request "variables" instead of this hacky string matching
      expect(getUsersVariablesSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 12 }));
    });
  });

  describe('when there is a previous page of results, the user click "Go to previous page" and the results load successfully', () => {
    it('displays the previous page of results', async () => {
      const firstElevenUsers = bulk(buildUserEdgeWith, 'WHATEVER_VALUES').times(11);
      const troyMcClure = buildUserEdgeWith({ node: { firstName: 'Troy', lastName: 'McClure' } });
      const usersPageOne = buildUsersResponseWith({
        data: {
          users: {
            totalCount: 13,
            pageInfo: { hasNextPage: true, hasPreviousPage: false },
            edges: [...firstElevenUsers, troyMcClure],
          },
        },
      });

      const sallyCinnamon = buildUserEdgeWith({
        node: { firstName: 'Sally', lastName: 'Cinnamon' },
      });
      const usersPageTwo = buildUsersResponseWith({
        data: {
          users: {
            totalCount: 13,
            pageInfo: { hasNextPage: false, hasPreviousPage: true },
            edges: [sallyCinnamon],
          },
        },
      });

      const getUsersResponse = vi
        .fn<unknown[], UsersResponse>()
        .mockReturnValue(buildUsersResponseWith(usersPageOne));

      const getUsersVariablesSpy = vi.fn();

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', ({ variables }) => {
          getUsersVariablesSpy(variables);

          return HttpResponse.json(getUsersResponse());
        }),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      getUsersResponse.mockReturnValue(buildUsersResponseWith(usersPageTwo));

      await userEvent.click(await screen.findByRole('button', { name: 'Go to next page' }));

      const sallyCinnamonHeading = await screen.findByRole('heading', { name: 'Sally Cinnamon' });

      expect(sallyCinnamonHeading).toBeInTheDocument();

      getUsersResponse.mockReturnValue(buildUsersResponseWith(usersPageOne));

      await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();
      expect(sallyCinnamonHeading).not.toBeInTheDocument();

      // once queries/mutations are changed to use real graphql variables,
      // we can spy on the request "variables" instead of this hacky string matching
      expect(getUsersVariablesSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });
  });

  describe('when the user clicks on the "edit" button for a user', () => {
    it('opens the "Edit User" modal', async () => {
      const troyMcClure = buildUserEdgeWith({
        node: {
          firstName: 'Troy',
          lastName: 'McClure',
          email: 'troy.mcclure@acme.org',
          companyRoleName: 'Junior Buyer',
          phone: '04747665241',
        },
      });

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } })),
        ),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

      // the 0th edit button is the search filter button
      await userEvent.click(screen.getAllByRole('button', { name: 'edit' })[1]);

      const modal = await screen.findByRole('dialog');

      expect(within(modal).getByRole('heading', { name: 'Edit user' })).toBeInTheDocument();

      expect(within(modal).getByRole('combobox', { name: 'User role' })).toHaveValue(
        'Junior Buyer',
      );

      const emailField = within(modal).getByRole('textbox', { name: 'Email' });
      expect(emailField).toHaveValue('troy.mcclure@acme.org');
      expect(emailField).toBeDisabled();

      expect(within(modal).getByRole('textbox', { name: 'First name' })).toHaveValue('Troy');
      expect(within(modal).getByRole('textbox', { name: 'Last name' })).toHaveValue('McClure');
      expect(within(modal).getByRole('textbox', { name: 'Phone number' })).toHaveValue(
        '04747665241',
      );
    });
  });

  describe('when a user is updated, the user clicks "save user" and the save succeeds', () => {
    it('closes the "Edit User" modal and displays a success message', async () => {
      const troyMcClure = buildUserEdgeWith({
        node: {
          id: '667668',
          firstName: 'Troy',
          lastName: 'McClure',
        },
      });
      const garyMcClure = buildUserEdgeWith({ node: { ...troyMcClure.node, firstName: 'Gary' } });

      const getUsersResponse = vi
        .fn<unknown[], UsersResponse>()
        .mockReturnValue(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } }));

      const updateUserQuerySpy = vi.fn();

      server.use(
        graphql.mutation('UpdateUser', ({ query }) => {
          updateUserQuerySpy(query);

          return HttpResponse.json({ data: { userUpdate: { user: { id: '667668', bcId: 12 } } } });
        }),
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith({ data: { userExtraFields: [] } })),
        ),
        graphql.query('GetUsers', () => HttpResponse.json(getUsersResponse())),
      );

      renderWithProviders(
        // This can be rolled into "renderWithProviders" once
        // we fix ShoppingListDetails/index.test.tsx
        <DynamicallyVariableProvider>
          <B3LayoutTip />
          <UserManagement />
        </DynamicallyVariableProvider>,
        { preloadedState },
      );

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

      // the 0th edit button is the search filter button
      await userEvent.click(screen.getAllByRole('button', { name: 'edit' })[1]);

      const modal = await screen.findByRole('dialog');

      const firstNameField = within(modal).getByRole('textbox', { name: 'First name' });

      await userEvent.clear(firstNameField);
      await userEvent.type(firstNameField, 'Gary');

      getUsersResponse.mockReturnValue(
        buildUsersResponseWith({ data: { users: { edges: [garyMcClure] } } }),
      );

      await userEvent.click(within(modal).getByRole('button', { name: 'Save user' }));

      await waitFor(() => expect(modal).not.toBeInTheDocument());

      const alert = await screen.findByRole('alert');

      expect(within(alert).getByText('update user successfully')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Troy McClure' })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Gary McClure' })).toBeInTheDocument();

      // once queries/mutations are changed to use real graphql variables,
      // we can spy on the request "variables" instead of this hacky string matching
      expect(updateUserQuerySpy).toHaveBeenCalledWith(expect.stringContaining('firstName: "Gary"'));
    });
  });

  describe('when the "Edit User" modal is open and the user clicks "cancel"', () => {
    it('closes the "Edit User" modal', async () => {
      const troyMcClure = buildUserEdgeWith({ node: { firstName: 'Troy', lastName: 'McClure' } });

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } })),
        ),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

      // the 0th edit button is the search filter button
      await userEvent.click(screen.getAllByRole('button', { name: 'edit' })[1]);

      const modal = await screen.findByRole('dialog');

      await userEvent.click(within(modal).getByRole('button', { name: 'cancel' }));

      await waitFor(() => expect(modal).not.toBeInTheDocument());
    });
  });

  describe('when the user clicks on the "delete" button for a user', () => {
    it('opens the "Delete User" modal', async () => {
      const troyMcClure = buildUserEdgeWith({ node: { firstName: 'Troy', lastName: 'McClure' } });

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } })),
        ),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'delete' }));

      const modal = await screen.findByRole('dialog');

      expect(within(modal).getByRole('heading', { name: 'Delete user' })).toBeInTheDocument();
      expect(
        within(modal).getByText('Are you sure you want to delete this user?'),
      ).toBeInTheDocument();
    });
  });

  describe('when the "Delete User" modal is open and the user clicks "cancel"', () => {
    it('closes the "Delete User" modal', async () => {
      const troyMcClure = buildUserEdgeWith({ node: { firstName: 'Troy', lastName: 'McClure' } });

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } })),
        ),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'delete' }));

      const modal = await screen.findByRole('dialog');

      await userEvent.click(within(modal).getByRole('button', { name: 'cancel' }));

      await waitFor(() => expect(modal).not.toBeInTheDocument());
    });
  });

  describe('when the user confirms the deletion of a user and the delete succeeds', () => {
    it('closes the "Delete User" modal and no longer displays the deleted user', async () => {
      const troyMcClure = buildUserEdgeWith({
        node: { id: '993994', firstName: 'Troy', lastName: 'McClure' },
      });

      const getUsersResponse = vi
        .fn<unknown[], UsersResponse>()
        .mockReturnValue(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } }));

      const deleteUserQuerySpy = vi.fn();

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () => HttpResponse.json(getUsersResponse())),
        graphql.mutation('DeleteUser', ({ query }) => {
          deleteUserQuerySpy(query);

          return HttpResponse.json({ data: { userDelete: { message: 'Success' } } });
        }),
      );

      renderWithProviders(
        // This can be rolled into "renderWithProviders" once
        // we fix ShoppingListDetails/index.test.tsx
        <DynamicallyVariableProvider>
          <B3LayoutTip />
          <UserManagement />
        </DynamicallyVariableProvider>,
        { preloadedState },
      );

      expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'delete' }));

      const modal = await screen.findByRole('dialog');

      getUsersResponse.mockReturnValue(buildUsersResponseWith({ data: { users: { edges: [] } } }));

      await userEvent.click(within(modal).getByRole('button', { name: 'delete' }));

      await waitFor(() => expect(modal).not.toBeInTheDocument());

      const alert = await screen.findByRole('alert');

      expect(within(alert).getByText('User deleted successfully')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Troy McClure' })).not.toBeInTheDocument();

      // once queries/mutations are changed to use real graphql variables,
      // we can spy on the request "variables" instead of this hacky string matching
      expect(deleteUserQuerySpy).toHaveBeenCalledWith(expect.stringContaining('userId: 993994'));
      expect(deleteUserQuerySpy).toHaveBeenCalledWith(expect.stringContaining('companyId: 776775'));
    });
  });

  describe('when the user clicks "Add new user"', () => {
    it('displays the "Add new user" modal with all fields empty', async () => {
      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

      const modal = await screen.findByRole('dialog');

      expect(within(modal).getByRole('heading', { name: 'Add new user' })).toBeInTheDocument();

      expect(within(modal).getByRole('combobox', { name: 'User role' })).toHaveValue('');

      const emailField = within(modal).getByRole('textbox', { name: 'Email' });
      expect(emailField).toHaveValue('');
      expect(emailField).not.toBeDisabled();

      expect(within(modal).getByRole('textbox', { name: 'First name' })).toHaveValue('');
      expect(within(modal).getByRole('textbox', { name: 'Last name' })).toHaveValue('');
      expect(within(modal).getByRole('textbox', { name: 'Phone number' })).toHaveValue('');
    });
  });

  describe('when a user is added, the user clicks "save user" and the save succeeds', () => {
    it('closes the "Add new user" modal and displays a success message', async () => {
      const adminRole = buildCompanyRoleEdgeWith({ node: { name: 'Admin', id: '9979' } });

      const createUserQuerySpy = vi.fn();

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith({ data: { userExtraFields: [] } })),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('CompanyRoles', () =>
          HttpResponse.json(
            buildCompanyRolesResponseWith({ data: { companyRoles: { edges: [adminRole] } } }),
          ),
        ),
        graphql.query('UserEmailCheck', () =>
          HttpResponse.json(
            buildUserEmailCheckResponseWith({
              data: { userEmailCheck: { userType: UserTypes.DOES_NOT_EXIST } },
            }),
          ),
        ),
        graphql.mutation('CreateUser', ({ query }) => {
          createUserQuerySpy(query);

          return HttpResponse.json({
            data: { userCreate: { user: { id: '11028125', bcId: 13 } } },
          });
        }),
      );

      renderWithProviders(
        // This can be rolled into "renderWithProviders" once
        // we fix ShoppingListDetails/index.test.tsx
        <DynamicallyVariableProvider>
          <B3LayoutTip />
          <UserManagement />
        </DynamicallyVariableProvider>,
        { preloadedState },
      );

      await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

      const modal = await screen.findByRole('dialog');

      await userEvent.click(within(modal).getByRole('combobox', { name: 'User role' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Admin' }));
      await userEvent.type(within(modal).getByRole('textbox', { name: 'First name' }), 'Gary');
      await userEvent.type(within(modal).getByRole('textbox', { name: 'Last name' }), 'McClure');
      await userEvent.type(
        within(modal).getByRole('textbox', { name: 'Email' }),
        'gary.mcclure@acme.com',
      );
      await userEvent.type(
        within(modal).getByRole('textbox', { name: 'Phone number' }),
        '04747665241',
      );

      await userEvent.click(within(modal).getByRole('button', { name: 'Save user' }));

      await waitFor(() => expect(modal).not.toBeInTheDocument());

      const alert = await screen.findByRole('alert');

      expect(within(alert).getByText('User added successfully')).toBeInTheDocument();

      // once queries/mutations are changed to use real graphql variables,
      // we can spy on the request "variables" instead of this hacky string matching
      expect(createUserQuerySpy).toHaveBeenCalledWith(expect.stringContaining('companyId: 776775'));
      expect(createUserQuerySpy).toHaveBeenCalledWith(expect.stringContaining('firstName: "Gary"'));
      expect(createUserQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('lastName: "McClure"'),
      );
      expect(createUserQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('email: "gary.mcclure@acme.com"'),
      );
      expect(createUserQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('phone: "04747665241"'),
      );
      expect(createUserQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('companyRoleId: 9979'),
      );
    });
  });

  describe('when a user is added, the user clicks "save user", but the email address is already taken', () => {
    it('displays an error explaining that the email is taken', async () => {
      const adminRole = buildCompanyRoleEdgeWith({ node: { name: 'Admin' } });
      const userTakenResponse = buildUserEmailCheckResponseWith({
        data: { userEmailCheck: { userType: UserTypes.CURRENT_B2B_COMPANY } },
      });

      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES')),
        ),
        graphql.query('CompanyRoles', () =>
          HttpResponse.json(
            buildCompanyRolesResponseWith({ data: { companyRoles: { edges: [adminRole] } } }),
          ),
        ),
        graphql.query('UserEmailCheck', () => HttpResponse.json(userTakenResponse)),
      );

      renderWithProviders(
        // This can be rolled into "renderWithProviders" once
        // we fix ShoppingListDetails/index.test.tsx
        <DynamicallyVariableProvider>
          <B3LayoutTip />
          <UserManagement />
        </DynamicallyVariableProvider>,
        { preloadedState },
      );

      await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

      const modal = await screen.findByRole('dialog');

      await userEvent.click(within(modal).getByRole('combobox', { name: 'User role' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Admin' }));
      await userEvent.type(within(modal).getByRole('textbox', { name: 'First name' }), 'Gary');
      await userEvent.type(within(modal).getByRole('textbox', { name: 'Last name' }), 'McClure');
      await userEvent.type(
        within(modal).getByRole('textbox', { name: 'Email' }),
        'gary.mcclure@acme.com',
      );
      await userEvent.type(
        within(modal).getByRole('textbox', { name: 'Phone number' }),
        '04747665241',
      );

      await userEvent.click(within(modal).getByRole('button', { name: 'Save user' }));

      expect(
        await within(modal).findByText('This user already exists in this company.'),
      ).toBeInTheDocument();
    });
  });

  describe('when the "Add new user" modal is open and the user clicks "Cancel"', () => {
    it('does not display the "Add new user" modal', async () => {
      server.use(
        graphql.query('GetUserExtraFields', () =>
          HttpResponse.json(buildUserExtraFieldsResponseWith({ data: { userExtraFields: [] } })),
        ),
        graphql.query('GetUsers', () =>
          HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES')),
        ),
      );

      renderWithProviders(<UserManagement />, { preloadedState });

      await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

      const modal = await screen.findByRole('dialog');

      expect(within(modal).getByRole('heading', { name: 'Add new user' })).toBeInTheDocument();

      await userEvent.click(within(modal).getByRole('button', { name: 'cancel' }));

      await waitFor(() => expect(modal).not.toBeInTheDocument());
    });
  });
});

describe('when the "Add new user" modal is open', () => {
  it('displays custom text fields', async () => {
    const customTextField = buildUserExtraFieldWith({
      fieldName: 'Custom text field',
      labelName: 'Custom text field',
      fieldType: 0,
      defaultValue: 'Some short amount of text',
      visibleToEnduser: true,
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(
          buildUserExtraFieldsResponseWith({ data: { userExtraFields: [customTextField] } }),
        ),
      ),
      graphql.query('GetUsers', () => HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

    const modal = await screen.findByRole('dialog');

    // regex used to be agnostic of required/optional, required adds a " *"
    expect(within(modal).getByRole('textbox', { name: /Custom text field/ })).toHaveValue(
      'Some short amount of text',
    );
  });

  it('displays custom dropdown fields', async () => {
    const customSelectField = buildUserExtraFieldWith({
      fieldName: 'Custom dropdown field',
      labelName: 'Custom dropdown field',
      fieldType: 3,
      defaultValue: 'Option B',
      listOfValue: ['Option A', 'Option B', 'Option C'],
      visibleToEnduser: true,
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(
          buildUserExtraFieldsResponseWith({ data: { userExtraFields: [customSelectField] } }),
        ),
      ),
      graphql.query('GetUsers', () => HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

    const modal = await screen.findByRole('dialog');

    // resorting to getByText as our crude, custom comboboxes are not working with getByRole
    expect(within(modal).getByText(/Custom dropdown field/)).toBeInTheDocument();
    expect(within(modal).getByText('Option B')).toBeInTheDocument();
  });

  it('displays custom number fields', async () => {
    const customNumberField = buildUserExtraFieldWith({
      fieldName: 'Custom number field',
      labelName: 'Custom number field',
      fieldType: 2,
      defaultValue: '333',
      visibleToEnduser: true,
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(
          buildUserExtraFieldsResponseWith({ data: { userExtraFields: [customNumberField] } }),
        ),
      ),
      graphql.query('GetUsers', () => HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

    const modal = await screen.findByRole('dialog');

    expect(within(modal).getByRole('spinbutton', { name: /Custom number field/ })).toHaveValue(333);
  });

  it('displays custom multiline fields', async () => {
    const customMultilineField = buildUserExtraFieldWith({
      fieldName: 'Custom multiline field',
      labelName: 'Custom multiline field',
      fieldType: 1,
      numberOfRows: 5,
      defaultValue: 'Multiline\nworks just fine',
      visibleToEnduser: true,
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(
          buildUserExtraFieldsResponseWith({ data: { userExtraFields: [customMultilineField] } }),
        ),
      ),
      graphql.query('GetUsers', () => HttpResponse.json(buildUsersResponseWith('WHATEVER_VALUES'))),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    await userEvent.click(await screen.findByRole('button', { name: 'Add new user' }));

    const modal = await screen.findByRole('dialog');

    const customMultilineFieldLabel = within(modal).getByRole('textbox', {
      name: /Custom multiline field/,
    });
    expect(customMultilineFieldLabel).toHaveValue('Multiline\nworks just fine');
    expect(customMultilineFieldLabel).toHaveAttribute('rows', '5');
  });
});

describe('when the "Edit user" modal is open and the user has a custom field value', () => {
  it("displays the value from the user and not the custom field's defaults", async () => {
    const customTextField = buildUserExtraFieldWith({
      fieldName: 'Custom text field',
      labelName: 'Custom text field',
      fieldType: 0,
      defaultValue: 'Some short amount of text',
      visibleToEnduser: true,
    });

    const troyMcClure = buildUserEdgeWith({
      node: {
        firstName: 'Troy',
        lastName: 'McClure',
        extraFields: [{ fieldName: customTextField.fieldName, fieldValue: 'Troy says hello' }],
      },
    });

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(
          buildUserExtraFieldsResponseWith({ data: { userExtraFields: [customTextField] } }),
        ),
      ),
      graphql.query('GetUsers', () =>
        HttpResponse.json(buildUsersResponseWith({ data: { users: { edges: [troyMcClure] } } })),
      ),
    );

    renderWithProviders(<UserManagement />, { preloadedState });

    expect(await screen.findByRole('heading', { name: 'Troy McClure' })).toBeInTheDocument();

    // the 0th edit button is the search filter button
    await userEvent.click(screen.getAllByRole('button', { name: 'edit' })[1]);

    const modal = await screen.findByRole('dialog');

    // regex used to be agnostic of required/optional, required adds a " *"
    const customTextFieldLabel = within(modal).getByRole('textbox', {
      name: /Custom text field/,
    });
    expect(customTextFieldLabel).toHaveValue('Troy says hello');
    expect(customTextFieldLabel).not.toHaveValue('Some short amount of text');
  });
});
