import { useParams } from 'react-router-dom';
import {
  buildCompanyStateWith,
  buildGlobalStateWith,
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

import Payment from '.';

vitest.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: vitest.fn(),
}));

const { server } = startMockServer();

describe('when the user is logged in', () => {
  const loggedInUser = buildCompanyStateWith({ tokens: { B2BToken: faker.string.uuid() } });

  beforeEach(() => {
    window.location.assign('/invoice');

    window.URL.createObjectURL = vi.fn();
  });

  describe('when rendered in stencil', () => {
    const globalStencil = buildGlobalStateWith({ storeInfo: { platform: 'bigcommerce' } });

    it('navigates to checkout to pay for the invoice', async () => {
      const getInvoiceDetails = vi.fn();
      const getCreateCartResponse = vi.fn();

      vi.mocked(useParams).mockReturnValue({ id: '3344' });

      server.use(
        graphql.query('GetInvoiceDetails', ({ query }) =>
          HttpResponse.json(getInvoiceDetails(query)),
        ),
        graphql.mutation('CreateCart', ({ query }) =>
          HttpResponse.json(getCreateCartResponse(query)),
        ),
      );

      when(getInvoiceDetails)
        .calledWith(stringContainingAll('invoiceId: 3344'))
        .thenReturn({ data: { invoice: { openBalance: { code: 'USD', value: '433' } } } });

      when(getCreateCartResponse)
        .calledWith(stringContainingAll('{invoiceId: 3344, amount: "433" }', 'currency: "USD"'))
        .thenReturn({
          data: {
            invoiceCreateBcCart: {
              result: {
                cartId: 'foo-bar',
                checkoutUrl: 'https://testing.com/checkout?cartId=foo-bar',
              },
            },
          },
        });

      renderWithProviders(<Payment />, {
        preloadedState: { company: loggedInUser, global: globalStencil },
      });

      await waitFor(() => {
        expect(window.location.href).toEqual('https://testing.com/checkout?cartId=foo-bar');
      });
    });
  });

  describe('when rendered in catalyst', () => {
    const globalCatalyst = buildGlobalStateWith({ storeInfo: { platform: 'catalyst' } });

    it('navigates to checkout to pay for the invoice', async () => {
      const getInvoiceDetails = vi.fn();
      const getCreateCartResponse = vi.fn();

      vi.mocked(useParams).mockReturnValue({ id: '3344' });

      server.use(
        graphql.query('GetInvoiceDetails', ({ query }) =>
          HttpResponse.json(getInvoiceDetails(query)),
        ),
        graphql.mutation('CreateCart', ({ query }) =>
          HttpResponse.json(getCreateCartResponse(query)),
        ),
      );

      when(getInvoiceDetails)
        .calledWith(stringContainingAll('invoiceId: 3344'))
        .thenReturn({ data: { invoice: { openBalance: { code: 'USD', value: '433' } } } });

      when(getCreateCartResponse)
        .calledWith(stringContainingAll('{invoiceId: 3344, amount: "433" }', 'currency: "USD"'))
        .thenReturn({
          data: {
            invoiceCreateBcCart: {
              result: {
                cartId: 'foo-bar',
                checkoutUrl: 'https://testing.com/checkout?cartId=foo-bar',
              },
            },
          },
        });

      renderWithProviders(<Payment />, {
        preloadedState: { company: loggedInUser, global: globalCatalyst },
      });

      await waitFor(() => {
        expect(window.location.href).toEqual('http://localhost/checkout?cartId=foo-bar');
      });
    });
  });

  describe('when rendered in "other"', () => {
    const globalOther = buildGlobalStateWith({ storeInfo: { platform: 'other' } });

    it('navigates to checkout using a login-redirect link', async () => {
      const getInvoiceDetails = vi.fn();
      const getCheckoutLoginResponse = vi.fn();
      const getCreateCartResponse = vi.fn();

      vi.mocked(useParams).mockReturnValue({ id: '3344' });

      server.use(
        graphql.query('GetInvoiceDetails', ({ query }) =>
          HttpResponse.json(getInvoiceDetails(query)),
        ),
        graphql.mutation('CreateCart', ({ query }) =>
          HttpResponse.json(getCreateCartResponse(query)),
        ),
        graphql.mutation('checkoutLogin', ({ variables }) =>
          HttpResponse.json(getCheckoutLoginResponse(variables)),
        ),
      );

      when(getInvoiceDetails)
        .calledWith(stringContainingAll('invoiceId: 3344'))
        .thenReturn({ data: { invoice: { openBalance: { code: 'USD', value: '433' } } } });

      when(getCreateCartResponse)
        .calledWith(stringContainingAll('{invoiceId: 3344, amount: "433" }', 'currency: "USD"'))
        .thenReturn({
          data: {
            invoiceCreateBcCart: {
              result: { cartId: 'foo-bar', checkoutUrl: faker.internet.url() },
            },
          },
        });

      when(getCheckoutLoginResponse)
        .calledWith({ cartData: { cartId: 'foo-bar' } })
        .thenReturn({
          data: {
            checkoutLogin: {
              result: { redirectUrl: 'https://example.com/checkout?cartId=foo-bar' },
            },
          },
        });

      renderWithProviders(<Payment />, {
        preloadedState: { company: loggedInUser, global: globalOther },
      });

      await waitFor(() => {
        expect(window.location.href).toEqual('https://example.com/checkout?cartId=foo-bar');
      });
    });
  });

  it('shows an `invoice can not be blank error`', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '' });

    renderWithProviders(<Payment />, { preloadedState: { company: loggedInUser } });

    await waitFor(() => {
      expect(screen.getByText('The invoice cannot be blank')).toBeInTheDocument();
    });
  });

  it('shows any custom error message returned by the API', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '3344' });

    server.use(
      graphql.query('GetInvoiceDetails', () =>
        HttpResponse.json({ errors: [{ message: 'The bird is the word' }] }),
      ),
    );

    renderWithProviders(<Payment />, { preloadedState: { company: loggedInUser } });

    await waitFor(() => {
      expect(screen.getAllByText('The bird is the word')).toHaveLength(2);
    });
  });

  it('shows an `open balance is incorrect` error', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '3344' });

    server.use(
      graphql.query('GetInvoiceDetails', () =>
        HttpResponse.json({ data: { invoice: { openBalance: {} } } }),
      ),
    );

    renderWithProviders(<Payment />, { preloadedState: { company: loggedInUser } });

    await waitFor(() => {
      expect(
        screen.getByText('The invoice openBalance code or value is incorrect'),
      ).toBeInTheDocument();
    });
  });
});

describe('when the user is not logged in', () => {
  const loggedOutUser = buildCompanyStateWith({ tokens: { B2BToken: '' } });

  it('shows a modal and navigates to login if B2BToken is not present', async () => {
    vi.mocked(useParams).mockReturnValue({ id: '3344' });

    const { navigation } = renderWithProviders(<Payment />, {
      preloadedState: { company: loggedOutUser },
    });

    expect(screen.getByText('Please log in first and pay the invoice,')).toBeInTheDocument();
    expect(screen.getByText('Click ok to go to the landing page')).toBeInTheDocument();

    const loginButton = screen.getByRole('button', { name: 'ok' });
    await userEvent.click(loginButton);

    expect(navigation).toHaveBeenCalledWith('/login');
  });
});
