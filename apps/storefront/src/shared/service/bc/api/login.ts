import { BigCommerceStorefrontAPIBaseURL, platform } from '../../../../utils/basicConfig';

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
  const bcToken = await response.text();

  if (!response.ok) {
    if (bcToken.includes('errors')) {
      return undefined;
    }

    throw new Error(response.statusText);
  }

  return bcToken;
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
