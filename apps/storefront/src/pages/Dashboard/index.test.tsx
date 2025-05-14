import { buildB2BFeaturesStateWith } from 'tests/storeStateBuilders/b2bFeaturesStateBuilder';
import {
  buildCompanyStateWith,
  builder,
  bulk,
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

import { AgentInfo, Company, CompanyEdge } from '@/shared/service/b2b/graphql/global';

import Dashboard from '.';

const { server } = startMockServer();

const buildCompanyEdgeWith = builder<CompanyEdge>(() => ({
  node: {
    id: faker.string.uuid(),
    companyId: faker.number.int({ min: 1, max: 100 }),
    companyName: faker.company.name(),
    companyEmail: faker.internet.email(),
  },
}));

const buildCompanyListWith = builder<Company>(() => ({
  data: {
    superAdminCompanies: {
      edges: bulk(buildCompanyEdgeWith, 'WHATEVER_VALUES').times(10),
      totalCount: 10,
    },
  },
}));

const buildAgentInfoWith = builder<AgentInfo>(() => ({
  data: {
    superAdminMasquerading: {
      companyName: faker.company.name(),
      bcGroupName: faker.string.uuid(),
      customerGroupId: faker.number.int({ min: 1, max: 100 }),
      companyStatus: faker.number.int({ min: 1, max: 3 }),
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

  it('displays a table with headings for each key attribute of a company', async () => {
    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(buildCompanyListWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    const table = await screen.findByRole('table');

    expect(within(table).getByRole('columnheader', { name: /company/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /action/i })).toBeInTheDocument();
  });

  it('lists all the companies associated with the user', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyName: 'Acme Inc',
        companyEmail: 'info@acme.com',
      },
    });

    const wayneIndustries = buildCompanyEdgeWith({
      node: {
        companyName: 'Wayne Industries',
      },
    });

    const companyList = buildCompanyListWith({
      data: { superAdminCompanies: { edges: [acmeInc, wayneIndustries], totalCount: 2 } },
    });

    const fetchCompanies = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => {
        fetchCompanies(query);

        return HttpResponse.json(companyList);
      }),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Acme Inc/i });

    expect(within(row).getByRole('cell', { name: /Acme Inc/i })).toBeInTheDocument();
    expect(within(row).getByRole('cell', { name: /info@acme.com/i })).toBeInTheDocument();

    const actionMenu = within(row).getByRole('button');

    await userEvent.click(actionMenu);

    expect(screen.getByRole('menuitem', { name: /masquerade/i })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    screen.getByRole('row', { name: /Wayne Industries/i });

    expect(fetchCompanies).toHaveBeenCalledWith(expect.stringContaining('superAdminId: 882288'));
  });

  it('sorts the list by company by default', async () => {
    const fetchCompanies = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => {
        fetchCompanies(query);

        return HttpResponse.json(buildCompanyListWith('WHATEVER_VALUES'));
      }),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    const companyColumnHeader = await screen.findByRole('columnheader', { name: /company/i });

    expect(companyColumnHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(fetchCompanies).toHaveBeenCalledWith(expect.stringContaining('orderBy: "companyName"'));
  });

  it('allows users to search', async () => {
    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(buildCompanyListWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });
    const searchCompanies = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => {
        searchCompanies(query);
      }),
    );

    const searchBox = await screen.findByPlaceholderText(/search/i);

    await userEvent.type(searchBox, 'foo bar');

    await waitFor(() => {
      expect(searchCompanies).toHaveBeenCalledWith(expect.stringContaining('search: "foo bar"'));
    });
  });

  it('allows user to sort the list', async () => {
    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(buildCompanyListWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });
    const sortCompanies = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => {
        sortCompanies(query);
      }),
    );

    const companyColumnHeader = await screen.findByRole('columnheader', { name: /company/i });
    const emailColumnHeader = await screen.findByRole('columnheader', { name: /email/i });

    await userEvent.click(within(emailColumnHeader).getByRole('button'));

    expect(emailColumnHeader).toHaveAttribute('aria-sort', 'descending');
    expect(companyColumnHeader).not.toHaveAttribute('aria-sort');

    expect(sortCompanies).toHaveBeenCalledWith(expect.stringContaining('orderBy: "-companyEmail"'));
  });

  it('allows user to change the number of rows per page', async () => {
    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(buildCompanyListWith('WHATEVER_VALUES')),
      ),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    const rowsPerPage = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => {
        rowsPerPage(query);
      }),
    );

    const rowsPerPageSelect = await screen.findByRole('combobox', { name: /rows per page/i });

    await userEvent.click(rowsPerPageSelect);

    const option = screen.getByRole('option', { name: '20' });

    await userEvent.click(option);

    expect(rowsPerPage).toHaveBeenCalledWith(expect.stringContaining('first: 20'));
  });

  it('allows user to change the page', async () => {
    server.use(
      graphql.query('SuperAdminCompanies', () =>
        HttpResponse.json(
          buildCompanyListWith({
            data: { superAdminCompanies: { totalCount: 100 } },
          }),
        ),
      ),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });
    const changePage = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => {
        changePage(query);
      }),
    );

    const nextPageButton = await screen.findByRole('button', { name: /next page/i });
    await userEvent.click(nextPageButton);

    expect(changePage).toHaveBeenCalledWith(expect.stringContaining('offset: 10'));
    expect(changePage).toHaveBeenCalledWith(expect.stringContaining('first: 10'));

    changePage.mockClear();

    const prevPage = await screen.findByRole('button', { name: /previous page/i });
    await userEvent.click(prevPage);

    expect(changePage).toHaveBeenCalledWith(expect.stringContaining('offset: 0'));
    expect(changePage).toHaveBeenCalledWith(expect.stringContaining('first: 10'));
  });

  it('can masquerade a company', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyId: 123,
        companyName: 'Acme Inc',
      },
    });

    const companyList = buildCompanyListWith({
      data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
    });

    const masqueradingAgentInfo = buildAgentInfoWith({
      data: {
        superAdminMasquerading: {
          id: '123',
          customerGroupId: 42,
          companyName: 'Foo Bar',
        },
      },
    });

    const beginMasquerade = vi.fn();
    const getAgentInfo = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', () => HttpResponse.json(companyList)),
      graphql.mutation('BeginMasquerade', ({ query }) => {
        beginMasquerade(query);
        return HttpResponse.json({});
      }),
      graphql.query('AgentInfo', ({ query }) => {
        getAgentInfo(query);
        return HttpResponse.json(masqueradingAgentInfo);
      }),
    );

    const { store } = renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    const row = await screen.findByRole('row', { name: /Acme Inc/i });

    await userEvent.click(within(row).getByRole('button'));
    await userEvent.click(screen.getByRole('menuitem', { name: /masquerade/i }));

    await waitFor(() => {
      expect(within(row).getByText(/selected/i)).toBeInTheDocument();
    });

    expect(store.getState().b2bFeatures.masqueradeCompany).toEqual({
      companyName: 'Foo Bar',
      customerGroupId: 42,
      id: '123',
      isAgenting: true,
    });

    expect(beginMasquerade).toHaveBeenCalledWith(expect.stringContaining('companyId: 123'));
    expect(getAgentInfo).toHaveBeenCalledWith(expect.stringContaining('customerId: 789'));
  });

  it('can end masquerade', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyId: 996,
        companyName: 'Acme Inc',
      },
    });

    const companyList = buildCompanyListWith({
      data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
    });

    const b2bFeaturesMasqueradingAcmeInc = buildB2BFeaturesStateWith({
      masqueradeCompany: {
        id: 996,
      },
    });

    const endMasquerade = vi.fn();

    server.use(
      graphql.query('SuperAdminCompanies', () => {
        return HttpResponse.json(companyList);
      }),
      graphql.mutation('EndMasquerade', ({ query }) => {
        endMasquerade(query);
        return HttpResponse.json({});
      }),
    );

    const { store } = renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, b2bFeatures: b2bFeaturesMasqueradingAcmeInc },
    });

    const row = await screen.findByRole('row', { name: /Acme Inc/i });

    expect(within(row).getByText(/selected/i)).toBeInTheDocument();

    await userEvent.click(within(row).getByRole('button'));
    await userEvent.click(screen.getByRole('menuitem', { name: /end masquerade/i }));

    await waitFor(() => {
      expect(within(row).queryByText(/selected/i)).not.toBeInTheDocument();
    });

    expect(endMasquerade).toHaveBeenCalledWith(expect.stringContaining('companyId: 996'));

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

    it('a -no data- message is shown and the table is not present', async () => {
      server.use(graphql.query('SuperAdminCompanies', () => HttpResponse.json(emptyCompanyList)));

      renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

      expect(await screen.findByText(/no data/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});

describe('when the user is a personal customer', () => {
  // we might want to disable the page altogether
  it('a -no data- message is shown and the table is not present', async () => {
    const personalCustomer = buildCompanyStateWith({
      customer: {
        b2bId: undefined,
      },
    });

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, {
      preloadedState: { company: personalCustomer },
    });

    expect(await screen.findByText(/no data/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
