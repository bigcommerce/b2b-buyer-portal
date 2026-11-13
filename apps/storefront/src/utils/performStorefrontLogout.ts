import { b2bLogout } from '@/shared/service/b2b';
import { bcLogoutLogin } from '@/shared/service/bc';
import { store } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { ensureBcGraphqlToken } from '@/utils/loginInfo';
import { logoutSession } from '@/utils/logoutSession';

/**
 * Revokes the B2B token server-side (B2B-5611). Must run before the session is
 * cleared, since the request is authenticated with the token being revoked.
 * Failures are logged and swallowed so the BC logout and session clear always run.
 */
async function revokeB2BToken(): Promise<void> {
  if (!store.getState().company.tokens.B2BToken) {
    return;
  }
  try {
    await b2bLogout();
  } catch (e) {
    b2bLogger.error(e);
  }
}

/**
 * Revokes the B2B token, calls the BC storefront logout mutation, then always
 * clears the session and restores a guest graphql token.  The optional
 * `afterSuccess` callback runs when the BC mutation returns `result === 'success'`
 * (e.g. masquerade teardown in `useLogout`); it is skipped and its errors are
 * swallowed on failure so the session-clear path always executes.
 */
export async function performStorefrontLogout(
  afterSuccess?: () => Promise<unknown>,
): Promise<void> {
  await revokeB2BToken();
  try {
    const res = await bcLogoutLogin();
    if (res.data?.logout?.result !== 'success') {
      return;
    }
    await afterSuccess?.();
  } catch (e) {
    b2bLogger.error(e);
  } finally {
    // SUP-1282 Clear sessionStorage to allow visitors to display the checkout page
    window.sessionStorage.clear();
    logoutSession();
    try {
      await ensureBcGraphqlToken();
    } catch (e) {
      b2bLogger.error(e);
    }
  }
}
