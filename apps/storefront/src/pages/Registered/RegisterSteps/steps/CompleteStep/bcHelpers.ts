import { bcLogin, bcLogoutLogin } from '@/shared/service/bc';
import { store } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { loginInfo } from '@/utils/loginInfo';

interface Credentials {
  email: string;
  password: string;
}

/** `registerCompany` uses Storefront GraphQL (`graphqlBC` or `graphqlBCProxy` by platform), which requires a storefront session token in the store. */
export async function ensureBcStorefrontGraphqlToken(): Promise<void> {
  if (store.getState().company.tokens.bcGraphqlToken) return;
  await loginInfo();
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
