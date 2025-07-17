import {
  buildCompanyStateWith,
  builder,
  faker,
  renderWithProviders,
  screen,
  waitFor,
} from 'tests/test-utils';

import B3Nav from '@/components/layout/B3Nav';
import { GlobalState } from '@/shared/global/context/config';
import { newPermissions } from '@/shared/routes/config';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

const buildGlobalContextWith = builder<Partial<GlobalState>>(() => ({
  storefrontConfig: {
    quickOrderPad: faker.datatype.boolean(),
    buyAgain: faker.datatype.boolean(),
    quotes: faker.datatype.boolean(),
    shoppingLists: faker.datatype.boolean(),
    tradeProfessionalApplication: faker.datatype.boolean(),
  },
  quoteConfig: [],
  quoteDetailHasNewMessages: faker.datatype.boolean(),
  registerEnabled: faker.datatype.boolean(),
}));

describe('when user is not B2B user', () => {
  it('should show Quick Order in the navigation', () => {
    const globalContextWithBuyAgainOff = buildGlobalContextWith({
      storefrontConfig: {
        quickOrderPad: true,
        buyAgain: false,
      },
    });
    const companyStateWithB2CUser = buildCompanyStateWith({
      customer: {
        role: CustomerRole.B2C,
      },
    });

    renderWithProviders(<B3Nav />, {
      preloadedState: { company: companyStateWithB2CUser },
      initialGlobalContext: globalContextWithBuyAgainOff,
    });

    expect(screen.getByText('Quick order')).toBeInTheDocument();
  });
});

describe('When quickOrderPad is not enabled in storefront config', () => {
  it('should not show Quick Order in the navigation', async () => {
    const companyStateWithB2BUserAndQuickOrderPermission = buildCompanyStateWith({
      companyInfo: {
        status: CompanyStatus.APPROVED,
      },
      customer: {
        role: CustomerRole.ADMIN,
        userType: UserTypes.MULTIPLE_B2C,
      },
      permissions: [{ code: newPermissions.quickOrderPermissionCodes, permissionLevel: 3 }],
    });

    const globalContextWithQuickOrderPadOff = buildGlobalContextWith({
      storefrontConfig: {
        quickOrderPad: false,
        buyAgain: true,
      },
    });

    renderWithProviders(<B3Nav />, {
      preloadedState: { company: companyStateWithB2BUserAndQuickOrderPermission },
      initialGlobalContext: globalContextWithQuickOrderPadOff,
    });

    await waitFor(() => {
      expect(screen.queryByText('Quick order')).not.toBeInTheDocument();
    });
  });
});

describe('When buyAgain is not enabled in storefront config', () => {
  it('should not show Quick Order in the navigation', async () => {
    const companyStateWithB2BUserAndQuickOrderPermission = buildCompanyStateWith({
      companyInfo: {
        status: CompanyStatus.APPROVED,
      },
      customer: {
        role: CustomerRole.ADMIN,
        userType: UserTypes.MULTIPLE_B2C,
      },
      permissions: [{ code: newPermissions.quickOrderPermissionCodes, permissionLevel: 3 }],
    });

    const globalContextWithBuyAgainOff = buildGlobalContextWith({
      storefrontConfig: {
        quickOrderPad: true,
        buyAgain: false,
      },
    });

    renderWithProviders(<B3Nav />, {
      preloadedState: { company: companyStateWithB2BUserAndQuickOrderPermission },
      initialGlobalContext: globalContextWithBuyAgainOff,
    });

    await waitFor(() => {
      expect(screen.queryByText('Quick order')).not.toBeInTheDocument();
    });
  });
});

describe('when quickOrderPad and buyAgain are enabled in storefront config, and user is not B2C user', () => {
  const globalContextWithBuyAgainAndQuickOrderPadOn = buildGlobalContextWith({
    storefrontConfig: {
      quickOrderPad: true,
      buyAgain: true,
    },
  });
  describe('when user has no quick order permission', () => {
    it('should not show Quick Order in the navigation', async () => {
      const companyStateWithB2BUserAndNoQuickOrderPermission = buildCompanyStateWith({
        companyInfo: {
          status: CompanyStatus.APPROVED,
        },
        customer: {
          role: CustomerRole.ADMIN,
          userType: UserTypes.MULTIPLE_B2C,
        },
        permissions: [],
      });

      renderWithProviders(<B3Nav />, {
        preloadedState: { company: companyStateWithB2BUserAndNoQuickOrderPermission },
        initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
      });

      await waitFor(() => {
        expect(screen.queryByText('Quick order')).not.toBeInTheDocument();
      });
    });
  });

  describe('when user has quick order permission with user level', () => {
    const b2bUser = {
      customer: {
        role: CustomerRole.ADMIN,
        userType: UserTypes.MULTIPLE_B2C,
      },
      companyInfo: {
        status: CompanyStatus.APPROVED,
      },
    };
    const quickOrderPermissionWithUserLevel = {
      code: newPermissions.quickOrderPermissionCodes,
      permissionLevel: 1,
    };
    describe('when user represents its own company', () => {
      it('should show Quick Order in the navigation', () => {
        const companyHierarchyWithUserRepresentingItsOwnCompany = {
          selectCompanyHierarchyId: '',
        };

        const companyState = buildCompanyStateWith({
          ...b2bUser,
          permissions: [quickOrderPermissionWithUserLevel],
          companyHierarchyInfo: companyHierarchyWithUserRepresentingItsOwnCompany,
        });

        renderWithProviders(<B3Nav />, {
          preloadedState: { company: companyState },
          initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
        });

        expect(screen.getByText('Quick order')).toBeInTheDocument();
      });
    });

    describe('when user represents child company', () => {
      it('should not show Quick Order in the navigation', async () => {
        const companyHierarchyWithUserRepresentingChildCompany = {
          selectCompanyHierarchyId: 'child-company-id',
        };

        const companyState = buildCompanyStateWith({
          ...b2bUser,
          permissions: [quickOrderPermissionWithUserLevel],
          companyHierarchyInfo: companyHierarchyWithUserRepresentingChildCompany,
        });

        renderWithProviders(<B3Nav />, {
          preloadedState: { company: companyState },
          initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
        });

        await waitFor(() => {
          expect(screen.queryByText('Quick order')).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('when user has quick order permission with company level', () => {
    const b2bUser = {
      customer: {
        role: CustomerRole.ADMIN,
        userType: UserTypes.MULTIPLE_B2C,
      },
      companyInfo: {
        status: CompanyStatus.APPROVED,
      },
    };
    const quickOrderPermissionWithCompanyLevel = {
      code: newPermissions.quickOrderPermissionCodes,
      permissionLevel: 2,
    };
    describe('when user represents its own company', () => {
      it('should show Quick Order in the navigation', async () => {
        const companyHierarchyWithUserRepresentingItsOwnCompany = {
          selectCompanyHierarchyId: '',
        };

        const companyState = buildCompanyStateWith({
          ...b2bUser,
          permissions: [quickOrderPermissionWithCompanyLevel],
          companyHierarchyInfo: companyHierarchyWithUserRepresentingItsOwnCompany,
        });

        renderWithProviders(<B3Nav />, {
          preloadedState: { company: companyState },
          initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
        });

        expect(screen.getByText('Quick order')).toBeInTheDocument();
      });
    });

    describe('when user represents child company', () => {
      it('should not show Quick Order in the navigation', async () => {
        const companyHierarchyWithUserRepresentingChildCompany = {
          selectCompanyHierarchyId: 'child-company-id',
        };

        const companyState = buildCompanyStateWith({
          ...b2bUser,
          permissions: [quickOrderPermissionWithCompanyLevel],
          companyHierarchyInfo: companyHierarchyWithUserRepresentingChildCompany,
        });

        renderWithProviders(<B3Nav />, {
          preloadedState: { company: companyState },
          initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
        });

        await waitFor(() => {
          expect(screen.queryByText('Quick order')).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('when user has quick order permission with company and subsidiaries level', () => {
    const b2bUser = {
      customer: {
        role: CustomerRole.ADMIN,
        userType: UserTypes.MULTIPLE_B2C,
      },
      companyInfo: {
        status: CompanyStatus.APPROVED,
      },
    };
    const quickOrderPermissionWithCompanyAndSubsidiariesLevel = {
      code: newPermissions.quickOrderPermissionCodes,
      permissionLevel: 3,
    };
    describe('when user represents its own company', () => {
      it('should show Quick Order in the navigation', async () => {
        const companyHierarchyWithUserRepresentingItsOwnCompany = {
          selectCompanyHierarchyId: '',
        };

        const companyState = buildCompanyStateWith({
          ...b2bUser,
          permissions: [quickOrderPermissionWithCompanyAndSubsidiariesLevel],
          companyHierarchyInfo: companyHierarchyWithUserRepresentingItsOwnCompany,
        });

        renderWithProviders(<B3Nav />, {
          preloadedState: { company: companyState },
          initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
        });

        expect(screen.getByText('Quick order')).toBeInTheDocument();
      });
    });

    describe('when user represents its child company', () => {
      it('should show Quick Order in the navigation', async () => {
        const companyHierarchyWithUserRepresentingChildCompany = {
          selectCompanyHierarchyId: 'child-company-id',
        };

        const companyState = buildCompanyStateWith({
          ...b2bUser,
          permissions: [quickOrderPermissionWithCompanyAndSubsidiariesLevel],
          companyHierarchyInfo: companyHierarchyWithUserRepresentingChildCompany,
        });

        renderWithProviders(<B3Nav />, {
          preloadedState: { company: companyState },
          initialGlobalContext: globalContextWithBuyAgainAndQuickOrderPadOn,
        });

        expect(screen.getByText('Quick order')).toBeInTheDocument();
      });
    });
  });
});
