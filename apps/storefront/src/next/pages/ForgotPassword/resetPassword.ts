import { BigCommerceStorefrontAPIBaseURL } from '@/utils';

import { type ResetPassword } from './view';

// this is the non-captcha version
export const resetPassword: ResetPassword = async (emailAddress) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append('email', emailAddress);

  return fetch(`${BigCommerceStorefrontAPIBaseURL}/login.php?action=send_password_email`, {
    method: 'POST',
    body: urlencoded,
    redirect: 'follow',
  })
    .then(() => undefined)
    .catch(() => Promise.reject());
};
