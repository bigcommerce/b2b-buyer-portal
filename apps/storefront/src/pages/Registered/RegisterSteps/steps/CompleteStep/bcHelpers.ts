import { bcLogin } from '@/shared/service/bc';
import { refreshB2BToken, refreshCurrentCustomerJWT } from '@/utils/loginInfo';

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
