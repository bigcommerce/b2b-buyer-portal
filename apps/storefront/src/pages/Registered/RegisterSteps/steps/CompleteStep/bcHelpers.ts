import { bcLogin } from '@/shared/service/bc';
import { store } from '@/store';
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
