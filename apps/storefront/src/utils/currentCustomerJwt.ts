import { getCurrentCustomerJWT } from '@/shared/service/bc';
import { getAppClientId } from '@/shared/service/request/base';

import b2bLogger from './b3Logger';

// Fetch the BC customer JWT from the storefront. Returns '' on failure (logged).
// Store-free on purpose: callers persist with the dispatch available in their own
// context (useAppDispatch in components, the store singleton in non-React utils).
export const fetchCurrentCustomerJwt = async (): Promise<string> => {
  const jwt = await getCurrentCustomerJWT(getAppClientId()).catch((error) => {
    b2bLogger.error(error);
    return '';
  });

  return jwt ?? '';
};

// Single chokepoint for JWT validity so callers don't repeat the check.
// TODO(B2B-4930): decode and verify the token (e.g. exp) instead of a presence check.
export const isCustomerJwtValid = (jwt: string): boolean => Boolean(jwt);
