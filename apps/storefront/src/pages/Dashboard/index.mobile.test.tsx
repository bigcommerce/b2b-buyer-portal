import Cookies from 'js-cookie';
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
} from 'tests/test-utils';
import { when } from 'vitest-when';

import { AgentInfo, Company, CompanyEdge } from '@/shared/service/b2b/graphql/global';
import { CompanyStatus } from '@/types';

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

beforeEach(() => {
  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(500);
});

describe('when the user is associated with a company', () => {
  const companyWithB2B = buildCompanyStateWith({
    customer: {
      id: 789,
      b2bId: 882288,
    },
  });

  const preloadedState = Object.freeze({ company: companyWithB2B });

  it('lists all the companies associated with the user', async () => {
    const acmeInc = buildCompanyEdgeWith({ node: { companyName: 'Acme Inc' } });
    const wayneIndustries = buildCompanyEdgeWith({ node: { companyName: 'Wayne Industries' } });

    const companyList = buildCompanyListWith({
      data: { superAdminCompanies: { edges: [acmeInc, wayneIndustries], totalCount: 2 } },
    });

    const getCompanies = vi.fn().mockReturnValue(companyList);

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Acme Inc/)).toBeInTheDocument();
    expect(screen.getByText(/Wayne Industries/)).toBeInTheDocument();

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('superAdminId: 882288'));
  });

  it('lists all the details for companies associated with the user', async () => {
    const acmeInc = buildCompanyEdgeWith({
      node: {
        companyName: 'Acme Inc',
        companyEmail: 'info@acme.com',
      },
    });

    const companyList = buildCompanyListWith({
      data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
    });

    const getCompanies = vi.fn().mockReturnValue(companyList);

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Acme Inc/)).toBeInTheDocument();
    expect(screen.getByText(/info@acme.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masquerade/ })).toBeInTheDocument();

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('superAdminId: 882288'));
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

    const monstersInc = buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [monstersInc], totalCount: 1 } },
      }),
    );

    const searchBox = screen.getByPlaceholderText(/Search/);

    await userEvent.type(searchBox, 'monsters');

    await waitFor(() => {
      expect(screen.getByText(/Monsters Inc/)).toBeInTheDocument();
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('search: "monsters"'));
  });

  it('allows user to change the number of rows per page', async () => {
    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: bulk(buildCompanyEdgeWith, 'WHATEVER_VALUES').times(10),
          },
        },
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
            edges: bulk(buildCompanyEdgeWith, 'WHATEVER_VALUES').times(20),
          },
        },
      }),
    );

    const rowsPerPageSelect = screen.getByRole('combobox', { name: /per page:/ });

    await userEvent.click(rowsPerPageSelect);

    const option = screen.getByRole('option', { name: '20' });

    await userEvent.click(option);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Masquerade/ })).toHaveLength(20);
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('first: 20'));
  });

  it('can go to the next page', async () => {
    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: bulk(buildCompanyEdgeWith, 'WHATEVER_VALUES').times(10),
            totalCount: 100,
          },
        },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const monstersInc = buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [monstersInc], totalCount: 100 } },
      }),
    );

    const nextPageButton = screen.getByRole('button', { name: /Go to next page/ });

    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(screen.getByText(/Monsters Inc/)).toBeInTheDocument();
    });

    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('offset: 10'));
    expect(getCompanies).toHaveBeenLastCalledWith(expect.stringContaining('first: 10'));
  });

  it('can go to the previous page', async () => {
    const getCompanies = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: {
          superAdminCompanies: {
            edges: bulk(buildCompanyEdgeWith, 'WHATEVER_VALUES').times(10),
            totalCount: 100,
          },
        },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
    );

    renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    const nextPageButton = screen.getByRole('button', { name: /Go to next page/ });

    await userEvent.click(nextPageButton);

    const monstersInc = buildCompanyEdgeWith({ node: { companyName: 'Monsters Inc' } });

    getCompanies.mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [monstersInc], totalCount: 100 } },
      }),
    );

    const prevPageButton = screen.getByRole('button', { name: /Go to previous page/ });

    await userEvent.click(prevPageButton);

    await waitFor(() => {
      expect(screen.getByText(/Monsters Inc/)).toBeInTheDocument();
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

    const getCompanyList = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
      }),
    );

    const masqueradingAgentInfo = buildAgentInfoWith({
      data: {
        superAdminMasquerading: {
          id: '123',
          customerGroupId: 42,
          companyName: 'Foo Bar',
        },
      },
    });

    const beginMasquerade = vi.fn().mockReturnValue({});
    const getAgentInfo = vi.fn().mockReturnValue(masqueradingAgentInfo);
    const deleteCartReturn = vi.fn().mockReturnValue({});

    when(deleteCartReturn).calledWith(stringContainingAll('deletedCartEntityId: 1')).thenReturn({});

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanyList(query))),
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

    await userEvent.click(screen.getByRole('button', { name: /Masquerade/ }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));

    await waitFor(() => {
      expect(screen.getByText(/Selected/)).toBeInTheDocument();
    });

    expect(store.getState().b2bFeatures.masqueradeCompany).toEqual({
      companyName: 'Foo Bar',
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

    const endMasquerade = vi.fn().mockReturnValue({});
    const getCompanyList = vi.fn().mockReturnValue(
      buildCompanyListWith({
        data: { superAdminCompanies: { edges: [acmeInc], totalCount: 1 } },
      }),
    );

    server.use(
      graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanyList(query))),
      graphql.mutation('EndMasquerade', ({ query }) => HttpResponse.json(endMasquerade(query))),
    );

    const b2bFeaturesMasqueradingAcmeInc = buildB2BFeaturesStateWith({
      masqueradeCompany: {
        id: 996,
      },
    });

    const { store } = renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, {
      preloadedState: { ...preloadedState, b2bFeatures: b2bFeaturesMasqueradingAcmeInc },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Selected/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /End Masquerade/ }));

    await waitFor(() => {
      expect(screen.queryByText(/Selected/)).not.toBeInTheDocument();
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
    it('displays a message of -no data-', async () => {
      const getCompanies = vi.fn().mockReturnValue(
        buildCompanyListWith({
          data: { superAdminCompanies: { edges: [], totalCount: 0 } },
        }),
      );

      server.use(
        graphql.query('SuperAdminCompanies', ({ query }) => HttpResponse.json(getCompanies(query))),
      );

      renderWithProviders(<Dashboard setOpenPage={vi.fn()} />, { preloadedState });

      await waitFor(() => {
        expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/No data/)).toBeInTheDocument();
    });
  });
});

describe('when the user is a personal customer', () => {
  // we might want to disable the page altogether
  it('displays a message of -no data-', async () => {
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
  });
});
