import { bcLogin, bcLogoutLogin } from '@/shared/service/bc';
import b2bLogger from '@/utils/b3Logger';
import { refreshB2BToken, refreshCurrentCustomerJWT } from '@/utils/loginInfo';
import { logoutSession } from '@/utils/logoutSession';

interface Credentials {
  email: string;
  password: string;
}

/** Storefront login after account creation; throws if the login mutation returns errors. */
export async function loginAndGetBcCustomer(credentials: Credentials, errorMessage: string) {
  const response = await bcLogin({ email: credentials.email, password: credentials.password });
  if (response.errors?.length) {
    throw new Error(response.errors[0]?.message || errorMessage);
  }
  const customer = response.data?.login?.customer;
  if (!customer) {
    throw new Error(errorMessage);
  }
  // Valid JWT token is required to get the fileID from the upload API
  const currentCustomerJWT = await refreshCurrentCustomerJWT();
  if (!currentCustomerJWT) {
    throw new Error(errorMessage);
  }
  await refreshB2BToken(currentCustomerJWT);
  return customer;
}

/**
 * Best-effort storefront session logout after registration (e.g. PENDING company).
 * Does not throw: a non-success or failed logout must not block the registration completion UI (see `useLogout`).
 */
export async function logoutBcCustomer(): Promise<void> {
  try {
    const res = await bcLogoutLogin();
    if (res.data?.logout?.result !== 'success') {
      b2bLogger.error('Storefront logout did not return success after registerCompany');
    }
  } catch (e) {
    b2bLogger.error(e);
  } finally {
    logoutSession();
  }
}
