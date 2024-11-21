import { BigCommerceStorefrontAPIBaseURL, platform } from '../../../../utils/basicConfig';
import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

export const getBCForgotPassword = (data: CustomFieldItems) =>
  B3Request.post(
    `${BigCommerceStorefrontAPIBaseURL}/login.php?action=send_password_email`,
    RequestType.BCRest,
    data,
  );
/**
 * This function it's still present due the merchant can logs in as a client and stencil channels trade the current customer jwt to recognize
 * which user log in on the channel
 */
export const getCurrentCustomerJWT = async (app_client_id: string) => {
  if (platform !== 'bigcommerce') {
    return undefined;
  }
  const response = await fetch(
    `${BigCommerceStorefrontAPIBaseURL}/customer/current.jwt?app_client_id=${app_client_id}`,
  );
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.text() as Promise<string>;
};

/**
 * In order to be less dependent on current customer jwt, this function it's called every time an user logs in by using the login form
 * it makes the stencil channel recognize the user who log in the channel
 */
export const customerLoginAPI = (storefrontLoginToken: string) => {
  if (platform !== 'bigcommerce') {
    return;
  }
  fetch(`${BigCommerceStorefrontAPIBaseURL}/login/token/${storefrontLoginToken}`, {
    method: 'GET',
  });
};
