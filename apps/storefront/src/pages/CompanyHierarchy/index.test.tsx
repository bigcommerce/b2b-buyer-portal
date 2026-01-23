import Cookies from 'js-cookie';

import { when } from 'vitest-when';
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

import CompanyHierarchy from './index';

const INACTIVE_COMPANY_ERROR_MESSAGE =
  'This business account is inactive. Reach out to our support team to reactivate your account.';

vi.mock('js-cookie');

const { server } = startMockServer();

const buildSubsidiaryWith = builder(() => ({
  companyId: faker.number.int(),
  companyName: faker.company.name(),
  parentCompanyId: faker.helpers.arrayElement([null, faker.number.int()]),
  parentCompanyName: faker.helpers.arrayElement([null, faker.company.name()]),
  channelFlag: faker.datatype.boolean(),
}));

it('displays companies in a table under the heading "Name"', async () => {
  const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
  const apple = buildSubsidiaryWith({ companyName: 'Apple', parentCompanyId: acme.companyId });

  server.use(
    graphql.query('CompanySubsidiaries', () =>
      HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
    ),
  );

  const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
  const preloadedState = { company: companyState };

  renderWithProviders(<CompanyHierarchy />, { preloadedState });

  expect(await screen.findByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  expect(await screen.findByRole('cell', { name: /ACME/ })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: /Apple/ })).toBeInTheDocument();
});

it("displays a tag of 'Your company' next to the user's assigned company", async () => {
  const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
  const apple = buildSubsidiaryWith({ companyName: 'Apple', parentCompanyId: acme.companyId });

  server.use(
    graphql.query('CompanySubsidiaries', () =>
      HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
    ),
  );

  const companyState = buildCompanyStateWith({ companyInfo: { id: `${apple.companyId}` } });
  const preloadedState = { company: companyState };

  renderWithProviders(<CompanyHierarchy />, { preloadedState });

  const rowOfAcme = await screen.findByRole('row', { name: /ACME/ });
  const rowOfApple = screen.getByRole('row', { name: /Apple/ });

  expect(within(rowOfAcme).queryByText('Your company')).not.toBeInTheDocument();
  expect(within(rowOfApple).getByText('Your company')).toBeInTheDocument();
});

it('displays a tag of "Representing" next to the currently selected company', async () => {
  const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
  const apple = buildSubsidiaryWith({ companyName: 'Apple', parentCompanyId: acme.companyId });

  server.use(
    graphql.query('CompanySubsidiaries', () =>
      HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
    ),
  );

  const companyState = buildCompanyStateWith({
    companyInfo: { id: `${acme.companyId}` },
    companyHierarchyInfo: { selectCompanyHierarchyId: `${acme.companyId}` },
  });
  const preloadedState = { company: companyState };

  renderWithProviders(<CompanyHierarchy />, { preloadedState });

  const rowOfAcme = await screen.findByRole('row', { name: /ACME/ });
  const rowOfApple = screen.getByRole('row', { name: /Apple/ });

  expect(within(rowOfAcme).getByText('Representing')).toBeInTheDocument();
  expect(within(rowOfApple).queryByText('Representing')).not.toBeInTheDocument();
});

describe('when collapsing the row of a parent company', () => {
  it('hides the rows of its children', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
    const apple = buildSubsidiaryWith({ companyName: 'Apple', parentCompanyId: acme.companyId });
    const banana = buildSubsidiaryWith({ companyName: 'Banana', parentCompanyId: acme.companyId });

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [acme, apple, banana] } }),
      ),
    );

    const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
    const preloadedState = { company: companyState };

    renderWithProviders(<CompanyHierarchy />, { preloadedState });

    const rowOfAcme = await screen.findByRole('row', { name: /ACME/ });
    const rowOfApple = screen.getByRole('row', { name: /Apple/ });
    const rowOfBanana = screen.getByRole('row', { name: /Banana/ });

    expect(rowOfApple).toBeInTheDocument();
    expect(rowOfBanana).toBeInTheDocument();

    await userEvent.click(within(rowOfAcme).getByTestId('collapse'));

    await waitFor(() => expect(rowOfApple).not.toBeInTheDocument());
    expect(rowOfBanana).not.toBeInTheDocument();
  });
});

it('display an "Actions" button for all but the selected company, if they have a "channelFlag"', async () => {
  const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
  const apple = buildSubsidiaryWith({
    companyName: 'Apple',
    parentCompanyId: acme.companyId,
    channelFlag: true,
  });
  const banana = buildSubsidiaryWith({
    companyName: 'Banana',
    parentCompanyId: acme.companyId,
    channelFlag: true,
  });
  const cherimoya = buildSubsidiaryWith({
    companyName: 'cherimoya',
    parentCompanyId: acme.companyId,
    channelFlag: false,
  });

  server.use(
    graphql.query('CompanySubsidiaries', () =>
      HttpResponse.json({ data: { companySubsidiaries: [acme, apple, banana, cherimoya] } }),
    ),
  );

  const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
  const preloadedState = { company: companyState };

  renderWithProviders(<CompanyHierarchy />, { preloadedState });

  const rowOfAcme = await screen.findByRole('row', { name: /ACME/ });
  const rowOfApple = screen.getByRole('row', { name: /Apple/ });
  const rowOfBanana = screen.getByRole('row', { name: /Banana/ });
  const rowOfCherimoya = screen.getByRole('row', { name: /cherimoya/ });

  expect(within(rowOfAcme).queryByTestId('actions')).not.toBeInTheDocument();
  expect(within(rowOfApple).getByTestId('actions')).toBeInTheDocument();
  expect(within(rowOfBanana).getByTestId('actions')).toBeInTheDocument();
  expect(within(rowOfCherimoya).queryByTestId('actions')).not.toBeInTheDocument();
});

describe('when switching to a different company', () => {
  it('displays the "Switch company" confirmation modal', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
    const apple = buildSubsidiaryWith({
      companyName: 'Apple',
      parentCompanyId: acme.companyId,
      channelFlag: true,
    });

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
      ),
    );

    const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
    const preloadedState = { company: companyState };

    renderWithProviders(<CompanyHierarchy />, { preloadedState });

    const rowOfApple = await screen.findByRole('row', { name: /Apple/ });

    await userEvent.click(within(rowOfApple).getByTestId('actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Switch company' }));

    const modal = await screen.findByRole('dialog');

    expect(within(modal).getByRole('heading', { name: 'Switch company' })).toBeInTheDocument();
    expect(
      within(modal).getByText(
        'Switching to a different company will refresh your shopping cart. Do you want to continue?',
      ),
    ).toBeInTheDocument();
  });
});

describe('when cancelling a switch to a different company', () => {
  it('closes the "Switch company" confirmation modal', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
    const apple = buildSubsidiaryWith({
      companyName: 'Apple',
      parentCompanyId: acme.companyId,
      channelFlag: true,
    });

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
      ),
    );

    const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
    const preloadedState = { company: companyState };

    renderWithProviders(<CompanyHierarchy />, { preloadedState });

    const rowOfApple = await screen.findByRole('row', { name: /Apple/ });

    await userEvent.click(within(rowOfApple).getByTestId('actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Switch company' }));

    const modal = await screen.findByRole('dialog');

    await userEvent.click(within(modal).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(modal).not.toBeInTheDocument());
  });
});

describe('when continuing to switch to a different company', () => {
  it('displays a tag of "Representing" on the chosen company', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
    const apple = buildSubsidiaryWith({
      companyName: 'Apple',
      parentCompanyId: acme.companyId,
      channelFlag: true,
    });

    const beginMasquerading = vi.fn();

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
      ),
      graphql.mutation('userMasqueradingCompanyBegin', ({ variables }) =>
        HttpResponse.json(beginMasquerading(variables)),
      ),
    );

    const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
    const preloadedState = { company: companyState };

    renderWithProviders(<CompanyHierarchy />, { preloadedState });

    const rowOfApple = await screen.findByRole('row', { name: /Apple/ });

    await userEvent.click(within(rowOfApple).getByTestId('actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Switch company' }));

    const modal = await screen.findByRole('dialog');

    when(beginMasquerading)
      .calledWith({ companyId: apple.companyId })
      .thenReturn({
        data: {
          userMasqueradingCompanyBegin: {
            userMasqueradingCompanyBegin: {
              companyId: apple.companyId,
              companyName: apple.companyName,
              bcId: '0',
            },
          },
        },
      });

    await userEvent.click(within(modal).getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(modal).not.toBeInTheDocument());
    expect(within(rowOfApple).getByText('Representing')).toBeInTheDocument();
  });

  it('shows snackbar error, when company masquerading fails due to inactive company', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
    const inactiveCompany = buildSubsidiaryWith({
      companyName: 'Inactive Company',
      parentCompanyId: acme.companyId,
      channelFlag: true,
    });

    const beginMasquerading = vi.fn();

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [acme, inactiveCompany] } }),
      ),
      graphql.mutation('userMasqueradingCompanyBegin', ({ variables }) =>
        HttpResponse.json(beginMasquerading(variables)),
      ),
    );

    const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
    const preloadedState = { company: companyState };

    renderWithProviders(<CompanyHierarchy />, { preloadedState });

    const rowOfInactiveCompany = await screen.findByRole('row', { name: /Inactive Company/ });
    const rowOfAcme = await screen.findByRole('row', { name: /ACME/ });

    await userEvent.click(within(rowOfInactiveCompany).getByTestId('actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Switch company' }));

    const modal = await screen.findByRole('dialog');

    when(beginMasquerading)
      .calledWith({ companyId: inactiveCompany.companyId })
      .thenReturn({
        data: { userMasqueradingCompanyBegin: null },
        errors: [{ message: INACTIVE_COMPANY_ERROR_MESSAGE }],
      });

    await userEvent.click(within(modal).getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(modal).not.toBeInTheDocument());
    await waitFor(() => {
      const snackbar = screen.getByRole('alert');

      expect(within(snackbar).getByText(INACTIVE_COMPANY_ERROR_MESSAGE)).toBeVisible();
    });
    expect(within(rowOfAcme).getByText('Your company')).toBeVisible();
  });
});

describe('when the user has a current cart and switches company', () => {
  it('clears the current cart', async () => {
    const acme = buildSubsidiaryWith({ companyName: 'ACME', parentCompanyId: null });
    const apple = buildSubsidiaryWith({
      companyName: 'Apple',
      parentCompanyId: acme.companyId,
      channelFlag: true,
    });

    const beginMasquerading = vi.fn();
    const deleteCart = vi
      .fn()
      .mockReturnValue({ data: { cart: { deleteCart: { deletedCartEntityId: '12345' } } } });

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [acme, apple] } }),
      ),
      graphql.mutation('userMasqueradingCompanyBegin', ({ variables }) =>
        HttpResponse.json(beginMasquerading(variables)),
      ),
      graphql.mutation('DeleteCart', ({ variables }) => HttpResponse.json(deleteCart(variables))),
    );

    const companyState = buildCompanyStateWith({ companyInfo: { id: `${acme.companyId}` } });
    const preloadedState = { company: companyState };

    renderWithProviders(<CompanyHierarchy />, { preloadedState });

    const rowOfApple = await screen.findByRole('row', { name: /Apple/ });

    await userEvent.click(within(rowOfApple).getByTestId('actions'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Switch company' }));

    const modal = await screen.findByRole('dialog');

    when(beginMasquerading)
      .calledWith({ companyId: apple.companyId })
      .thenReturn({
        data: {
          userMasqueradingCompanyBegin: {
            userMasqueradingCompanyBegin: {
              companyId: apple.companyId,
              companyName: apple.companyName,
              bcId: '0',
            },
          },
        },
      });

    // Cookies.get is overloaded, so we need to define the type explicitly
    when(vi.mocked<(name: string) => string | undefined>(Cookies.get))
      .calledWith('cartId')
      .thenReturn('12345');

    await userEvent.click(within(modal).getByRole('button', { name: 'Continue' }));

    await waitFor(() =>
      expect(deleteCart).toHaveBeenCalledWith({ deleteCartInput: { cartEntityId: '12345' } }),
    );
  });
});

describe('CompanyHierarchy - Representation Indicators', () => {
  it('should show representing company chip for selected company', async () => {
    const parentCompany = buildSubsidiaryWith({
      companyId: 1,
      companyName: 'Parent Company',
      parentCompanyId: null,
      channelFlag: false,
    });

    const subsidiaryCompany = buildSubsidiaryWith({
      companyId: 5,
      companyName: 'Subsidiary Company',
      parentCompanyId: 1,
      parentCompanyName: 'Parent Company',
      channelFlag: true,
    });

    server.use(
      graphql.query('CompanySubsidiaries', () =>
        HttpResponse.json({ data: { companySubsidiaries: [parentCompany, subsidiaryCompany] } }),
      ),
    );

    const companyState = buildCompanyStateWith({
      companyInfo: { id: '1', companyName: 'Parent Company', status: 1 },
      companyHierarchyInfo: {
        selectCompanyHierarchyId: '5',
        isEnabledCompanyHierarchy: true,
        isHasCurrentPagePermission: true,
        companyHierarchyList: [
          {
            companyId: 1,
            companyName: 'Parent Company',
            parentCompanyId: null,
            channelFlag: false,
          },
          {
            companyId: 5,
            companyName: 'Subsidiary Company',
            parentCompanyId: 1,
            parentCompanyName: 'Parent Company',
            channelFlag: true,
          },
        ],
        companyHierarchyAllList: [],
        companyHierarchySelectSubsidiariesList: [],
      },
    });

    renderWithProviders(<CompanyHierarchy />, {
      preloadedState: { company: companyState },
    });

    const rowOfSubsidiary = await screen.findByRole('row', { name: /Subsidiary Company/ });

    expect(within(rowOfSubsidiary).getByText('Representing')).toBeInTheDocument();
  });
});
