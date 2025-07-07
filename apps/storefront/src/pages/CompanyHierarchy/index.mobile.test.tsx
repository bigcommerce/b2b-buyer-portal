import Cookies from 'js-cookie';
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
import { when } from 'vitest-when';

import CompanyHierarchy from './index';

vi.mock('js-cookie');

const { server } = startMockServer();

const buildSubsidiaryWith = builder(() => ({
  companyId: faker.number.int(),
  companyName: faker.company.name(),
  parentCompanyId: faker.helpers.arrayElement([null, faker.number.int()]),
  parentCompanyName: faker.helpers.arrayElement([null, faker.company.name()]),
  channelFlag: faker.datatype.boolean(),
}));

beforeEach(() => {
  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(500);
});

it('displays each company', async () => {
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

  expect(await screen.findByRole('listitem', { name: /ACME/ })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: /Apple/ })).toBeInTheDocument();
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

  const tileOfAcme = await screen.findByRole('listitem', { name: /ACME/ });
  const sectionOrApple = screen.getByRole('listitem', { name: /Apple/ });

  expect(within(tileOfAcme).queryByText('Your company')).not.toBeInTheDocument();
  expect(within(sectionOrApple).getByText('Your company')).toBeInTheDocument();
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

  const tileOfAcme = await screen.findByRole('listitem', { name: /ACME/ });
  const sectionOrApple = screen.getByRole('listitem', { name: /Apple/ });

  expect(within(tileOfAcme).getByText('Representing')).toBeInTheDocument();
  expect(within(sectionOrApple).queryByText('Representing')).not.toBeInTheDocument();
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

  const tileOfAcme = await screen.findByRole('listitem', { name: /ACME/ });
  const tileOfApple = screen.getByRole('listitem', { name: /Apple/ });
  const tileOfBanana = screen.getByRole('listitem', { name: /Banana/ });
  const rowOfCherimoya = screen.getByRole('listitem', { name: /cherimoya/ });

  expect(within(tileOfAcme).queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
  expect(within(tileOfApple).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  expect(within(tileOfBanana).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  expect(within(rowOfCherimoya).queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
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

    const tileOfApple = await screen.findByRole('listitem', { name: /Apple/ });

    await userEvent.click(within(tileOfApple).getByRole('button', { name: 'Actions' }));
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

    const tileOfApple = await screen.findByRole('listitem', { name: /Apple/ });

    await userEvent.click(within(tileOfApple).getByRole('button', { name: 'Actions' }));
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

    const tileOfApple = await screen.findByRole('listitem', { name: /Apple/ });

    await userEvent.click(within(tileOfApple).getByRole('button', { name: 'Actions' }));
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
    expect(within(tileOfApple).getByText('Representing')).toBeInTheDocument();
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

    const tileOfApple = await screen.findByRole('listitem', { name: /Apple/ });

    await userEvent.click(within(tileOfApple).getByRole('button', { name: 'Actions' }));
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
