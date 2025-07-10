import {
  buildCompanyStateWith,
  builder,
  faker,
  renderWithProviders,
  screen,
  userEvent,
} from 'tests/test-utils';

import B3CompanyHierarchyExternalButton from './B3CompanyHierarchyExternalButton';

vi.mock('js-cookie');

const buildSubsidiaryWith = builder(() => ({
  companyId: faker.number.int(),
  companyName: faker.company.name(),
  parentCompanyId: faker.helpers.arrayElement([null, faker.number.int()]),
  parentCompanyName: faker.helpers.arrayElement([null, faker.company.name()]),
  channelFlag: faker.datatype.boolean(),
}));

describe('when there is not a selected company within the company hierarchy', () => {
  it('does not displays the message regarding which company is being represented', async () => {
    const companyState = buildCompanyStateWith({
      companyHierarchyInfo: { selectCompanyHierarchyId: undefined, companyHierarchyList: [] },
    });

    renderWithProviders(<B3CompanyHierarchyExternalButton isOpen setOpenPage={vi.fn()} />, {
      preloadedState: { company: companyState },
    });

    expect(screen.queryByText('You are representing')).not.toBeInTheDocument();
  });
});

describe('when there is a selected company within the company hierarchy', () => {
  it('displays a message explaining which company the user is representing', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: undefined });
    const companyState = buildCompanyStateWith({
      companyHierarchyInfo: {
        selectCompanyHierarchyId: acme.companyId,
        companyHierarchyList: [{ ...acme, parentCompanyName: undefined }],
      },
    });

    renderWithProviders(<B3CompanyHierarchyExternalButton isOpen setOpenPage={vi.fn()} />, {
      preloadedState: { company: companyState },
    });

    expect(await screen.findByText('You are representing')).toBeInTheDocument();
    expect(screen.getByText('ACME')).toBeInTheDocument();
  });
});

describe('when the user has "companyHierarchy" permissions and clicks on the company name', () => {
  it('navigates to the "Company hierarchy" page', async () => {
    const pagesSubsidiariesPermission = { companyHierarchy: true };

    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: undefined });
    const companyState = buildCompanyStateWith({
      companyHierarchyInfo: {
        selectCompanyHierarchyId: acme.companyId,
        companyHierarchyList: [{ ...acme, parentCompanyName: undefined }],
      },
      pagesSubsidiariesPermission,
    });

    const setOpenPage = vi.fn();

    renderWithProviders(<B3CompanyHierarchyExternalButton isOpen setOpenPage={setOpenPage} />, {
      preloadedState: { company: companyState },
    });

    await userEvent.click(await screen.findByText('ACME'));

    expect(setOpenPage).toHaveBeenCalledWith({ isOpen: true, openUrl: '/company-hierarchy' });
  });
});

describe('when the user does not have "companyHierarchy" permission, but does have permission to view other pages', () => {
  describe('when app is not already open and the user clicks on the company name', () => {
    it('navigates to the allowed page', async () => {
      const pagesSubsidiariesPermission = { companyHierarchy: false, order: true };

      const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: undefined });
      const companyState = buildCompanyStateWith({
        companyHierarchyInfo: {
          selectCompanyHierarchyId: acme.companyId,
          companyHierarchyList: [{ ...acme, parentCompanyName: undefined }],
        },
        pagesSubsidiariesPermission,
      });

      const setOpenPage = vi.fn();

      renderWithProviders(
        <B3CompanyHierarchyExternalButton isOpen={false} setOpenPage={setOpenPage} />,
        { preloadedState: { company: companyState } },
      );

      await userEvent.click(await screen.findByText('ACME'));

      expect(setOpenPage).toHaveBeenCalledWith({ isOpen: true, openUrl: '/orders' });
    });
  });
});
