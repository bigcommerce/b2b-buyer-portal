import {
  buildCompanyStateWith,
  builder,
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
  companyHierarchyInfo: { selectCompanyHierarchyId: '123' },
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
