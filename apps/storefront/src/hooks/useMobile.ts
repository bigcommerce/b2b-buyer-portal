import { useEffect, useState } from 'react';

const SPECIAL_URL_PATTERNS = ['quoteDraft', 'quoteDetail'];

const useMobile = (pathName?: string): [boolean] => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const resize = () => {
      const isSpecialUrl = SPECIAL_URL_PATTERNS.some((pattern) => pathName?.includes(pattern));
      const breakpoint = isSpecialUrl ? 958 : 768;

      setIsMobile(document.body.clientWidth <= breakpoint);
    };

    resize();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [pathName]);

  return [isMobile];
};

export { useMobile };
