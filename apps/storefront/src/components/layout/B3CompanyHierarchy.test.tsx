import { buildCompanyStateWith } from 'tests/storeStateBuilders/companyStateBuilder';
import { renderWithProviders, screen } from 'tests/test-utils';

import B3CompanyHierarchy from './B3CompanyHierarchy';

describe('when company hierarchy representation is active', () => {
  it('shows company hierarchy dropdown with representing company chip', () => {
    const preloadedState = {
      company: buildCompanyStateWith({
        companyHierarchyInfo: {
          selectCompanyHierarchyId: '5',
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          companyHierarchyList: [
            { companyId: 1, companyName: 'Parent Company', channelFlag: false },
            { companyId: 5, companyName: 'Child Company', channelFlag: false },
          ],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        companyInfo: {
          id: '1',
          companyName: 'Parent Company',
        },
        pagesSubsidiariesPermission: {
          order: true,
          invoice: false,
          addresses: false,
          userManagement: false,
          shoppingLists: false,
        },
      }),
    };

    renderWithProviders(<B3CompanyHierarchy />, {
      preloadedState,
      initialGlobalContext: {},
    });

    const dropdownButton = screen.getByRole('button');
    expect(dropdownButton).toBeInTheDocument();

    expect(dropdownButton).toHaveTextContent('Child Company');

    expect(screen.getByText('Representing')).toBeInTheDocument();
  });
});

describe('when no company hierarchy representation is active', () => {
  it('shows current company chip only', () => {
    const preloadedState = {
      company: buildCompanyStateWith({
        companyHierarchyInfo: {
          selectCompanyHierarchyId: '',
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          companyHierarchyList: [
            { companyId: 1, companyName: 'Parent Company', channelFlag: false },
          ],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        companyInfo: {
          id: '1',
          companyName: 'Parent Company',
        },
        pagesSubsidiariesPermission: {
          order: true,
          invoice: false,
          addresses: false,
          userManagement: false,
          shoppingLists: false,
        },
      }),
    };

    renderWithProviders(<B3CompanyHierarchy />, {
      preloadedState,
      initialGlobalContext: {},
    });

    const dropdownButton = screen.getByRole('button');

    expect(dropdownButton).toHaveTextContent('Parent Company');
  });
});

describe('when user lacks permissions', () => {
  it('not srender when no subsidiaries permissions are granted', () => {
    const preloadedState = {
      company: buildCompanyStateWith({
        companyHierarchyInfo: {
          selectCompanyHierarchyId: '',
          isEnabledCompanyHierarchy: true,
          isHasCurrentPagePermission: true,
          companyHierarchyList: [
            { companyId: 1, companyName: 'Parent Company', channelFlag: false },
          ],
          companyHierarchyAllList: [],
          companyHierarchySelectSubsidiariesList: [],
        },
        companyInfo: {
          id: '1',
          companyName: 'Parent Company',
        },
        pagesSubsidiariesPermission: {
          order: false,
          invoice: false,
          addresses: false,
          userManagement: false,
          shoppingLists: false,
        },
      }),
    };

    renderWithProviders(<B3CompanyHierarchy />, {
      preloadedState,
      initialGlobalContext: {},
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
