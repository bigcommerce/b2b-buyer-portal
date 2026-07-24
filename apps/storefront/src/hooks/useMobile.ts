import { useEffect, useState } from 'react';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const MOBILE_BREAKPOINT_PX = 768;

const useMobile = (): [boolean] => {
  const dedupeStorefrontConfigFetchCalls = useFeatureFlag(
    'B2B-5309.dedupe_storefront_config_fetch_calls',
  );

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    dedupeStorefrontConfigFetchCalls ? document.body.clientWidth <= MOBILE_BREAKPOINT_PX : false,
  );

  useEffect(() => {
    const resize = () => {
      setIsMobile(document.body.clientWidth <= MOBILE_BREAKPOINT_PX);
    };

    if (!dedupeStorefrontConfigFetchCalls) {
      resize();
    }

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [dedupeStorefrontConfigFetchCalls]);

  return [isMobile];
};

export { useMobile };
