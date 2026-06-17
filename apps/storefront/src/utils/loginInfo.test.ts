import * as b2bService from '@/shared/service/b2b';
import * as bcService from '@/shared/service/bc';
import { store } from '@/store';
import { setPermissionModules } from '@/store/slices/company';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';

import b2bLogger from './b3Logger';
import { getCurrentCustomerInfo } from './loginInfo';

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
      permissions: QUERY_PERMISSIONS,
    },
  } as never);

  vi.spyOn(b2bService, 'getUserCompany').mockResolvedValue({
    userCompany: { id: '79', companyName: 'Acme', companyStatus: CompanyStatus.APPROVED },
  } as never);

  vi.spyOn(bcService, 'bcAuthorization').mockResolvedValue({
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

  it('sources permissions from bcAuthorization when the BC login flag is on', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true });

    const result = await getCurrentCustomerInfo();

    // the customer-info query is asked to skip the permissions selection
    expect(b2bService.getB2BCompanyUserInfo).toHaveBeenCalledWith(true);
    expect(bcService.bcAuthorization).toHaveBeenCalledWith(
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

    await getCurrentCustomerInfo();

    expect(b2bService.getB2BCompanyUserInfo).toHaveBeenCalledWith(false);
    expect(bcService.bcAuthorization).not.toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules(QUERY_PERMISSIONS));
  });

  it('dispatches an empty permission set when bcAuthorization fails', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true });
    vi.spyOn(bcService, 'bcAuthorization').mockRejectedValue(new Error('network'));

    await getCurrentCustomerInfo();

    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules([]));
  });

  it('preserves already-loaded permissions when no customer JWT is available', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true }, '');
    vi.spyOn(bcService, 'getCurrentCustomerJWT').mockResolvedValue('');

    await getCurrentCustomerInfo();

    expect(bcService.bcAuthorization).not.toHaveBeenCalled();
    expect(permissionsWereDispatched()).toBe(false);
  });

  it('dispatches an empty permission set when bcAuthorization returns one', async () => {
    mockState({ [BC_AUTH_FLAG]: true, [COMBINED_QUERY_FLAG]: true });
    vi.spyOn(bcService, 'bcAuthorization').mockResolvedValue({
      authorization: { result: { permissions: [] } },
    } as never);

    await getCurrentCustomerInfo();

    expect(store.dispatch).toHaveBeenCalledWith(setPermissionModules([]));
  });
});
