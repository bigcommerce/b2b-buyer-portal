import { useEffect, useState } from 'react';

import { en, localeLoaders } from './locales';

type LocaleMessages = Record<string, string>;

const cache = new Map<string, LocaleMessages | undefined>();

const candidatesFor = (code: string): string[] => {
  const dashIdx = code.indexOf('-');
  const lang = dashIdx > 0 ? code.slice(0, dashIdx) : '';
  return lang && lang !== code ? [code, lang] : [code];
};

interface UseLocaleBundleResult {
  ready: boolean;
  bundles: Record<string, LocaleMessages | undefined>;
}

export function useLocaleBundle(code: string): UseLocaleBundleResult {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (code === 'en') return undefined;
    const missing = candidatesFor(code).filter((c) => c !== 'en' && !cache.has(c));
    if (missing.length === 0) return undefined;

    let cancelled = false;
    Promise.all(
      missing.map(async (c) => {
        const loader = localeLoaders[c];
        cache.set(c, loader ? await loader() : undefined);
      }),
    ).then(() => {
      if (!cancelled) setTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const ready = code === 'en' || candidatesFor(code).every((c) => c === 'en' || cache.has(c));

  const bundles: Record<string, LocaleMessages | undefined> = { en };
  cache.forEach((value, key) => {
    bundles[key] = value;
  });

  return { ready, bundles };
}
