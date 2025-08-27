import Cookies from 'js-cookie';
import { when } from 'vitest-when';

import { AgentInfo, Company, CompanyEdge } from '@/shared/service/b2b/graphql/global';
import { CompanyStatus } from '@/types';
import { buildB2BFeaturesStateWith } from 'tests/storeStateBuilders/b2bFeaturesStateBuilder';
import {
  buildCompanyStateWith,
  builder,
  buildGlobalStateWith,
  bulk,
  faker,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  stringContainingAll,
  userEvent,
  waitFor,
  within,
} from 'tests/test-utils';

import Dashboard from '.';

const { server } = startMockServer();

const buildCompanyEdgeWith = builder<CompanyEdge>(() => ({
  node: {
    id: faker.string.uuid(),
    companyId: faker.number.int(),
    companyName: faker.company.name(),
    companyEmail: faker.internet.email(),
  },
}));

const buildCompanyListWith = builder<Company>(() => {
  const numberOfCompanies = faker.number.int({ min: 1, max: 10 });

  return {
    data: {
      superAdminCompanies: {
        edges: bulk(buildCompanyEdgeWith, 'WHATEVER_VALUES').times(numberOfCompanies),
        totalCount: faker.number.int({ min: numberOfCompanies, max: 100 }),
      },
    },
  };
});

const buildAgentInfoWith = builder<AgentInfo>(() => ({
  data: {
    superAdminMasquerading: {
      companyName: faker.company.name(),
      bcGroupName: faker.string.uuid(),
      customerGroupId: faker.number.int(),
      companyStatus: faker.helpers.enumValue(CompanyStatus),
      id: faker.string.uuid(),
    },
  },
}));

describe('when the user is associated with a company', () => {
  const companyWithB2B = buildCompanyStateWith({
    customer: {
      id: 789,
      b2bId: 882288,
    },
  });

  const preloadedState = { company: companyWithB2B };

  beforeEach(() => {
    Cookies.remove('cartId');
  });

  it('displays a table with headings for each key attribute of a company', async () => {
    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(buildCompanyListWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const table = screen.getByRole('table');

    const columnHeaders = within(table).getAllByRole('columnheader');

    expect(columnHeaders[0]).toHaveTextContent('Company');
    expect(columnHeaders[1]).toHaveTextContent('Email');
    expect(columnHeaders[2]).toHaveTextContent('Action');
  });

  it('lists all the companies associated with the user', async () => {
    const acmeInc = buildCompanyEdgeWith({ node: { companyName: 'Acme Inc' } });
    const wayneIndustries = buildCompanyEdgeWith({ node: { companyName: 'Wayne Industries' } });

    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [acmeInc, wayneIndustries], totalCount: 2 } },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('row', { name: /Acme Inc/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Wayne Industries/ })).toBeInTheDocument();

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('superAdminId: 882288'));
  });

  it('lists all the details associated with a company', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyName: 'Acme Inc',
        companyEmail: 'info@acme.com',
      },
    });

    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const rowOfAcmeInc = screen.getByRole('row', { name: /Acme Inc/ });

    expect(screen.getByRole('row', { name: /Acme Inc/ })).toBeInTheDocument();

    expect(within(rowOfAcmeInc).getByRole('cell', { name: /Acme Inc/ })).toBeInTheDocument();
    expect(within(rowOfAcmeInc).getByRole('cell', { name: /nfo@acme.com/ })).toBeInTheDocument();

    const actionButton = within(rowOfAcmeInc).getByRole('button');

    await userEvent.click(actionButton);

    const masqueradeMenuItem = screen.getByRole('menuitem', { name: /Masquerade/ });

    await userEvent.keyboard('{Escape}');

    expect(masqueradeMenuItem).not.toBeInTheDocument();

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('superAdminId: 882288'));
  });

  it('sorts the list by company by default', async () => {
    const getCompanies = vi.fn().mockReturnValue(buildCompanyListWith('WHATEVER_VALUES'));

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const companyColumnHeader = screen.getByRole('columnheader', { name: /Company/ });

    expect(companyColumnHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(getCompanies).toHaveBeenLastCalledWith(
      expect.stringContaining('orderBy: "companyName"'),
    );
  });

  it('allows users to search', async () => {
    const getCompanies = vi.fn().mockReturnValue(buildCompanyListWith('WHATEVER_VALUES'));

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: [buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } })],
            totalCount: 1,
          },
        },
      }),
    );

    const searchBox = screen.getByPlaceholderText(/Search/);

    await userEvent.type(searchBox, 'monsters');

    await waitFor(() => {
      expect(screen.getByRole('row', { name: /Monsters Inc/ })).toBeInTheDocument();
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('search: "monsters"'));
  });

  it('allows user to sort the list', async () => {
    const getCompanies = vi.fn().mockReturnValue(buildCompanyListWith('WHATEVER_VALUES'));

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: [buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } })],
            totalCount: 1,
          },
        },
      }),
    );

    const companyColumnHeader = screen.getByRole('columnheader', { name: /Company/ });
    const emailColumnHeader = screen.getByRole('columnheader', { name: /Email/ });

    await userEvent.click(within(emailColumnHeader).getByRole('button'));

    expect(emailColumnHeader).toHaveAttribute('aria-sort', 'descending');
    expect(companyColumnHeader).not.toHaveAttribute('aria-sort');

    expect(getCompanies).toHaveBeenLastCalledWith(
      expect.stringContaining('orderBy: "-companyEmail"'),
    );
  });

  it('allows user to change the number of rows per page', async () => {
    const getCompanies = vi.fn().mockReturnValue(buildCompanyListWith('WHATEVER_VALUES'));

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: [buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } })],
            totalCount: 1,
          },
        },
      }),
    );

    const rowsPerPageSelect = screen.getByRole('combobox', { name: /Rows per page/ });

    await userEvent.click(rowsPerPageSelect);

    const option = screen.getByRole('option', { name: '20' });

    await userEvent.click(option);

    await waitFor(() => {
      expect(screen.getByRole('row', { name: /Monsters Inc/ })).toBeInTheDocument();
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('first: 20'));
  });

  it('can go to the next page', async () => {
    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { totalCount: 100 } },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: [buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } })],
            totalCount: 100,
          },
        },
      }),
    );

    const nextPageButton = screen.getByRole('button', { name: /next page/ });

    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(screen.getByRole('row', { name: /Monsters Inc/ })).toBeInTheDocument();
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('offset: 10'));
    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('first: 10'));
  });

  it('can go to the previous page', async () => {
    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { totalCount: 100 } },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: [buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } })],
            totalCount: 100,
          },
        },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: /next page/ }));

    const prevPageButton = screen.getByRole('button', { name: /previous page/ });

    await userEvent.click(prevPageButton);

    await waitFor(() => {
      expect(screen.getByRole('row', { name: /Monsters Inc/ })).toBeInTheDocument();
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('offset: 0'));
    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('first: 10'));
  });

  it('can masquerade a company', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyId: 123,
        companyName: 'Acme Inc',
      },
    });

    const beginMasquerade = vi.fn().mockReturnValue({});
    const getAgentInfo = vi.fn().mockReturnValue(
      buildAgentInfoWith({
        data: {
          superAdminMasquerading: {
            id: '123',
            customerGroupId: 42,
            companyName: 'Acme Inc as returned from the AgentInfo query',
          },
        },
      }),
    );
    const deleteCartReturn = vi.fn().mockReturnValue({});

    when(deleteCartReturn).calledWith(stringContainingAll('deletedCartEntityId: 1')).thenReturn({});

    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(
          buildCompanyListWith({
            data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
          }),
        ),
      ),
      graphql.mutation('BeginMasquerade', ({ query }) => HttpResponse.json(beginMasquerade(query))),
      graphql.query('AgentInfo', ({ query }) => HttpResponse.json(getAgentInfo(query))),
      graphql.mutation('DeleteCart', ({ query }) => HttpResponse.json(deleteCartReturn(query))),
    );

    Cookies.set('cartId', '1');

    const setOpenPageSpy = vi.fn();

    const { store } = renderWithProviders(<Dashboard setOpenPage={setOpenPageSpy} />, {
      preloadedState: {
        ...preloadedState,
        global: buildGlobalStateWith({
          cartNumber: 1,
        }),
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const row = screen.getByRole('row', { name: /Acme Inc/ });

    await userEvent.click(within(row).getByRole('button'));
    await userEvent.click(screen.getByRole('menuitem', { name: /Masquerade/ }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));

    await waitFor(() => {
      expect(within(row).getByText(/Selected/)).toBeInTheDocument();
    });

    expect(store.getState().b2bFeatures.masqueradeCompany).toEqual({
      companyName: 'Acme Inc as returned from the AgentInfo query',
      customerGroupId: 42,
      id: '123',
      isAgenting: true,
    });

    expect(beginMasquerade).toHaveBeenLastCalledWith(expect.stringContaining('companyId: 123'));
    expect(getAgentInfo).toHaveBeenLastCalledWith(expect.stringContaining('customerId: 789'));

    expect(setOpenPageSpy).toHaveBeenLastCalledWith({
      isOpen: true,
      openUrl: '/dashboard',
    });
  });

  it('can end masquerade', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyId: 996,
        companyName: 'Acme Inc',
      },
    });

    const b2bFeaturesMasqueradingAcmeInc = buildB2BFeaturesStateWith({
      masqueradeCompany: {
        id: 996,
      },
    });

    const endMasquerade = vi.fn().mockReturnValue({});

    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(
          buildCompanyListWith({
            data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
          }),
        ),
      ),
      graphql.mutation('EndMasquerade', ({ query }) => HttpResponse.json(endMasquerade(query))),
    );

    const { store } = renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, b2bFeatures: b2bFeaturesMasqueradingAcmeInc },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const row = screen.getByRole('row', { name: /Acme Inc/ });

    expect(within(row).getByText(/Selected/)).toBeInTheDocument();

    await userEvent.click(within(row).getByRole('button'));
    await userEvent.click(screen.getByRole('menuitem', { name: /End Masquerade/ }));

    await waitFor(() => {
      expect(within(row).queryByText(/Selected/)).not.toBeInTheDocument();
    });

    expect(endMasquerade).toHaveBeenLastCalledWith(expect.stringContaining('companyId: 996'));

    expect(store.getState().b2bFeatures.masqueradeCompany).toEqual({
      companyName: '',
      customerGroupId: 0,
      id: 0,
      isAgenting: false,
    });
  });

  describe('when the user has no associated companies', () => {
    const emptyCompanyList = buildCompanyListWith({
      data: { superAdminCompanies: { edges: [], totalCount: 0 } },
    });

    it('displays a message of -no data- and the table is not present', async () => {
      server.use(graphql.query('SuperAdminCompanies', () => HttpResponse.json(emptyCompanyList)));

      renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

      await waitFor(() => {
        expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/No data/)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});

describe('when the user is a personal customer', () => {
  // we might want to disable the page altogether
  it('displays a message of -no data- and the table is not present', async () => {
    const personalCustomer = buildCompanyStateWith({
      customer: {
        b2bId: undefined,
      },
    });

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, {
      preloadedState: { company: personalCustomer },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No data/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
