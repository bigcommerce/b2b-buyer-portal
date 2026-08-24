import { when } from 'vitest-when';

import { gotoAllowedAppPage } from '@/shared/routes';
import { setChannelStoreType } from '@/shared/service/b2b';
import { store } from '@/store';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { resolveInitNavigation } from '@/utils/resolveInitNavigation';

import b2bVerifyBcLoginStatus from './b2bVerifyBcLoginStatus';
import clearInvoiceCart from './b3ClearCart';
import b2bLogger from './b3Logger';
import { CompanyError } from './companyUtils';
import { initializeApp } from './initializeApp';
import { ensureBcGraphqlToken, getCompanyInfo, getCurrentCustomerInfo } from './loginInfo';
import { logoutSession } from './logoutSession';
import { getGlobalStoreTax, getStoreConfigs, setStorefrontConfig } from './storefrontConfig';
import { getStoreSettings } from './storefrontSettings';

vi.mock('./b2bVerifyBcLoginStatus', () => ({ default: vi.fn() }));
vi.mock('./b3ClearCart', () => ({ default: vi.fn() }));
vi.mock('./b3Logger', () => ({ default: { error: vi.fn() } }));
vi.mock('./logoutSession', () => ({ logoutSession: vi.fn() }));
vi.mock('./loginInfo', () => ({
  ensureBcGraphqlToken: vi.fn(),
  getCompanyInfo: vi.fn(),
  getCurrentCustomerInfo: vi.fn(),
}));
vi.mock('./storefrontConfig', () => ({
  getGlobalStoreTax: vi.fn(),
  getStoreConfigs: vi.fn(),
  setStorefrontConfig: vi.fn(),
}));
vi.mock('./storefrontSettings', () => ({ getStoreSettings: vi.fn() }));
vi.mock('@/shared/routes', () => ({ gotoAllowedAppPage: vi.fn() }));
vi.mock('@/shared/service/b2b', () => ({ setChannelStoreType: vi.fn() }));
vi.mock('@/utils/resolveInitNavigation', () => ({ resolveInitNavigation: vi.fn() }));

const mockState = (featureFlags: Record<string, boolean> = {}) =>
  vi.spyOn(store, 'getState').mockReturnValue({
    company: {
      customer: { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
      companyInfo: { status: CompanyStatus.APPROVED },
    },
    global: { featureFlags },
  } as unknown as ReturnType<typeof store.getState>);

const baseParams = () => ({
  customerId: '' as number | string,
  role: CustomerRole.GUEST,
  b2bId: undefined,
  isAgenting: false,
  pathname: '/orders',
  search: '',
  gotoPage: vi.fn(),
  showPageMask: vi.fn(),
  dispatch: vi.fn(),
  styleDispatch: vi.fn(),
  storeDispatch: vi.fn(),
});

describe('initializeApp', () => {
  beforeEach(() => {
    mockState();
    vi.spyOn(store, 'dispatch').mockImplementation(() => undefined as never);

    // defaults; tests override what they care about
    vi.mocked(b2bVerifyBcLoginStatus).mockResolvedValue(true);
    vi.mocked(ensureBcGraphqlToken).mockResolvedValue(undefined);
    vi.mocked(getCompanyInfo).mockResolvedValue({
      id: '',
      companyName: '',
      companyStatus: CompanyStatus.DEFAULT,
    });
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue(undefined);
    vi.mocked(getGlobalStoreTax).mockResolvedValue(undefined);
    vi.mocked(getStoreConfigs).mockResolvedValue(undefined);
    vi.mocked(setStorefrontConfig).mockResolvedValue(undefined);
    vi.mocked(getStoreSettings).mockResolvedValue(undefined);
    vi.mocked(gotoAllowedAppPage).mockResolvedValue(undefined);
    vi.mocked(resolveInitNavigation).mockReturnValue({ type: 'mask' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls getCurrentCustomerInfo before setStorefrontConfig on a fresh login', async () => {
    const callOrder: string[] = [];
    vi.mocked(getCurrentCustomerInfo).mockImplementation(async () => {
      callOrder.push('getCurrentCustomerInfo');
      return { role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C } as never;
    });
    vi.mocked(setStorefrontConfig).mockImplementation(async () => {
      callOrder.push('setStorefrontConfig');
    });

    const result = await initializeApp({ ...baseParams(), customerId: '' });

    expect(callOrder).toEqual(['getCurrentCustomerInfo', 'setStorefrontConfig']);
    expect(result).toEqual({ completed: true });
  });

  it('clears the invoice cart after a fresh login resolves the customer id', async () => {
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
      role: CustomerRole.SENIOR_BUYER,
      userType: UserTypes.MULTIPLE_B2C,
    } as never);
    vi.spyOn(store, 'getState').mockReturnValue({
      company: {
        customer: { id: 123, role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
        companyInfo: { status: CompanyStatus.APPROVED },
      },
      global: { featureFlags: {} },
    } as unknown as ReturnType<typeof store.getState>);

    await initializeApp({ ...baseParams(), customerId: '' });

    expect(clearInvoiceCart).toHaveBeenCalled();
  });

  it('returns the internally-resolved customerId, not the empty param, on a fresh login', async () => {
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
      role: CustomerRole.SENIOR_BUYER,
      userType: UserTypes.MULTIPLE_B2C,
    } as never);
    vi.spyOn(store, 'getState').mockReturnValue({
      company: {
        customer: { id: 123, role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
        companyInfo: { status: CompanyStatus.APPROVED },
      },
      global: { featureFlags: {} },
    } as unknown as ReturnType<typeof store.getState>);

    const result = await initializeApp({ ...baseParams(), customerId: '' });

    // App.tsx's init guard compares this against the live customerId to decide
    // whether a later login/logout should retrigger init, so it must reflect
    // what actually got dispatched, not the stale param.
    expect(result).toEqual({ completed: true, resolvedCustomerId: 123 });
  });

  it('does not treat a freshly-resolved login as a guest when deciding whether to open the portal', async () => {
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
      role: CustomerRole.SENIOR_BUYER,
      userType: UserTypes.MULTIPLE_B2C,
    } as never);
    vi.spyOn(store, 'getState').mockReturnValue({
      company: {
        customer: { id: 123, role: CustomerRole.SENIOR_BUYER, userType: UserTypes.MULTIPLE_B2C },
        companyInfo: { status: CompanyStatus.APPROVED },
      },
      global: { featureFlags: {} },
    } as unknown as ReturnType<typeof store.getState>);
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '' },
      writable: true,
    });

    await initializeApp({ ...baseParams(), customerId: '' });

    expect(resolveInitNavigation).toHaveBeenCalledWith(
      expect.objectContaining({ shouldOpenAllowedPage: false }),
    );
  });

  it('does not resolve customer identity when a customerId is already present', async () => {
    const result = await initializeApp({ ...baseParams(), customerId: 123 });

    expect(getCurrentCustomerInfo).not.toHaveBeenCalled();
    expect(clearInvoiceCart).toHaveBeenCalled();
    expect(result).toEqual({ completed: true, resolvedCustomerId: 123 });
  });

  it('logs out and reports incomplete when the rehydrated BC session is no longer valid', async () => {
    vi.mocked(b2bVerifyBcLoginStatus).mockResolvedValue(false);
    const params = baseParams();

    const result = await initializeApp({ ...params, customerId: 123 });

    expect(logoutSession).toHaveBeenCalled();
    expect(params.showPageMask).toHaveBeenCalledWith(false);
    expect(getCurrentCustomerInfo).not.toHaveBeenCalled();
    expect(result).toEqual({ completed: false });
  });

  it('reports incomplete and marks the page complete when initialization throws', async () => {
    const error = new Error('network error');
    vi.mocked(getStoreConfigs).mockRejectedValue(error);
    const params = baseParams();

    const result = await initializeApp(params);

    expect(b2bLogger.error).toHaveBeenCalledWith(error);
    expect(params.showPageMask).toHaveBeenCalledWith(false);
    expect(params.storeDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ isPageComplete: true }) }),
    );
    expect(result).toEqual({ completed: false });
  });

  it('navigates using the URL resolveInitNavigation returns', async () => {
    vi.mocked(resolveInitNavigation).mockReturnValue({ type: 'goto', url: '/login' });
    const params = baseParams();

    await initializeApp({ ...params, customerId: 123 });

    expect(params.gotoPage).toHaveBeenCalledWith('/login');
  });

  it('opens the allowed app page when resolveInitNavigation signals allowedAppPage', async () => {
    vi.mocked(resolveInitNavigation).mockReturnValue({ type: 'allowedAppPage' });
    const params = baseParams();

    await initializeApp({ ...params, customerId: 123, role: CustomerRole.SENIOR_BUYER });

    expect(gotoAllowedAppPage).toHaveBeenCalledWith(
      CustomerRole.SENIOR_BUYER,
      params.gotoPage,
      false,
    );
  });

  it('calls setChannelStoreType and the parallel config fetches during a normal run', async () => {
    await initializeApp(baseParams());

    expect(setChannelStoreType).toHaveBeenCalled();
    expect(getGlobalStoreTax).toHaveBeenCalled();
    expect(getStoreSettings).toHaveBeenCalled();
    expect(getCompanyInfo).toHaveBeenCalled();
    expect(ensureBcGraphqlToken).toHaveBeenCalled();
  });

  it('propagates the reason from a company-status login error to resolveInitNavigation', async () => {
    when(vi.mocked(getCurrentCustomerInfo))
      .calledWith()
      .thenDo(async () => {
        throw new CompanyError({ message: 'pending', reason: 'pendingApprovalToOrder' });
      });

    await initializeApp({ ...baseParams(), customerId: '' });

    expect(resolveInitNavigation).toHaveBeenCalledWith(
      expect.objectContaining({ companyLoginFlag: 'pendingApprovalToOrder' }),
    );
  });
});
