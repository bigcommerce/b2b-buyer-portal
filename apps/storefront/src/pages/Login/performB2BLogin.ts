import { b2bLogin } from '@/shared/service/bc';
import { channelId, storeHash } from '@/utils/basicConfig';

import { LoginConfig } from './helper';

export async function performB2BLogin(
  data: LoginConfig,
): Promise<{ token: string; storefrontLoginToken: string; errors?: { message: string }[] }> {
  const {
    login: {
      result: { token, storefrontLoginToken },
      errors,
    },
  } = await b2bLogin({
    loginData: {
      email: data.email,
      password: data.password,
      storeHash,
      channelId,
    },
  });
  return { token, storefrontLoginToken, errors };
}
