import { bcLogin, bcLogoutLogin } from '@/shared/service/bc';
import b2bLogger from '@/utils/b3Logger';

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
  }
}
