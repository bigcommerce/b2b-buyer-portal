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
} from 'tests/test-utils';

import { CompanyStatus, Customer, CustomerRole, LoginTypes, UserTypes } from '@/types';

import AccountSetting from '.';

vi.mock('@/utils/basicConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/basicConfig')>()),
  platform: 'catalyst',
  isCatalystPlatform: () => true,
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

// When the dedupe flag is on and the previous save persisted `isFinishUpdate`
// in sessionStorage, mounting the page runs `init` once to refresh the data and
// then flips `isFinishUpdate` back to false. That reset re-triggers the effect,
// which must be skipped so the storefront config is not fetched twice.
describe('dedupe storefront config fetch calls (B2B-5309.dedupe_storefront_config_fetch_calls)', () => {
  const buildB2CCompanyState = () =>
    buildCompanyStateWith({
      customer: buildCustomerWith({
        id: 123,
        userType: UserTypes.MULTIPLE_B2C,
        role: CustomerRole.B2C,
      }),
      companyInfo: { id: '79', companyName: 'b2bc', status: CompanyStatus.INACTIVE },
      permissions: [],
    });

  const dedupeEnabledFlags = {
    'PROJECT-7920.use_bc_account_settings': true,
    'B2B-5309.dedupe_storefront_config_fetch_calls': true,
  };

  afterEach(() => {
    sessionStorage.clear();
  });

  it('skips the redundant reload triggered when isFinishUpdate resets after a successful update', async () => {
    // Simulate "an update just finished" — the page persists this flag itself.
    sessionStorage.setItem('sf-isFinishUpdate', 'true');

    let formFieldsCalls = 0;
    server.use(
      graphql.query('B2BAccountFormFields', () => {
        formFieldsCalls += 1;

        return HttpResponse.json({ data: { accountFormFields: [] } });
      }),
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
    );

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: buildB2CCompanyState(),
        global: buildGlobalStateWith({ featureFlags: dedupeEnabledFlags }),
      },
    });

    // The post-update success notification confirms the update path ran.
    expect(await screen.findByText('Your account details have been updated.')).toBeInTheDocument();

    // The follow-up effect run (isFinishUpdate -> false) is skipped, so the
    // storefront config is only fetched once.
    await waitFor(() => expect(formFieldsCalls).toBe(1));
  });

  it('retries the reload when the post-update fetch fails so account data is not left stale', async () => {
    sessionStorage.setItem('sf-isFinishUpdate', 'true');

    let formFieldsCalls = 0;
    server.use(
      graphql.query('B2BAccountFormFields', () => {
        formFieldsCalls += 1;

        // Fail the first (post-update) load, then succeed on the retry.
        if (formFieldsCalls === 1) {
          return HttpResponse.error();
        }

        return HttpResponse.json({ data: { accountFormFields: [] } });
      }),
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
    );

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: buildB2CCompanyState(),
        global: buildGlobalStateWith({ featureFlags: dedupeEnabledFlags }),
      },
    });

    // Because the failed run must not set the skip flag, the reset of
    // isFinishUpdate re-runs init, which retries the fetch (a second call).
    await waitFor(() => expect(formFieldsCalls).toBe(2));
  });
});
