import { useEffect, useMemo, useState } from 'react';

import { en, localeLoaders } from './locales';
import { getFallbackLocale } from './pickLocaleBundle';

type LocaleMessages = Record<string, string>;

const cache = new Map<string, LocaleMessages>();
const failed = new Set<string>();

export const clearLocaleBundleCache = () => {
  cache.clear();
  failed.clear();
};

const candidatesFor = (code: string): string[] => {
  const fallback = getFallbackLocale(code);
  return fallback ? [code, fallback] : [code];
};

interface UseLocaleBundleResult {
  ready: boolean;
  bundles: Record<string, LocaleMessages | undefined>;
}

export function useLocaleBundle(code: string): UseLocaleBundleResult {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (code === 'en') return undefined;
    const missing = candidatesFor(code).filter(
      (c) => c !== 'en' && localeLoaders[c] && !cache.has(c) && !failed.has(c),
    );
    if (missing.length === 0) return undefined;

    let cancelled = false;
    Promise.all(
      missing.map(async (c) => {
        const loader = localeLoaders[c];
        try {
          cache.set(c, await loader());
        } catch {
          failed.add(c);
        }
      }),
    )
      .then(() => {
        if (!cancelled) setTick((t) => t + 1);
      })
      .catch(() => {
        if (!cancelled) setTick((t) => t + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const ready =
    code === 'en' ||
    candidatesFor(code).every(
      (c) => c === 'en' || !localeLoaders[c] || cache.has(c) || failed.has(c),
    );

  const bundles = useMemo(() => {
    const result: Record<string, LocaleMessages | undefined> = { en };
    cache.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [tick]);

  return { ready, bundles };
}
