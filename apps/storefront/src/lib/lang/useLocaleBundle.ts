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

const determineLocaleToLoad = (code: string): string | null => {
  if (localeLoaders[code]) {
    return code;
  }
  const fallback = getFallbackLocale(code);
  if (fallback && localeLoaders[fallback]) {
    return fallback;
  }
  return null;
};

interface UseLocaleBundleResult {
  ready: boolean;
  bundles: Record<string, LocaleMessages | undefined>;
}

export function useLocaleBundle(code: string): UseLocaleBundleResult {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (code === 'en') return undefined;

    const toLoad = determineLocaleToLoad(code);
    if (!toLoad || cache.has(toLoad) || failed.has(toLoad)) {
      return undefined;
    }

    let cancelled = false;
    const loader = localeLoaders[toLoad];

    loader()
      .then((messages) => {
        if (!cancelled) {
          cache.set(toLoad, messages);
          setTick((t) => t + 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          failed.add(toLoad);
          setTick((t) => t + 1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const ready =
    code === 'en' ||
    (() => {
      const toLoad = determineLocaleToLoad(code);
      return !toLoad || cache.has(toLoad) || failed.has(toLoad);
    })();

  const bundles = useMemo(() => {
    const result: Record<string, LocaleMessages | undefined> = { en };
    cache.forEach((value, key) => {
      result[key] = value;
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is a version counter signalling cache mutation; cache is a stable module-level ref
  }, [tick]);

  return { ready, bundles };
}
