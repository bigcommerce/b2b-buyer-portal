import {
  buildCompanyStateWith,
  builder,
  faker,
  renderWithProviders,
  screen,
} from 'tests/test-utils';

import { CompanyStatus, Customer, CustomerRole, LoginTypes, UserTypes } from '@/types';

import AccountSetting from '.';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  platform: 'catalyst',
}));

const buildCustomerWith = builder<Customer>(() => ({
  id: 0,
  phoneNumber: faker.phone.number(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  emailAddress: faker.internet.email(),
  customerGroupId: 123,
  role: CustomerRole.GUEST,
  userType: UserTypes.DOES_NOT_EXIST,
  loginType: LoginTypes.WAITING_LOGIN,
  companyRoleName: 'Tester',
}));

describe('B2B Upgrade Banner', () => {
  it('does not display the B2B upgrade banner when user is B2B', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.CURRENT_B2B_COMPANY,
      role: CustomerRole.SUPER_ADMIN,
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

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
      },
    });

    await vi.waitFor(
      async () => {
        const bannerTitle = screen.queryByText('Upgrade to a business account');
        expect(bannerTitle).not.toBeInTheDocument();
      },
      {
        timeout: 500,
      },
    );
  });

  it('displays the B2B upgrade bannel when user is B2C user', async () => {
    const customer = buildCustomerWith({
      id: 123,
      userType: UserTypes.MULTIPLE_B2C,
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

    renderWithProviders(<AccountSetting />, {
      preloadedState: {
        company: companyState,
      },
    });

    await vi.waitFor(
      async () => {
        expect(screen.getByText('Upgrade to a business account')).toBeDefined();
        const upgradeLink = screen.getByRole('link', { name: 'Upgrade' });
        expect(upgradeLink).toHaveAttribute('href', '/registeredbctob2b');
      },
      {
        timeout: 500,
      },
    );
  });
});
