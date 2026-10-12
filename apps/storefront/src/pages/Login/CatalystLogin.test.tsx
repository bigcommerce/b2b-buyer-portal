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
import { FeatureFlags } from '@/utils/featureFlags';

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
  featureFlags?: FeatureFlags;
  b2bToken?: string;
  role?: CustomerRole;
  initialEntries?: string[];
}

const renderCatalystLogin = ({
  featureFlags = {},
  b2bToken = '',
  role = CustomerRole.GUEST,
  initialEntries = ['/login'],
}: RenderOptions = {}) =>
  renderWithProviders(<CatalystLogin />, {
    preloadedState: {
      company: buildCompanyStateWith({ customer: { role }, tokens: { B2BToken: b2bToken } }),
      global: buildGlobalStateWith({ featureFlags }),
      b2bFeatures: buildB2BFeaturesStateWith({ masqueradeCompany: { isAgenting: false } }),
    },
    initialEntries,
  });

const flagOn = { [WAIT_FOR_SESSION_FLAG]: true };
const flagOff = { [WAIT_FOR_SESSION_FLAG]: false };

const loggedOut = () => window.b2b.callbacks.dispatchEvent as ReturnType<typeof vi.fn>;

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
    renderCatalystLogin({ featureFlags: flagOn, b2bToken: 'token', role: CustomerRole.ADMIN });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/orders'));
    expect(loggedOut()).not.toHaveBeenCalled();
  });

  it('waits the grace window and then logs out when the session never resolves (flag on)', async () => {
    vi.useFakeTimers();
    renderCatalystLogin({ featureFlags: flagOn, b2bToken: '', role: CustomerRole.GUEST });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GRACE_MS);
    });

    expect(loggedOut()).toHaveBeenCalledWith('on-logout');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate on a bare token; logs out if the customer never resolves (flag on)', async () => {
    vi.useFakeTimers();
    renderCatalystLogin({ featureFlags: flagOn, b2bToken: 'token', role: CustomerRole.GUEST });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GRACE_MS);
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/orders');
    expect(loggedOut()).toHaveBeenCalledWith('on-logout');
  });

  it('logs out immediately on an explicit logout request', async () => {
    renderCatalystLogin({
      featureFlags: flagOn,
      role: CustomerRole.ADMIN,
      b2bToken: 'token',
      initialEntries: ['/login?loginFlag=loggedOutLogin'],
    });

    await waitFor(() => expect(loggedOut()).toHaveBeenCalledWith('on-logout'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('logs out on sight when no token is present and the flag is off (previous behaviour)', async () => {
    renderCatalystLogin({ featureFlags: flagOff, b2bToken: '', role: CustomerRole.GUEST });

    await waitFor(() => expect(loggedOut()).toHaveBeenCalledWith('on-logout'));
  });

  it('does not log out before the feature flag has loaded', async () => {
    // featureFlags is empty -> flag key absent -> "not loaded yet", not "off"
    renderCatalystLogin({ featureFlags: {}, b2bToken: '', role: CustomerRole.GUEST });

    await act(async () => {
      await Promise.resolve();
    });

    expect(loggedOut()).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
