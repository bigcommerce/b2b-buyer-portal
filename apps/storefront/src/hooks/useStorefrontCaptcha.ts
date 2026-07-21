import { useEffect, useState } from 'react';

import { getStorefrontToken } from '@/shared/service/b2b/graphql/recaptcha';
import b2bLogger from '@/utils/b3Logger';

interface StorefrontCaptcha {
  isCaptchaEnabled: boolean;
  captchaSiteKey: string;
  isCaptchaConfigLoading: boolean;
}

// Loads the storefront reCaptcha config (whether it's enabled + the site key) once, when
// `enabled` is true. Shared by the flows that submit reCaptcha-protected storefront
// mutations (account settings, forgot password) so the load logic isn't duplicated.
export function useStorefrontCaptcha(enabled = true): StorefrontCaptcha {
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [captchaSiteKey, setCaptchaSiteKey] = useState('');
  const [isCaptchaConfigLoading, setIsCaptchaConfigLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setIsCaptchaConfigLoading(false);
      return;
    }
    setIsCaptchaConfigLoading(true);
    const loadConfig = async () => {
      try {
        const reCaptcha = await getStorefrontToken();
        if (reCaptcha) {
          setIsCaptchaEnabled(reCaptcha.isEnabledOnStorefront);
          setCaptchaSiteKey(reCaptcha.siteKey);
        }
      } catch (error) {
        b2bLogger.error(error);
      } finally {
        setIsCaptchaConfigLoading(false);
      }
    };
    loadConfig();
  }, [enabled]);

  return { isCaptchaEnabled, captchaSiteKey, isCaptchaConfigLoading };
}
