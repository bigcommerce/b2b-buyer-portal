import { useCallback, useEffect, useRef } from 'react';

const getLocaleFromURL = (): string => {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const potentialLocale = pathSegments[0];

  if (potentialLocale && /^[a-z]{2}(-[A-Z]{2})?$/i.test(potentialLocale)) {
    return potentialLocale.toLowerCase();
  }

  const cookie = document.cookie.split('; ').find((row) => row.startsWith('NEXT_LOCALE='));

  if (cookie) {
    return cookie.split('=')[1];
  }

  return 'en';
};

export const useLocaleSync = (onLocaleChange: (newLocale: string) => void) => {
  const currentLocaleRef = useRef(getLocaleFromURL());

  const checkLocale = useCallback(() => {
    const newLocale = getLocaleFromURL();
    if (newLocale !== currentLocaleRef.current) {
      currentLocaleRef.current = newLocale;
      onLocaleChange(newLocale);
    }
  }, [onLocaleChange]);

  useEffect(() => {
    const handlePopState = () => checkLocale();
    window.addEventListener('popstate', handlePopState);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkLocale();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const pollInterval = setInterval(checkLocale, 500);

    checkLocale();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
    };
  }, [checkLocale]);

  return currentLocaleRef.current;
};
