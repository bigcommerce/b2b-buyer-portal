import { useEffect, useState } from 'react';

const SPECIAL_URL_PATTERNS = [
  '/#/quoteDraft',
  '/#/quotes',
  '/#/quoteDetail'
];

const useMobile = (): [boolean] => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const resize = () => {
      const url = window.location.href;
      const isSpecialUrl = SPECIAL_URL_PATTERNS.some(pattern => url.includes(pattern));
      const breakpoint = isSpecialUrl ? 958 : 768;

      setIsMobile(document.body.clientWidth <= breakpoint);
    };

    resize();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return [isMobile];
};

export { useMobile };
