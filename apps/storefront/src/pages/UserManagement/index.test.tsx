import { graphql, HttpResponse } from 'msw';
import {
  buildCompanyStateWith,
  builder,
  bulk,
  faker,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitFor,
  within,
} from 'tests/test-utils';

import B3LayoutTip from '@/components/layout/B3LayoutTip';
import { DynamicallyVariableProvider } from '@/shared/dynamicallyVariable';
import { UserExtraFieldsInfoResponse, UsersResponse } from '@/shared/service/b2b/graphql/users';

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

    const sallyCinnamon = buildUserEdgeWith({ node: { firstName: 'Sally', lastName: 'Cinnamon' } });
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

    const getUsersQuerySpy = vi.fn();

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetUsers', ({ query }) => {
        getUsersQuerySpy(query);

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
    expect(getUsersQuerySpy).toHaveBeenCalledWith(expect.stringContaining('offset: 12'));
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

    const sallyCinnamon = buildUserEdgeWith({ node: { firstName: 'Sally', lastName: 'Cinnamon' } });
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

    const getUsersQuerySpy = vi.fn();

    server.use(
      graphql.query('GetUserExtraFields', () =>
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
      ),
      graphql.query('GetUsers', ({ query }) => {
        getUsersQuerySpy(query);

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
    expect(getUsersQuerySpy).toHaveBeenCalledWith(expect.stringContaining('offset: 0'));
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

    expect(within(modal).getByRole('combobox', { name: 'User role' })).toHaveValue('Junior Buyer');

    const emailField = within(modal).getByRole('textbox', { name: 'Email' });
    expect(emailField).toHaveValue('troy.mcclure@acme.org');
    expect(emailField).toBeDisabled();

    expect(within(modal).getByRole('textbox', { name: 'First name' })).toHaveValue('Troy');
    expect(within(modal).getByRole('textbox', { name: 'Last name' })).toHaveValue('McClure');
    expect(within(modal).getByRole('textbox', { name: 'Phone number' })).toHaveValue('04747665241');
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
        HttpResponse.json(buildUserExtraFieldsResponseWith('WHATEVER_VALUES')),
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
