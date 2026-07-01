import { graphql, HttpResponse, startMockServer } from 'tests/test-utils';

import * as b2bService from '@/shared/service/b2b';
import * as bcService from '@/shared/service/bc';
import { store } from '@/store';
import { setBcGraphQLToken, setPermissionModules } from '@/store/slices/company';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { snackbar } from '@/utils/b3Tip';
import { CompanyError } from '@/utils/companyUtils';

import b2bLogger from './b3Logger';
import { ensureBcGraphqlToken, getCurrentCustomerInfo } from './loginInfo';

const { server } = startMockServer();

const BC_AUTH_FLAG = 'PROJECT-7920.use_bc_login_and_authorisation';
// keeps the account-hierarchy branch (and its extra requests) out of the path under test
const COMBINED_QUERY_FLAG = 'B2B-3817.disable_masquerading_cleanup_on_login';

const QUERY_PERMISSIONS = [{ code: 'get_orders', permissionLevel: 2 }];
const BC_PERMISSIONS = [
  { code: 'get_invoices', permissionLevel: 2 },
  { code: 'create_quote', permissionLevel: 1 },
];

const mockState = (featureFlags: Record<string, boolean>, currentCustomerJWT = 'bc-jwt') =>
  vi.spyOn(store, 'getState').mockReturnValue({
    company: { tokens: { B2BToken: 'b2b-token', currentCustomerJWT } },
    global: { featureFlags },
  } as unknown as ReturnType<typeof store.getState>);

const permissionsWereDispatched = () =>
  vi
    .mocked(store.dispatch)
    .mock.calls.some(
      ([action]) => (action as { type?: string }).type === setPermissionModules([]).type,
    );

const stubServices = () => {
  vi.spyOn(bcService, 'getCustomerInfo').mockResolvedValue({
    data: {
      customer: {
        entityId: '123',
        phone: '555-0100',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'first.last@example.com',
        customerGroupId: 0,
      },
    },
  } as never);

  vi.spyOn(b2bService, 'getB2BCompanyUserInfo').mockResolvedValue({
    customerInfo: {
      userType: UserTypes.MULTIPLE_B2C,
      userInfo: { role: CustomerRole.SENIOR_BUYER, id: 456, companyRoleName: 'Senior Buyer' },
    },
  } as never);

  vi.spyOn(b2bService, 'getUserCompany').mockResolvedValue({
    userCompany: { id: '79', companyName: 'Acme', companyStatus: CompanyStatus.APPROVED },
  } as never);

  vi.spyOn(b2bService, 'b2bAuthorization').mockResolvedValue({
    authorization: { result: { permissions: BC_PERMISSIONS } },
  } as never);
};

describe('getCurrentCustomerInfo permissions source', () => {
  beforeEach(() => {
    vi.spyOn(store, 'dispatch').mockImplementation(() => undefined as never);
    vi.spyOn(b2bLogger, 'error').mockImplementation(() => undefined);
    stubServices();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sources permissions from b2bAuthorization when the BC login flag is on', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true });

    const result = await getCurrentCustomerInfo();

    // the customer-info query is asked to skip the permissions selection
    expect(b2bService.getB2BCompanyUserInfo).toHaveBeenCalledWith(true);
    expect(b2bService.b2bAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({ bcToken: 'bc-jwt' }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules(BC_PERMISSIONS));
    expect(result).toEqual({
      role: CustomerRole.SENIOR_BUYER,
      userType: UserTypes.MULTIPLE_B2C,
      companyRoleName: 'Senior Buyer',
    });
  });

  it('sources permissions from the customer-info query when the BC login flag is off', async () => {
    mockState({ [COMBINED_QUERY_FLAG]: true });

    vi.spyOn(b2bService, 'getB2BCompanyUserInfo').mockResolvedValue({
      customerInfo: {
        userType: UserTypes.MULTIPLE_B2C,
        userInfo: { role: CustomerRole.SENIOR_BUYER, id: 456, companyRoleName: 'Senior Buyer' },
        permissions: QUERY_PERMISSIONS,
      },
    } as never);

    await getCurrentCustomerInfo();

    expect(b2bService.getB2BCompanyUserInfo).toHaveBeenCalledWith(false);
    expect(b2bService.b2bAuthorization).not.toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules(QUERY_PERMISSIONS));
  });

  it('dispatches an empty permission set when b2bAuthorization fails', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true });
    vi.spyOn(b2bService, 'b2bAuthorization').mockRejectedValue(new Error('network'));

    await getCurrentCustomerInfo();

    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules([]));
  });

  it('preserves already-loaded permissions when no customer JWT is available', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true }, '');
    vi.spyOn(bcService, 'getCurrentCustomerJWT').mockResolvedValue('');

    await getCurrentCustomerInfo();

    expect(b2bService.b2bAuthorization).not.toHaveBeenCalled();
    expect(permissionsWereDispatched()).toBe(false);
  });

  it('dispatches an empty permission set when b2bAuthorization returns one', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true });
    vi.spyOn(b2bService, 'b2bAuthorization').mockResolvedValue({
      authorization: { result: { permissions: [] } },
    } as never);

    await getCurrentCustomerInfo();

    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules([]));
  });
});

describe('getCurrentCustomerInfo company error during token exchange', () => {
  const b2bGraphql = graphql.link('https://api-b2b.bigcommerce.com/graphql');
  const pendingApprovalMessage =
    'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.';

  beforeEach(() => {
    vi.spyOn(store, 'dispatch').mockImplementation(() => undefined as never);
    vi.spyOn(b2bLogger, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(snackbar, 'error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not show a snackbar when getB2BToken returns a company error during init', async () => {
    vi.spyOn(store, 'getState').mockReturnValue({
      company: { tokens: { B2BToken: '', currentCustomerJWT: '' } },
      global: { featureFlags: { [BC_AUTH_FLAG]: true } },
    } as unknown as ReturnType<typeof store.getState>);

    vi.spyOn(bcService, 'getCurrentCustomerJWT').mockResolvedValue('new-jwt');
    server.use(
      b2bGraphql.operation(() =>
        HttpResponse.json({ errors: [{ message: pendingApprovalMessage }] }),
      ),
    );

    await expect(getCurrentCustomerInfo()).rejects.toBeInstanceOf(CompanyError);

    expect(snackbar.error).not.toHaveBeenCalled();
  });
});

describe('ensureBcGraphqlToken', () => {
  const b2bGraphql = graphql.link('https://api-b2b.bigcommerce.com/graphql');

  beforeEach(() => {
    vi.spyOn(store, 'dispatch').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('coalesces concurrent storefront token requests into one network call', async () => {
    vi.spyOn(store, 'getState').mockReturnValue({
      company: { tokens: { B2BToken: '', bcGraphqlToken: '' } },
    } as ReturnType<typeof store.getState>);

    let requestCount = 0;
    server.use(
      b2bGraphql.mutation('storeFrontToken', () => {
        requestCount += 1;
        return HttpResponse.json({ data: { storeFrontToken: { token: 'fresh-token' } } });
      }),
    );

    await Promise.all([ensureBcGraphqlToken(), ensureBcGraphqlToken()]);

    expect(requestCount).toBe(1);
    expect(store.dispatch).toHaveBeenCalledWith(setBcGraphQLToken('fresh-token'));
  });

  it('resets the in-flight state after a failed fetch, allowing a retry', async () => {
    vi.spyOn(store, 'getState').mockReturnValue({
      company: { tokens: { B2BToken: '', bcGraphqlToken: '' } },
    } as ReturnType<typeof store.getState>);

    let callCount = 0;
    server.use(
      b2bGraphql.mutation('storeFrontToken', () => {
        callCount += 1;
        return callCount === 1
          ? HttpResponse.error()
          : HttpResponse.json({ data: { storeFrontToken: { token: 'retry-token' } } });
      }),
    );

    await expect(ensureBcGraphqlToken()).rejects.toThrow();
    await ensureBcGraphqlToken();

    expect(store.dispatch).toHaveBeenCalledWith(setBcGraphQLToken('retry-token'));
  });
});
