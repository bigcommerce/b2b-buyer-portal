import b2bLogger from '@/utils/b3Logger';
import { BigCommerceStorefrontAPIBaseURL } from '@/utils/basicConfig';

export const sendForgotPasswordEmailFor = (email: string) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append('email', email);

  const requestOptions: RequestInit = {
    method: 'POST',
    body: urlencoded,
    redirect: 'follow',
  };

  return fetch(
    `${BigCommerceStorefrontAPIBaseURL}/login.php?action=send_password_email`,
    requestOptions,
  )
    .then((response) => response.text())
    .catch((error) => b2bLogger.error('error', error));
};
