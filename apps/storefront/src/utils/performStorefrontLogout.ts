import { bcLogoutLogin } from '@/shared/service/bc';
import b2bLogger from '@/utils/b3Logger';
import { ensureBcGraphqlToken } from '@/utils/loginInfo';
import { logoutSession } from '@/utils/logoutSession';

/**
 * Calls the BC storefront logout mutation, then always clears the session and
 * restores a guest graphql token.  The optional `afterSuccess` callback runs
 * when the mutation returns `result === 'success'` (e.g. masquerade teardown
 * in `useLogout`); it is skipped and its errors are swallowed on failure so
 * the session-clear path always executes.
 */
export async function performStorefrontLogout(
  afterSuccess?: () => Promise<unknown>,
): Promise<void> {
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
