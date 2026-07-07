import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from 'tests/test-utils';

import { CompanyStatus, Customer, CustomerRole, LoginTypes, UserTypes } from '@/types';

import AccountSetting from '.';

vi.mock('@/utils/basicConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/basicConfig')>()),
  platform: 'catalyst',
}));

// useStorefrontCaptcha issues an anonymous reCaptcha-config query that MSW can't intercept
// (and warns about, failing the suite via fail-on-console). Stub it so no request is made;
// reCaptcha stays disabled, which is what these tests exercise.
vi.mock('@/shared/service/b2b/graphql/recaptcha', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b/graphql/recaptcha')>()),
  getStorefrontToken: vi.fn().mockResolvedValue({ isEnabledOnStorefront: false, siteKey: '' }),
}));

const { server } = startMockServer();

const buildCustomerWith = builder<Customer>(() => ({
  id: 0,
  phoneNumber: faker.phone.number(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  emailAddress: faker.internet.email(),
  customerGroupId: 123,
  role: faker.helpers.arrayElement([
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.B2C,
    CustomerRole.JUNIOR_BUYER,
  ]),
  userType: UserTypes.DOES_NOT_EXIST,
  loginType: LoginTypes.WAITING_LOGIN,
  companyRoleName: 'Tester',
}));

// The page loads account settings through the storefront GQL proxy queries
// `CustomerDetails` (BC users) and `CompanyUserDetails` (B2B users). Mock
// both so the page initializes regardless of which path runs.
const mockAccountSettingsQueries = () =>
  server.use(
    graphql.query('B2BAccountFormFields', () =>
      HttpResponse.json({ data: { accountFormFields: [] } }),
    ),
    graphql.query('CustomerDetails', () =>
      HttpResponse.json({
        data: {
          customer: {
            firstName: 'Jane',
            lastName: 'Doe',
            company: 'ACME',
            phoneNumber: '1234567890',
            email: 'jane.doe@example.com',
            formFields: [],
          },
        },
      }),
    ),
    graphql.query('CompanyUserDetails', () =>
      HttpResponse.json({
        data: {
          company: {
            companyUser: {
              firstName: 'Jane',
              lastName: 'Doe',
              company: 'ACME',
              companyRoleName: 'Tester',
              phoneNumber: '1234567890',
              email: 'jane.doe@example.com',
              extraFields: [],
              formFields: [],
            },
          },
        },
      }),
    ),
    graphql.query('CustomerFormFieldSettings', () =>
      HttpResponse.json({
        data: { site: { settings: { formFields: { customer: [] } } } },
      }),
    ),
  );

describe('B2B Upgrade Banner', () => {
  it('does not display the B2B upgrade banner when user is B2B', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.CURRENT_B2B_COMPANY,
      role: CustomerRole.SENIOR_BUYER,
    });

    const companyInfoInCompanyState = {
      id: '79',
      companyName: 'b2b',
      status: CompanyStatus.APPROVED,
    };

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: companyInfoInCompanyState,
      permissions: [],
    });

    mockAccountSettingsQueries();

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
        global: buildGlobalStateWith({
          featureFlags: { 'PROJECT-7920.use_bc_account_settings': true },
        }),
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(screen.queryByText('Upgrade to a business account')).not.toBeInTheDocument();
  });

  it('displays the B2B upgrade banner when user is B2C user', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
      role: CustomerRole.B2C,
    });

    const companyInfoInCompanyState = {
      id: '79',
      companyName: 'b2bc',
      status: CompanyStatus.INACTIVE,
    };

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: companyInfoInCompanyState,
      permissions: [],
    });

    mockAccountSettingsQueries();

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
        global: buildGlobalStateWith({
          featureFlags: { 'PROJECT-7920.use_bc_account_settings': true },
        }),
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const alertBox = await screen.findByText(/Upgrade to a business account/i);

    expect(alertBox).toBeInTheDocument();

    const updateLink = screen.getByRole('link', { name: 'Upgrade' });
    expect(updateLink).toHaveAttribute('href', '/registeredbctob2b');
  });
});

// When the flag is off, the page falls back to the legacy B2B GQL queries
// (`GetB2CAccountSettings` / `GetB2bAccountSettings`) via graphqlB2B.
const mockLegacyAccountSettingsQueries = () =>
  server.use(
    graphql.query('B2BAccountFormFields', () =>
      HttpResponse.json({ data: { accountFormFields: [] } }),
    ),
    graphql.query('GetB2CAccountSettings', () =>
      HttpResponse.json({
        data: {
          customerAccountSettings: {
            firstName: 'Jane',
            lastName: 'Doe',
            company: 'ACME',
            phoneNumber: '1234567890',
            email: 'jane.doe@example.com',
            formFields: [],
          },
        },
      }),
    ),
  );

describe('account settings feature flag (PROJECT-7920.use_bc_account_settings)', () => {
  it('loads via the legacy B2B GQL path when the flag is off', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
      role: CustomerRole.B2C,
    });

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: { id: '79', companyName: 'b2bc', status: CompanyStatus.INACTIVE },
      permissions: [],
    });

    // Only the legacy query is mocked — the new SF GQL queries are not, so this
    // passes only if the flag-off path actually calls the legacy endpoint.
    mockLegacyAccountSettingsQueries();

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
        global: buildGlobalStateWith({
          featureFlags: { 'PROJECT-7920.use_bc_account_settings': false },
        }),
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(await screen.findByText(/Upgrade to a business account/i)).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong. Please try again.')).not.toBeInTheDocument();
  });
});

// Contact fields (so email validation short-circuits) plus a visible custom form field
// (groupId 2) whose entityId is encoded in its fieldId (field_27).
const accountFormFieldsWithCustom = [
  {
    id: '1',
    formType: 1,
    fieldId: 'field_first_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'First Name',
    fieldName: 'first_name',
    fieldType: 'text',
  },
  {
    id: '2',
    formType: 1,
    fieldId: 'field_email',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Email Address',
    fieldName: 'email',
    fieldType: 'text',
  },
  {
    id: '11',
    formType: 1,
    fieldFrom: 10,
    fieldId: 'field_27',
    groupId: 2,
    groupName: 'Additional Information',
    isRequired: false,
    visible: true,
    labelName: 'Middle name',
    fieldName: 'middle_name',
    fieldType: 'text',
    custom: true,
  },
];

describe('native SF GQL form-field updates', () => {
  it('sends a BC custom form field through customer.updateCustomer keyed by fieldEntityId', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
      role: CustomerRole.SUPER_ADMIN,
      emailAddress: 'jane.doe@example.com',
    });

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: { id: '79', companyName: 'b2bc', status: CompanyStatus.INACTIVE },
      permissions: [],
    });

    let capturedInput: { formFields?: unknown } | undefined;

    server.use(
      graphql.query('B2BAccountFormFields', () =>
        HttpResponse.json({ data: { accountFormFields: accountFormFieldsWithCustom } }),
      ),
      graphql.query('CustomerDetails', () =>
        HttpResponse.json({
          data: {
            customer: {
              firstName: 'Jane',
              lastName: 'Doe',
              company: 'ACME',
              phoneNumber: '1234567890',
              email: 'jane.doe@example.com',
              formFields: [],
            },
          },
        }),
      ),
      graphql.mutation('UpdateCustomer', ({ variables }) => {
        capturedInput = variables.input;
        return HttpResponse.json({
          data: { customer: { updateCustomer: { customer: { firstName: 'Jane' } } } },
        });
      }),
    );

    const { user, result } = renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
        global: buildGlobalStateWith({
          featureFlags: { 'PROJECT-7920.use_bc_account_settings': true },
        }),
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const view = within(result.container);
    await user.type(view.getByRole('textbox', { name: /middle name/i }), 'Lee');
    await user.click(view.getByRole('button', { name: /save updates/i }));

    await waitFor(() => expect(capturedInput).toBeDefined());
    expect(capturedInput?.formFields).toEqual({ texts: [{ fieldEntityId: 27, text: 'Lee' }] });
  });

  it('sends a B2B custom form field through company.updateCompanyUser keyed by fieldEntityId', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
      role: CustomerRole.JUNIOR_BUYER,
      emailAddress: 'jane.doe@example.com',
    });

    const companyState = buildCompanyStateWith({
      customer,
      companyInfo: { id: '79', companyName: 'b2bc', status: CompanyStatus.APPROVED },
      permissions: [],
    });

    let capturedInput: { formFields?: unknown } | undefined;

    server.use(
      graphql.query('B2BAccountFormFields', () =>
        HttpResponse.json({ data: { accountFormFields: accountFormFieldsWithCustom } }),
      ),
      graphql.query('CompanyUserDetails', () =>
        HttpResponse.json({
          data: {
            company: {
              companyUser: {
                firstName: 'Jane',
                lastName: 'Doe',
                company: 'ACME',
                companyRoleName: 'Buyer',
                phoneNumber: '1234567890',
                email: 'jane.doe@example.com',
                extraFields: [],
                formFields: [],
              },
            },
          },
        }),
      ),
      graphql.mutation('UpdateCompanyUser', ({ variables }) => {
        capturedInput = variables.input;
        return HttpResponse.json({ data: { company: { updateCompanyUser: { errors: [] } } } });
      }),
    );

    const { user, result } = renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
        global: buildGlobalStateWith({
          featureFlags: { 'PROJECT-7920.use_bc_account_settings': true },
        }),
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    const view = within(result.container);
    await user.type(view.getByRole('textbox', { name: /middle name/i }), 'Lee');
    await user.click(view.getByRole('button', { name: /save updates/i }));

    await waitFor(() => expect(capturedInput).toBeDefined());
    expect(capturedInput?.formFields).toEqual({ texts: [{ fieldEntityId: 27, text: 'Lee' }] });
  });
});
