import {
  act,
  buildB2BFeaturesStateWith,
  buildCompanyStateWith,
  buildGlobalStateWith,
  renderWithProviders,
  startMockServer,
  waitFor,
} from 'tests/test-utils';

import { bcLogoutLogin } from '@/shared/service/bc';
import { CustomerRole } from '@/types';

import { CatalystLogin } from './CatalystLogin';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/shared/service/bc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/bc')>()),
  bcLogoutLogin: vi.fn(),
}));

startMockServer();

const WAIT_FOR_SESSION_FLAG = 'B2B-5408.catalyst_login_wait_for_session';
const GRACE_MS = 3000;

interface RenderOptions {
  flagOn?: boolean;
  b2bToken?: string;
  role?: CustomerRole;
  initialEntries?: string[];
}

const renderCatalystLogin = ({
  flagOn = false,
  b2bToken = '',
  role = CustomerRole.GUEST,
  initialEntries = ['/login'],
}: RenderOptions = {}) =>
  renderWithProviders(<CatalystLogin />, {
    preloadedState: {
      company: buildCompanyStateWith({ customer: { role }, tokens: { B2BToken: b2bToken } }),
      global: buildGlobalStateWith({ featureFlags: { [WAIT_FOR_SESSION_FLAG]: flagOn } }),
      b2bFeatures: buildB2BFeaturesStateWith({ masqueradeCompany: { isAgenting: false } }),
    },
    initialEntries,
  });

describe('CatalystLogin', () => {
  beforeEach(() => {
    window.b2b = { callbacks: { dispatchEvent: vi.fn() } } as unknown as typeof window.b2b;
    vi.mocked(bcLogoutLogin).mockResolvedValue({
      data: { logout: { result: 'success' } },
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enters the app when the session is already resolved (flag on)', async () => {
    renderCatalystLogin({ flagOn: true, b2bToken: 'token', role: CustomerRole.ADMIN });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/orders'));
    expect(window.b2b.callbacks.dispatchEvent).not.toHaveBeenCalled();
  });

  it('waits the grace window and then logs out when the session never resolves (flag on)', async () => {
    vi.useFakeTimers();
    renderCatalystLogin({ flagOn: true, b2bToken: '', role: CustomerRole.GUEST });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GRACE_MS);
    });

    expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-logout');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('enters the app if the token arrives while waiting, instead of logging out (flag on)', async () => {
    vi.useFakeTimers();
    renderCatalystLogin({ flagOn: true, b2bToken: 'token', role: CustomerRole.GUEST });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GRACE_MS);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/orders');
    expect(window.b2b.callbacks.dispatchEvent).not.toHaveBeenCalled();
  });

  it('logs out immediately on an explicit logout request', async () => {
    renderCatalystLogin({
      flagOn: true,
      role: CustomerRole.ADMIN,
      b2bToken: 'token',
      initialEntries: ['/login?loginFlag=loggedOutLogin'],
    });

    await waitFor(() =>
      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-logout'),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('logs out on sight when no token is present and the flag is off (previous behaviour)', async () => {
    renderCatalystLogin({ flagOn: false, b2bToken: '', role: CustomerRole.GUEST });

    await waitFor(() =>
      expect(window.b2b.callbacks.dispatchEvent).toHaveBeenCalledWith('on-logout'),
    );
  });
});
